-- Expand validation without rewriting existing members' choices.
-- Stable slugs preserve existing alignment inputs:
-- serious_relationship => Long-term relationship;
-- intentional_dating => Dating with intention.
-- Legacy multi-goal arrays remain retained; UI presents the existing primary
-- relationship_goal (or first historical goal), and new edits save one goal.
alter table public.profiles drop constraint if exists profiles_relationship_goals_valid;
alter table public.profiles add constraint profiles_relationship_goals_valid
  check (cardinality(relationship_goals) <= 4 and relationship_goals <@
    array['marriage', 'lifelong_partnership', 'serious_relationship',
          'intentional_dating', 'getting_to_know_someone']::text[]);
