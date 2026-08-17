'use server';

import { Resend } from 'resend';

import {
  INVITATION_REQUIRED_MESSAGE,
  isActiveBetaSignupInvitation,
} from '@/lib/auth/invitations';
import { mapAuthErrorMessage } from '@/lib/auth/messages';
import { buildCanonicalAuthUrl } from '@/lib/auth/origins';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';

type ActionResult = {
  success: boolean;
  message: string;
};

function buildConfirmRedirectTo(): string {
  return buildCanonicalAuthUrl('/auth/callback?next=/onboarding');
}

function isRateLimitError(message: string | undefined): boolean {
  const lower = (message ?? '').toLowerCase();
  return (
    lower.includes('rate limit') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('email rate limit')
  );
}

/**
 * Defense in depth for server-side signup and its service-role email fallback.
 * The Supabase before-user-created hook remains the authoritative boundary and
 * also blocks callers that bypass this Server Action.
 */
async function hasActiveBetaSignupInvitation(email: string): Promise<boolean | null> {
  const admin = createServiceClient();

  // Without a service-role client, proceed to Auth and let the database hook
  // make the authoritative decision. The service-role fallback is also disabled.
  if (!admin) return null;

  const { data, error } = await admin
    .from('beta_signup_invitations')
    .select('accepted_at, expires_at, revoked_at')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('beta signup invitation preflight failed');
    return false;
  }

  return isActiveBetaSignupInvitation(data);
}

/**
 * Deliver a confirmation email via Resend using an admin-generated link.
 * Bypasses Supabase's built-in mailer rate limit when service role + Resend are configured.
 */
async function deliverConfirmationWithResend(input: {
  email: string;
  /** Required when generating a fresh signup link for a brand-new user. */
  password?: string;
}): Promise<ActionResult> {
  const admin = createServiceClient();
  const resendKey = process.env.RESEND_API_KEY;

  if (!admin || !resendKey) {
    return {
      success: false,
      message:
        'Confirmation email could not be sent because email delivery is not fully configured.',
    };
  }

  const redirectTo = buildConfirmRedirectTo();

  const linkResult = input.password
    ? await admin.auth.admin.generateLink({
        type: 'signup',
        email: input.email,
        password: input.password,
        options: { redirectTo },
      })
    : await admin.auth.admin.generateLink({
        // Existing unconfirmed users: magic link confirms and signs them in.
        type: 'magiclink',
        email: input.email,
        options: { redirectTo },
      });

  const { data, error } = linkResult;

  if (error || !data?.properties?.action_link) {
    const lower = (error?.message ?? '').toLowerCase();
    if (lower.includes('already') || lower.includes('registered')) {
      return {
        success: true,
        message:
          'If that email already has a confirmed Forge account, sign in instead. Otherwise check spam or reset your password.',
      };
    }
    console.error('generateLink for confirmation failed');
    return {
      success: false,
      message: mapAuthErrorMessage(error?.message) || 'Could not prepare a confirmation email.',
    };
  }

  const actionLink = data.properties.action_link;
  const resend = new Resend(resendKey);

  try {
    const result = await resend.emails.send({
      from: 'Forge <hello@forgedinlife.com>',
      to: input.email,
      subject: 'Confirm your Forge account',
      html: `
        <h2>Confirm your Forge account</h2>
        <p>Thanks for joining Forge. Confirm your email to continue into onboarding.</p>
        <p><a href="${actionLink}">Confirm email and continue</a></p>
        <p>If you did not create this account, you can ignore this message.</p>
      `,
    });

    if (result.error) {
      console.error('Resend confirmation email failed');
      return {
        success: false,
        message: 'We could not send the confirmation email. Please try again in a few minutes.',
      };
    }

    return {
      success: true,
      message:
        'Confirmation email sent. Check your inbox (and spam), then continue into Forge onboarding.',
    };
  } catch {
    console.error('Resend confirmation email threw');
    return {
      success: false,
      message: 'We could not send the confirmation email. Please try again in a few minutes.',
    };
  }
}

/**
 * Resend signup confirmation email with the correct environment redirect.
 * Prefers Resend delivery when configured; otherwise uses Supabase Auth resend.
 */
export async function resendConfirmationEmail(input: {
  email: string;
}): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Enter a valid email address.' };
  }

  // Prefer Resend + generateLink so delivery is not blocked by built-in Auth mailer limits.
  if (createServiceClient() && process.env.RESEND_API_KEY) {
    return deliverConfirmationWithResend({ email });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: buildConfirmRedirectTo(),
    },
  });

  if (error) {
    console.error('resendConfirmationEmail failed');
    if (isRateLimitError(error.message) && createServiceClient() && process.env.RESEND_API_KEY) {
      return deliverConfirmationWithResend({ email });
    }
    return { success: false, message: mapAuthErrorMessage(error.message) };
  }

  return {
    success: true,
    message: 'If an account needs confirmation, a new email is on the way. Check your inbox.',
  };
}

export type SignUpActionResult = {
  success: boolean;
  message: string;
  status: 'session' | 'confirmation_sent' | 'already_registered' | 'error';
};

/**
 * Create an account and only report "check your email" when delivery was accepted.
 */
export async function signUpWithEmail(input: {
  email: string;
  password: string;
}): Promise<SignUpActionResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !email.includes('@')) {
    return { success: false, message: 'Enter a valid email address.', status: 'error' };
  }
  if (!password || password.length < 8) {
    return {
      success: false,
      message: 'Use a password with at least 8 characters.',
      status: 'error',
    };
  }
  const hasInvitation = await hasActiveBetaSignupInvitation(email);
  if (hasInvitation === false) {
    return {
      success: false,
      message: INVITATION_REQUIRED_MESSAGE,
      status: 'error',
    };
  }

  const emailRedirectTo = buildConfirmRedirectTo();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });

  if (error) {
    // If Auth mailer is rate-limited but we can deliver via Resend, create/link and send.
    if (isRateLimitError(error.message) && createServiceClient() && process.env.RESEND_API_KEY) {
      const admin = createServiceClient()!;
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
      });

      if (created.error) {
        const msg = created.error.message.toLowerCase();
        if (msg.includes('already') || msg.includes('registered')) {
          return {
            success: true,
            status: 'already_registered',
            message:
              'If an account already exists for that email, sign in instead. You can reset your password or resend confirmation from the sign-in page.',
          };
        }
        return {
          success: false,
          status: 'error',
          message: mapAuthErrorMessage(created.error.message),
        };
      }

      const delivered = await deliverConfirmationWithResend({
        email,
        password,
      });
      if (!delivered.success) {
        return { success: false, status: 'error', message: delivered.message };
      }
      return {
        success: true,
        status: 'confirmation_sent',
        message: delivered.message,
      };
    }

    return {
      success: false,
      status: 'error',
      message: mapAuthErrorMessage(error.message),
    };
  }

  const identities = data.user?.identities ?? [];
  if (data.session) {
    return { success: true, status: 'session', message: 'Signed in.' };
  }

  if (!data.user || identities.length === 0) {
    return {
      success: true,
      status: 'already_registered',
      message:
        'If an account already exists for that email, sign in instead. You can reset your password or resend confirmation from the sign-in page.',
    };
  }

  // signUp already generated and sent the one-time confirmation token. Generating a
  // second signup link here would invalidate the first email and strand the user.
  // Resend remains a fallback above only when Supabase's built-in mailer is rate-limited.
  return {
    success: true,
    status: 'confirmation_sent',
    message:
      'Check your email to confirm your account. After you confirm, you will continue into Forge onboarding.',
  };
}

export async function requestPasswordReset(input: {
  email: string;
}): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Enter a valid email address.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildCanonicalAuthUrl(
      '/auth/callback?next=/auth/update-password'
    ),
  });

  if (error) {
    console.error('requestPasswordReset failed');
    return { success: false, message: mapAuthErrorMessage(error.message) };
  }

  return {
    success: true,
    message: 'If an account exists for that email, a password reset link is on the way.',
  };
}
