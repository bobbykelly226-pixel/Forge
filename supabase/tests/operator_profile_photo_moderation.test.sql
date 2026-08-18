begin;

select plan(11);

select ok(
  to_regclass('public.profile_photo_moderation_events') is not null,
  'the append-only profile photo moderation event table exists'
);

select has_column(
  'public',
  'profile_photos',
  'reviewed_at',
  'profile photos record the latest review timestamp'
);

select has_column(
  'public',
  'profile_photos',
  'reviewed_by',
  'profile photos record the latest operator id'
);

select has_column(
  'public',
  'profile_photos',
  'rejection_reason',
  'profile photos record a rejection reason'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profile_photo_moderation_events'::regclass),
  'moderation events have row level security enabled'
);

select ok(
  not has_table_privilege('anon', 'public.profile_photo_moderation_events', 'SELECT'),
  'anonymous callers cannot read moderation audit events'
);

select ok(
  not has_table_privilege('authenticated', 'public.profile_photo_moderation_events', 'SELECT'),
  'ordinary authenticated members cannot read moderation audit events'
);

select ok(
  to_regprocedure(
    'public.review_profile_photo(uuid,uuid,public.photo_moderation_status,text)'
  ) is not null,
  'the atomic profile photo review function exists'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.review_profile_photo(uuid,uuid,public.photo_moderation_status,text)',
    'EXECUTE'
  ),
  'the service role can record profile photo decisions'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.review_profile_photo(uuid,uuid,public.photo_moderation_status,text)',
    'EXECUTE'
  ),
  'ordinary authenticated members cannot record moderation decisions'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.review_profile_photo(uuid,uuid,public.photo_moderation_status,text)',
    'EXECUTE'
  ),
  'anonymous callers cannot record moderation decisions'
);

select * from finish();
rollback;
