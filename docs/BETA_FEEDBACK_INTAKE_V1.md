# Beta Feedback Intake V1

## Purpose

Give authenticated Forge beta members one calm, private place to report broken behavior, explain confusing experiences, request help, or share ideas.

This is product feedback. It does not replace the separate member-reporting and safety workflow released in PR #59.

## Member experience

- Available from the authenticated desktop navigation, mobile utility controls, and My Profile.
- Categories: broken, confusing, support, and idea/general feedback.
- Product areas: Discovery, My Profile, Compatibility Profile, Connections or Messages, Account or Sign In, and Other.
- Requires 10–2,000 characters of detail.
- Lets the member choose whether Forge may reply using the email already on the account.
- Returns a short submission reference after the private record is saved.

## Privacy and security

- Authentication is rechecked inside the Server Action.
- Server-side validation treats every form value as untrusted.
- `beta_feedback_submissions` has RLS enabled.
- Authenticated users receive insert permission only for member-controlled intake fields.
- The insert policy binds `submitter_id` to `auth.uid()` and rejects anonymous Auth users.
- There is no authenticated select, update, or delete policy.
- Triage and delivery fields are accessible only to trusted server operations.
- Forge does not ask for passwords, payment information, or another member's private information.

## Operational flow

1. Save the authoritative private submission.
2. Notify `admin@forgedinlife.com` through Resend.
3. Record accepted, failed, or not-configured delivery state on the submission.
4. Use the email's category, area, account context, reference, and description to create or update the appropriate Master Tasks work item.
5. Preserve the submission even if email delivery fails.

## Response expectations during beta

- Account/access help: acknowledge as soon as practical.
- Broken or confusing behavior: review within two business days.
- Ideas/general feedback: review for product learning; an individual response is not guaranteed.

## Verification gate

Before release, verify authentication, field validation, RLS/grants, private persistence, Resend message ID/status, admin inbox delivery, submission reference, responsive layout, and regression isolation from safety reports.
