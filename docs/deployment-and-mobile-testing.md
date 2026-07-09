# Deployment and Mobile Testing

Status: Internal reference
Last updated: 2026-07-09

This document explains how to test Forge changes correctly before and after merge, so PR preview work is not confused with production.

---

## 1. PR Preview vs Production

| Surface | What it shows |
|---------|----------------|
| PR preview URL | Changes from that PR branch, before merge |
| `forgedinlife.com` | Production / `main` only |
| Installed mobile app or mobile browser shortcut | Production / `main` only |

Key points:

- A PR preview URL shows changes from that branch before merge.
- `forgedinlife.com` shows production/`main` only.
- The installed mobile app or mobile browser shortcut also shows production/`main`.
- Production will not show PR changes until the PR is merged and Vercel finishes deploying `main`.

If a change is only on an open PR, production cannot show it yet. That is expected.

---

## 2. Mobile Testing Rule

If a mobile change is inside an unmerged PR, test it using the PR preview URL.
If testing forgedinlife.com or the installed mobile app, the change will not appear until after merge and Vercel deployment.

---

## 3. Pre-Merge Testing Checklist

Before merging a PR:

1. Open the PR preview URL from the Vercel comment on the PR.
2. Test the exact route changed.
3. Test mobile width (real phone or narrow browser viewport).
4. Test desktop width if layout changed.
5. Confirm auth still works if a protected route changed.
6. Confirm logout still works if app navigation changed.
7. Run `tsc --noEmit` if code changed.

Do not treat `forgedinlife.com` as proof that an unmerged PR is broken.

---

## 4. Post-Merge Testing Checklist

After merging a PR:

1. Wait for the Vercel production deployment to finish.
2. Open `forgedinlife.com`.
3. Hard refresh.
4. Test the exact route changed.
5. Test mobile.
6. Test desktop if needed.
7. Confirm the production behavior now matches the PR preview.

If production still looks old, check whether the Vercel production deploy for that merge has completed.

---

## 5. Current Lesson Learned

The onboarding mobile button fix looked broken because production was being tested before the PR was merged. The PR preview had the fix, but forgedinlife.com could not show it until PR #12 was merged and Vercel deployed main.

Going forward:

- Use the PR preview for unmerged mobile UI work.
- Use production only after merge and a finished Vercel production deploy.
- When reporting a “fix not showing,” first confirm whether the test URL is preview or production.
