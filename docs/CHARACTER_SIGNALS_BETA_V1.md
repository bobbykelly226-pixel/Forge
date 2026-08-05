# Character Signals Beta V1

## Purpose

Character Signals let members privately recognize positive qualities demonstrated during meaningful Forge interactions. They are not ratings, reviews, compatibility scores, or a safety system.

## Beta rules

- The catalog is limited to the eight approved positive qualities.
- Both members must be adults with an active Forge connection.
- Both members must have sent at least one message in their Forge conversation.
- A giver may recognize an eligible receiver once during beta.
- In-person recognition is member-attested but still requires the verified two-way Forge conversation.
- The receiver must accept a recognition before it contributes to an aggregate.
- A quality needs three independent accepted confirmations before it can be public.
- The receiver can hide or show any eligible aggregate at any time.
- Blocked members cannot create or view Character Signals involving one another.

## Privacy and misuse protection

Authenticated members have no direct table privileges. All reads and writes use narrow server functions that derive the signed-in member, validate the relationship, enforce the fixed catalog, and return only the data needed by the current screen. Public profile reads expose only signal key and aggregate confirmation count—never giver identity or private/pending recognition.

Character Signals are positive-only. Negative experiences, harassment, fraud, coercion, or safety concerns belong in Report and Block. Product bugs or account help belong in Beta Feedback.

## Support operations

- Signed-in product help: `/feedback` → private Supabase record + admin email.
- Sign-in/account-access help: `support@forgedinlife.com`.
- General inquiries: `hello@forgedinlife.com`.
- Safety concerns: Report or Block from the relevant member profile or conversation.

## Beta verification checklist

- Ineligible, anonymous, self, duplicate, under-18, deactivated, and blocked recognition attempts fail.
- A two-way connected conversation unlocks exactly one recognition opportunity.
- Interaction type restricts the available signal catalog.
- Recognition starts pending and is visible only to the receiver.
- Declining excludes the recognition from all counts and public display.
- Accepting below three confirmations remains private.
- Three independent accepted confirmations plus receiver approval produce a public aggregate.
- Hiding removes the aggregate from public profiles; showing restores it.
- Giver identities never appear on another member's public profile.
- Mobile drawer, focus return, pending state, errors, and management controls work without horizontal overflow.
