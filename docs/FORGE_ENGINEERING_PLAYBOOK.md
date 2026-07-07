# Forge Engineering Playbook

This document is the source of truth for how we build Forge.

---

## 1. Forge Mission

Forge exists to help people build meaningful, lasting relationships through compatibility, character, values, and intentional dating.

---

## 2. Product Philosophy

- Ship. Learn. Improve. Repeat.
- Build the simplest high quality MVP possible.
- Avoid endless polishing.
- Do not chase new tools unless they clearly help us ship.

---

## 3. Technical Philosophy

- Simplicity over cleverness.
- Readability over complexity.
- Secure by default.
- Mobile first.
- Use environment variables for secrets.
- Do not hardcode credentials.
- Do not overbuild before real users validate the need.

---

## 4. Current Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Resend
- Vercel
- GitHub
- Cursor

---

## 5. Engineering Workflow

1. Create small focused changes.
2. Use pull requests.
3. Review Vercel preview before merging.
4. Squash and merge.
5. Let Vercel deploy from main.
6. Test production after deploy.

---

## 6. Definition of Done

- Feature works on mobile.
- No secrets in source code.
- No unnecessary scope creep.
- Preview deployment reviewed.
- PR summary is clear.
- Production checked after merge.

---

## 7. MVP Priorities

1. Authentication
2. User profiles
3. Onboarding questionnaire
4. Values and relationship intention data
5. Basic compatibility logic
6. First version of matching
7. Simple messaging or introduction flow

---

## 8. Not Building Yet

- Native iOS app
- Native Android app
- Paid subscriptions
- AI matching
- Complex moderation system
- Video profiles
- Social feed
- Push notifications

---

## 9. Brand and Product Principles

- Forge is not another swipe app.
- No engagement hacks.
- No dark patterns.
- No endless swiping as the core experience.
- Every feature should support intentional relationships.
- Protect user trust.
- Use language that feels grounded, honest, and mission driven.

---

## 10. Sprint 1 Completed

- Codebase audit
- Supabase configuration secured
- Legacy project naming cleaned up
- QR landing page created at `/join`
- Short `/wait` route added
- GitHub, Cursor, Vercel workflow established

---

## 11. Next Sprint

Sprint 2 is authentication foundation.

Do not start profiles, matching, or messaging until auth is stable.
