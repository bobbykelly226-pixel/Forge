# FIX-008 founder review corrections

September 13, 2026: founder requests six fixes in one Preview pass.

- Account & Privacy and View My Profile use the existing explicit transparent text-link styling, including the checklist link.
- Photo Replace/Remove controls stack on narrow screens; labels receive compact centered wrapping styles and 44px minimum touch height. Pending primary copy now says Main photo after approval.
- Group changes close the previous group/topic and focus/scroll the new group to its heading after React commits the layout.
- Pet-allergy question now reads: Do pet allergies affect which animals you can live with? Helper: This helps identify important household compatibility. Follow-up: Which animals affect you? Existing allergy data model and options remain unchanged in this wording fix; the wider stored tri-state/Other contract remains tracked separately.
- Compatibility directory blue category buttons explicitly render all nested headings, status, counters and action labels white, overriding legacy nested text classes.
- Music has the approved 21 genres, up to six, Other write-in, optional artists and songs retained, and A song that says something about me. Server and database validate genre catalog/count. New fields are included in owner summaries, completion, self preview and eligible public presentation; existing music is preserved. Spotify remains later work.

Additive migration extends profiles and the security-invoker public view with three music fields; existing RLS, age and discoverability predicates are unchanged. Account-deletion minimization clears the new fields. No member music is backfilled or replaced. Generated type reconciliation and migration verification are recorded after CI.

Local: 635 tests pass, build/typecheck pass, lint zero errors with 39 existing warnings. New app boundaries test 0/6/7, unknown, Other validation and meaningful-song fields. New database tests cover owner persistence and invalid genres/count. CI #108 and shared database prerequisite verification passed. Real authenticated device save/refresh and visual review remain founder checks; do not claim those were performed automatically.


## Database completion
Founder approved the shared database update. Applied as 20260913232313_profile_music_preferences. Confirmed new public-view music columns, security_invoker=true, and account-deletion cleanup. Generated affected types from actual schema. CI #108 passed application checks and disposable database tests/lint. No new security advisory categories. Preview music persistence is enabled; founder device verification remains open.
