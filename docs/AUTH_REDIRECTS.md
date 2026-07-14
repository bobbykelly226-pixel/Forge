# Forge Auth Redirect & Email Configuration

Production site: `https://forgedinlife.com`

## Application routes

- Signup `emailRedirectTo`: `{origin}/auth/callback?next=/onboarding`
- Callback page: `/auth/callback` (handles URL hash tokens, PKCE `code`, and `token_hash`)
- Confirm route: `/auth/confirm` (SSR `token_hash` + `type` template flow)
- Error page: `/auth/error`
- Resend confirmation: login screen action → same `emailRedirectTo`

## Required Supabase Dashboard settings

### URL Configuration

1. Open **Supabase Dashboard → Project Forge → Authentication → URL Configuration**
2. **Site URL** = `https://forgedinlife.com`
3. **Redirect URLs** must include all of:
   - `https://forgedinlife.com/**`
   - `http://localhost:3000/**`
   - `http://127.0.0.1:3000/**`
   - `https://*-bobbykelly226-pixel.vercel.app/**`
4. Save.

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
