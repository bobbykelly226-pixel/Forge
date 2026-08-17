# Authentication abuse protection

Forge supports Cloudflare Turnstile on every public authentication action:

- invited account signup
- password sign-in
- confirmation email resend
- password reset request

## Production activation order

1. Create a Cloudflare Turnstile widget for `forge.forgedinlife.com`.
2. Add the public site key to Vercel Production as
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
3. Add `NEXT_PUBLIC_AUTH_CAPTCHA_ENABLED=true` to Vercel Production.
4. In Supabase, open **Authentication → Bot and Abuse Protection**, enable
   Cloudflare Turnstile, and save the matching secret key.
5. Redeploy production and run the four authentication smoke tests above.

Do not enable Supabase CAPTCHA before the Vercel deployment includes the
widget and token plumbing. Authentication is intentionally fail-closed when
the feature flag is enabled without a public site key.

## Rate-limit review

Keep Supabase Auth rate limits conservative during the invitation-only beta.
Review the Authentication rate-limit dashboard after each beta cohort. Raise a
limit only in response to measured legitimate traffic, never simply to silence
abuse. The application-side resend cooldown is user experience protection; the
Supabase limits and CAPTCHA remain the server-enforced boundary.

When CAPTCHA is enabled, Forge intentionally disables service-role email
fallbacks for signup and resend. Those admin APIs bypass Supabase's CAPTCHA
boundary and must not be used for public requests.
