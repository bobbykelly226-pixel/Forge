-- Discovery is exposed through eligibility-checked SECURITY DEFINER RPCs only.
-- Their postgres owner retains access; members must not query or mutate this updatable view directly.
revoke all privileges on table public.discoverable_profiles from public, anon, authenticated;
