-- Pets allergy constraint is an optional tri-state answer:
--   true  = explicit Yes
--   false = explicit No
--   null  = unanswered
-- The initial lifestyle migration used NOT NULL DEFAULT false, which made
-- unanswered indistinguishable from No and caused UI hydration to drop "No"
-- when false was treated as empty via truthiness.

alter table public.profiles
  alter column pets_allergy_constraint drop not null;

alter table public.profiles
  alter column pets_allergy_constraint set default null;

-- Historical DEFAULT false rows were never an explicit "No" selection in the UI
-- (the previous editor collapsed false back to unanswered). Treat them as unanswered.
-- Anyone who selected No during preview QA should re-select No once after this lands.
update public.profiles
set pets_allergy_constraint = null
where pets_allergy_constraint = false;

comment on column public.profiles.pets_allergy_constraint is
  'Optional living constraint tri-state: true = yes, false = no, null = unanswered.';
