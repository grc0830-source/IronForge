alter table public.workout_sets
  add column if not exists performance_type text not null default 'reps',
  add column if not exists duration_seconds integer;

alter table public.workout_sets
  drop constraint if exists workout_sets_performance_type_check,
  drop constraint if exists workout_sets_duration_seconds_check;

alter table public.workout_sets
  add constraint workout_sets_performance_type_check
    check (performance_type in ('reps', 'time')),
  add constraint workout_sets_duration_seconds_check
    check (
      (performance_type = 'reps' and duration_seconds is null)
      or
      (performance_type = 'time' and duration_seconds > 0)
    );

comment on column public.workout_sets.performance_type is
  'Determines whether performance is measured by repetitions or elapsed time.';
comment on column public.workout_sets.duration_seconds is
  'Elapsed duration for time-based sets.';
