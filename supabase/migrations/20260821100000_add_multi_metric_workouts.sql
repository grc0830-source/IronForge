alter table public.workout_sets
  drop constraint if exists workout_sets_performance_type_check;

alter table public.workout_sets
  add column if not exists metric_value numeric,
  add column if not exists metric_unit text,
  add constraint workout_sets_performance_type_check
    check (performance_type in ('reps', 'time', 'distance', 'calories', 'rounds')),
  add constraint workout_sets_metric_value_check
    check (metric_value is null or metric_value > 0),
  add constraint workout_sets_metric_unit_check
    check (
      metric_unit is null or metric_unit in (
        'meters', 'kilometers', 'miles', 'yards', 'calories', 'rounds'
      )
    ),
  add constraint workout_sets_metric_consistency_check
    check (
      (performance_type in ('reps', 'time') and metric_value is null and metric_unit is null)
      or
      (performance_type = 'distance' and metric_value is not null and metric_unit in ('meters', 'kilometers', 'miles', 'yards'))
      or
      (performance_type = 'calories' and metric_value is not null and metric_unit = 'calories')
      or
      (performance_type = 'rounds' and metric_value is not null and metric_unit = 'rounds')
    );

alter table public.workout_template_exercises
  drop constraint if exists workout_template_exercises_performance_type_check;

alter table public.workout_template_exercises
  add column if not exists target_metric_value numeric,
  add column if not exists target_metric_unit text,
  add constraint workout_template_exercises_performance_type_check
    check (performance_type in ('reps', 'time', 'distance', 'calories', 'rounds')),
  add constraint workout_template_exercises_metric_value_check
    check (target_metric_value is null or target_metric_value > 0),
  add constraint workout_template_exercises_metric_unit_check
    check (
      target_metric_unit is null or target_metric_unit in (
        'meters', 'kilometers', 'miles', 'yards', 'calories', 'rounds'
      )
    ),
  add constraint workout_template_exercises_metric_consistency_check
    check (
      (performance_type in ('reps', 'time') and target_metric_value is null and target_metric_unit is null)
      or
      (performance_type = 'distance' and target_metric_value is not null and target_metric_unit in ('meters', 'kilometers', 'miles', 'yards'))
      or
      (performance_type = 'calories' and target_metric_value is not null and target_metric_unit = 'calories')
      or
      (performance_type = 'rounds' and target_metric_value is not null and target_metric_unit = 'rounds')
    );

alter table public.workout_session_exercises
  drop constraint if exists workout_session_exercises_performance_type_check;

alter table public.workout_session_exercises
  add column if not exists target_metric_value numeric,
  add column if not exists target_metric_unit text,
  add constraint workout_session_exercises_performance_type_check
    check (performance_type in ('reps', 'time', 'distance', 'calories', 'rounds')),
  add constraint workout_session_exercises_metric_value_check
    check (target_metric_value is null or target_metric_value > 0),
  add constraint workout_session_exercises_metric_unit_check
    check (
      target_metric_unit is null or target_metric_unit in (
        'meters', 'kilometers', 'miles', 'yards', 'calories', 'rounds'
      )
    ),
  add constraint workout_session_exercises_metric_consistency_check
    check (
      (performance_type in ('reps', 'time') and target_metric_value is null and target_metric_unit is null)
      or
      (performance_type = 'distance' and target_metric_value is not null and target_metric_unit in ('meters', 'kilometers', 'miles', 'yards'))
      or
      (performance_type = 'calories' and target_metric_value is not null and target_metric_unit = 'calories')
      or
      (performance_type = 'rounds' and target_metric_value is not null and target_metric_unit = 'rounds')
    );
