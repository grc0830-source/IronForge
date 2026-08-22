alter table public.workout_sets
  add column if not exists set_type text not null default 'working';

alter table public.workout_sets
  drop constraint if exists workout_sets_set_type_check;

alter table public.workout_sets
  add constraint workout_sets_set_type_check
  check (set_type in ('warmup', 'working'));

comment on column public.workout_sets.set_type is
  'Classifies a logged set as warm-up or working for progression analysis.';
