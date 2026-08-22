alter table public.workout_template_exercises
  add column if not exists superset_group text;

alter table public.workout_session_exercises
  add column if not exists superset_group text;

alter table public.workout_template_exercises
  add constraint workout_template_exercises_superset_group_length
    check (superset_group is null or char_length(superset_group) <= 200);

alter table public.workout_session_exercises
  add constraint workout_session_exercises_superset_group_length
    check (superset_group is null or char_length(superset_group) <= 200);
