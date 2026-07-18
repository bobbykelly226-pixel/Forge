# Forge Auth Redirect & Email Configuration

Production site: `https://forgedinlife.com`

## Application routes

- Signup `emailRedirectTo`: `{origin}/auth/callback?next=/onboarding`
- Password reset `redirectTo`: `{origin}/auth/callback?next=/auth/update-password`
- Update password page: `/auth/update-password` (set a new password after recovery session)
- Callback page: `/auth/callback` (handles URL hash tokens, PKCE `code`, and `token_hash`)
- Confirm route: `/auth/confirm` (SSR `token_hash` + `type` template flow)
- Result page: `/auth/result?outcome=…` (confirmed / already confirmed / invalid-or-expired)
- Legacy error page: `/auth/error` (redirects to `/auth/result` with a classified outcome)
- Resend confirmation: login screen action → same `emailRedirectTo`

### Confirmation outcomes

| Outcome | When | User-facing result |
| --- | --- | --- |
| `session_ready` | Confirm succeeds and a session is established | Foundation records ensured → `/onboarding` (or completed-profile destination) |
| `confirmed_needs_signin` | Confirm succeeds but session cookies are not usable yet | “Email confirmed” → sign in (never “invalid or expired”) |
| `already_confirmed` | Link previously consumed / account already confirmed | “Your email has already been confirmed. Sign in to continue.” |
| `invalid_or_expired` | Link genuinely missing, invalid, or expired | “Confirmation needed” + resend guidance |

Custom SMTP (Resend) remains required for reliable delivery — see below. Re-testing signup is optional when an already-confirmed account reproduces the callback/hash outcome.

## Required Supabase Dashboard settings

### URL Configuration

1. Open **Supabase Dashboard → Project Forge → Authentication → URL Configuration**
2. **Site URL** = `https://forgedinlife.com`
3. **Redirect URLs** must include all of:
   - `https://forgedinlife.com/**`
   - `http://localhost:3000/**`
   - `http://127.0.0.1:3000/**`
   - `https://*-bobbykelly226-pixel.vercel.app/**`
   - `https://*-forgedbydesign.vercel.app/**` (current Vercel team previews)
4. Save.

### Password policy (recommended before public launch)

1. Open **Authentication → Providers → Email** (or **Authentication → Settings** depending on dashboard version)
2. Set **Minimum password length** to **8** (app already enforces 8; local `config.toml` still defaults to 6)
3. Enable **Leaked password protection** if available on the plan (**Authentication → Attack Protection** / password strength)
4. Review **Attack Protection**: enable CAPTCHA (hCaptcha/Turnstile) for signup/login/recovery before broad public traffic
5. Enable **Secure password change** so password updates require recent reauthentication once an in-app change-password path is expanded beyond recovery links

### Custom SMTP (required for reliable confirmation email)

Supabase’s built-in Auth mailer is rate-limited and often fails to deliver (especially to Yahoo). Forge already uses Resend for waitlist mail — Auth must use the same provider.

1. Open **Supabase Dashboard → Project Forge → Authentication → Emails → SMTP Settings**
2. Enable **Custom SMTP**
3. Set these exact values:
   - **Sender email:** `hello@forgedinlife.com`
   - **Sender name:** `Forge`
   - **Host:** `smtp.resend.com`
   - **Port number:** `465`
   - **Username:** `resend`
   - **Password:** your Resend API key (same value as `RESEND_API_KEY`)
4. Save
5. Open **Authentication → Rate Limits**
6. Raise **Email** / “emails sent” to at least **30 per hour** (available after custom SMTP is enabled)
7. Save

Optional (recommended for cookie SSR without hash tokens):

1. Open **Authentication → Email Templates → Confirm signup**
2. Set the template link to:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}
```

The app still supports the default `{{ .ConfirmationURL }}` verify → hash redirect into `/auth/callback`.

## Optional app env for Resend fallback

If set on Vercel, signup/resend can deliver confirmation links through Resend directly when the built-in mailer is rate-limited:

- `RESEND_API_KEY` (already used by waitlist)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to the browser)
