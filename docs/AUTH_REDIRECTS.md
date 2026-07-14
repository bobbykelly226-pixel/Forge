# Forge Auth Redirect Configuration

Production site: `https://forgedinlife.com`

## Application routes

- Signup `emailRedirectTo`: `{origin}/auth/callback?next=/onboarding`
- Callback page: `/auth/callback` (handles URL hash tokens, PKCE `code`, and `token_hash`)
- Confirm route: `/auth/confirm` (SSR `token_hash` + `type` template flow)
- Error page: `/auth/error`
- Resend confirmation: login screen action → same `emailRedirectTo`

## Required Supabase Dashboard settings

If these are not already set on the linked Forge project:

1. Open **Supabase Dashboard → Project Forge → Authentication → URL Configuration**
2. **Site URL** = `https://forgedinlife.com`
3. **Redirect URLs** must include all of:
   - `https://forgedinlife.com/**`
   - `http://localhost:3000/**`
   - `http://127.0.0.1:3000/**`
   - `https://*-bobbykelly226-pixel.vercel.app/**`
4. Save.

Optional (recommended for cookie SSR without hash tokens):

1. Open **Authentication → Email Templates → Confirm signup**
2. Set the template link to:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}
```

The app still supports the default `{{ .ConfirmationURL }}` verify → hash redirect into `/auth/callback`.
