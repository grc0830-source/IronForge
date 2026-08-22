alter table public.workout_template_exercises
  add column if not exists performance_type text not null default 'reps',
  add column if not exists target_duration_seconds integer;

alter table public.workout_session_exercises
  add column if not exists performance_type text not null default 'reps',
  add column if not exists target_duration_seconds integer;

alter table public.workout_template_exercises
  add constraint workout_template_exercises_performance_type_check
    check (performance_type in ('reps', 'time')),
  add constraint workout_template_exercises_duration_check
    check (
      (performance_type = 'reps' and target_duration_seconds is null)
      or
      (performance_type = 'time' and target_duration_seconds between 1 and 86400)
    );

alter table public.workout_session_exercises
  add constraint workout_session_exercises_performance_type_check
    check (performance_type in ('reps', 'time')),
  add constraint workout_session_exercises_duration_check
    check (
      (performance_type = 'reps' and target_duration_seconds is null)
      or
      (performance_type = 'time' and target_duration_seconds between 1 and 86400)
    );
