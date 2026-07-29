# Current Project Status

Status: Founding-user beta stabilization
Last updated: 2026-07-29

This document captures the current state of Forge after tonight’s work so the founder can restart tomorrow with a clear status and next-step plan.

---

## 1. Current Production Status

- Marketing website is live.
- Homepage is complete.
- About page is complete.
- Values page is complete.
- Founder Story page is complete.
- Join page is complete.
- Waitlist is complete.
- Authentication is working.
- Login is working.
- Signup is working.
- Protected routes are working.
- Mobile logout redirects to homepage.
- User profiles exist.
- Profile photo upload exists.
- Profile edit/save works.
- Relationship goals support multiple selections.
- Things I Enjoy accepts a flexible, user-authored hobby list.
- Profile Preview has been polished.
- Discovery has real profile filters instead of placeholder shortcuts.
- Connections includes an Interested in You route and relationship-authorized identity cards.
- Profile-only alignment is confidence-capped until both members have sufficient questionnaire coverage.
- Logout is available directly from the Profile workspace.
- Onboarding shell exists at `/onboarding`.
- `/app` has onboarding entry point.
- Mobile onboarding button order has been fixed after PR #12 merge.
- Supabase is configured.
- GitHub, Cursor, and Vercel workflows are active.

---

## 2. Important Testing Lesson

- Production at `forgedinlife.com` only reflects merged code from `main` after Vercel deploys.
- PR preview URLs show unmerged branch changes.
- The installed mobile app or mobile browser shortcut reflects production, not unmerged PRs.

See also: `docs/deployment-and-mobile-testing.md`.

---

## 3. Current Product Flow

Current logged-in user journey:

1. Visit site
2. Sign up or log in
3. Land on `/app`
4. Start onboarding
5. Move through onboarding shell
6. Go to profile
7. Edit profile
8. Preview profile
9. Logout to homepage

Key routes:

| Route | Purpose |
|-------|---------|
| `/` | Marketing homepage |
| `/login` | Sign in |
| `/signup` | Create account |
| `/app` | Signed-in dashboard |
| `/onboarding` | Onboarding shell (protected) |
| `/profile` | Edit profile (protected) |
| `/profile/preview` | Profile preview (protected) |

---

## 4. Completed Tonight

- Profile Preview polish was completed and merged.
- Onboarding shell was completed and merged.
- Mobile onboarding Continue/Back order was fixed and merged.
- Compatibility Profile V1 blueprint was created as documentation only.
- Deployment/mobile testing documentation was added.

Related docs:

- `docs/compatibility-profile-v1.md`
- `docs/deployment-and-mobile-testing.md`

---

## 5. Next Priority

Complete two-user signed-in beta QA against the stabilized production flow:

- Confirm inbound Interested appears in Interested in You.
- Confirm accepting reciprocal interest creates a mutual connection.
- Confirm Connection cards show the member's public name, photo, location, and current alignment.
- Exercise the full Discovery filter drawer in combination.
- Confirm insufficient questionnaire coverage never receives a confident Strong label.
- Confirm neither member can read the other's private questionnaire answers.

---

## 6. Current Stabilization Release

Migration `20260728195226_profile_discovery_connections_stabilization.sql`
adds the plural relationship-goal contract and the guarded public-profile
projection used by relationship participants. The application release adds the
corresponding profile controls, Discovery filters, Interested in You tab,
Connections identity hydration, and conservative fallback alignment behavior.

---

## 7. Do Not Forget

- Forge is not a swipe app.
- Forge is values-first and relationship-focused.
- Build decisions should prioritize user value, revenue, speed to MVP, simplicity, and long-term scalability.
- Do not over-polish before core product flow exists.

Out of scope until intentionally started:

- Compatibility scoring
- Matching
- Messaging
- Discovery
- Swiping
- Payments / subscriptions
