'use server';

import { Resend } from 'resend';

import { createServiceClient } from '@/lib/supabase/admin';

export type FoundingBetaRequestState = {
  success: boolean;
  message: string;
};

const GENERIC_SUCCESS =
  'Your request is in. After Forge completes its private review, we will email your personal invitation.';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sendSubmissionEmails(input: {
  firstName: string;
  email: string;
  location: string;
  gender: string;
  interestedIn: string[];
  relationshipGoal: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const resend = new Resend(key);
  const firstName = escapeHtml(input.firstName);
  const adminUrl = 'https://forge.forgedinlife.com/internal/founding-beta';

  const [memberResult, adminResult] = await Promise.all([
    resend.emails.send({
      from: 'Forge <hello@forgedinlife.com>',
      to: input.email,
      subject: 'We received your Forge Founding Beta request',
      html: `
        <h2>Thank you, ${firstName}.</h2>
        <p>Your request to join the Forge Founding Beta has been received.</p>
        <p>Submitting a request does not create an account. After Forge completes its private review, we will send a separate personal invitation tied to this email address.</p>
        <p>Strong Values. Strong Connections.</p>
        <p>The Forge Team</p>
      `,
    }),
    resend.emails.send({
      from: 'Forge <hello@forgedinlife.com>',
      to: 'admin@forgedinlife.com',
      subject: `New Founding Beta request: ${input.firstName}`,
      html: `
        <h2>New Founding Beta request</h2>
        <p><strong>Name:</strong> ${firstName}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Location:</strong> ${escapeHtml(input.location)}</p>
        <p><strong>Gender:</strong> ${escapeHtml(input.gender)}</p>
        <p><strong>Interested in:</strong> ${escapeHtml(input.interestedIn.join(', '))}</p>
        <p><strong>Relationship goal:</strong> ${escapeHtml(input.relationshipGoal)}</p>
        <p><a href="${adminUrl}">Review the private Founding Beta queue</a></p>
      `,
    }),
  ]);

  if (memberResult.error || adminResult.error) {
    console.error('Founding Beta request email notification was not fully delivered.');
  }
}

export async function submitFoundingBetaRequest(
  _previousState: FoundingBetaRequestState,
  formData: FormData
): Promise<FoundingBetaRequestState> {
  // Quiet bot trap. Real visitors never see or populate this field.
  if (text(formData, 'website')) return { success: true, message: GENERIC_SUCCESS };

  const firstName = text(formData, 'first_name');
  const email = text(formData, 'email').toLowerCase();
  const location = text(formData, 'location');
  const gender = text(formData, 'gender');
  const interestedIn = formData
    .getAll('interested_in')
    .map((value) => String(value))
    .filter((value) => value === 'men' || value === 'women');
  const relationshipGoal = text(formData, 'relationship_goal');
  const heardAboutForge = text(formData, 'heard_about_forge');
  const adultConfirmed = formData.get('adult_confirmed') === 'on';
  const feedbackAgreed = formData.get('feedback_agreed') === 'on';
  const standardsAgreed = formData.get('standards_agreed') === 'on';

  if (firstName.length < 1 || firstName.length > 80) {
    return { success: false, message: 'Enter your first name.' };
  }
  if (!validEmail(email)) {
    return { success: false, message: 'Enter a valid email address.' };
  }
  if (location.length < 2 || location.length > 120) {
    return { success: false, message: 'Enter your city and state or general location.' };
  }
  if (!['man', 'woman'].includes(gender)) {
    return { success: false, message: 'Choose the option that describes you.' };
  }
  if (interestedIn.length < 1 || new Set(interestedIn).size !== interestedIn.length) {
    return { success: false, message: 'Choose who you are interested in meeting.' };
  }
  if (!['marriage', 'serious_relationship', 'intentional_dating'].includes(relationshipGoal)) {
    return { success: false, message: 'Choose what you are looking for.' };
  }
  if (heardAboutForge.length > 160) {
    return { success: false, message: 'Keep the referral response under 160 characters.' };
  }
  if (!adultConfirmed || !feedbackAgreed || !standardsAgreed) {
    return { success: false, message: 'Confirm all three Founding Beta agreements.' };
  }

  const admin = createServiceClient();
  if (!admin) {
    return {
      success: false,
      message: 'Founding Beta requests are temporarily unavailable. Please try again later.',
    };
  }

  const { error } = await admin.from('founding_beta_requests').insert({
    first_name: firstName,
    email,
    location,
    gender,
    interested_in: [...new Set(interestedIn)],
    relationship_goal: relationshipGoal,
    heard_about_forge: heardAboutForge || null,
    adult_confirmed: adultConfirmed,
    feedback_agreed: feedbackAgreed,
    standards_agreed: standardsAgreed,
  });

  if (error && error.code !== '23505') {
    console.error('Founding Beta request could not be saved.', {
      code: error.code,
      message: error.message,
    });
    return { success: false, message: 'Your request could not be submitted. Please try again.' };
  }

  if (!error) {
    await sendSubmissionEmails({
      firstName,
      email,
      location,
      gender,
      interestedIn,
      relationshipGoal,
    });
  }

  // Duplicate addresses receive the same response to avoid exposing private queue state.
  return { success: true, message: GENERIC_SUCCESS };
}
