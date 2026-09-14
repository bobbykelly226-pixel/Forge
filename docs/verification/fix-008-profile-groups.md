# FIX-008 first Profile architecture pass

Founder requests prioritizing the overwhelming owner Profile before public-profile presentation. Preserve the published blue/gray visual baseline.

Replaces nineteen topic cards with four collapsed editable groups (Profile basics, Values & lifestyle, Life & plans, Interests) and a compact Compatibility section. Opening a group reveals concise topic rows; opening a topic uses the existing complete editor. All seventeen available editors occur once, including photos, Children/Pets/Smoking/Drinking; unavailable Voice/Video is omitted. Saves/cancel return to the topic summary; new editors receive focus. Existing storage, validation, moderation, and privacy paths remain unchanged.

Profile opts into document-flow layout and disables viewport locking; other destinations retain their existing scroll behavior. Removes the middle sticky column and duplicate completion ring. Owner checklist shows the six approved actionable rows, with Compatibility completion taken from saved questionnaire counts. Existing fields' completion calculations are retained for now; FIX-007 baseline reconciliation remains tracked.

Feedback remains in header navigation; Account & Privacy is a small text link. Character Signals and private matching preferences are collapsed. Preferences have NOT yet moved into persistent Discovery filters, so access to the existing validated editor is retained until that migration is implemented.

Verification: production build/typecheck and targeted regression checks pass; editor coverage ensures all available topics occur exactly once. Existing obsolete assertions demanding a duplicate completion ring and duplicate Feedback card now reflect the approved removals. Actual founder desktop/mobile and save positioning review remains pending.

Next: music genre/Other/meaningful-song fields and persistence; matching preference relocation; remaining photo/lifestyle/education corrections. Public member profile visual density is recorded for a later pass and is unchanged here. This is an incremental Preview, not full FIX-008 closure or a Production release.
