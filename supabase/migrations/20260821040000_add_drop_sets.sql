alter table public.workout_sets
  add column if not exists set_variant text not null default 'standard',
  add column if not exists parent_set_id uuid references public.workout_sets(id) on delete cascade;

alter table public.workout_sets
  add constraint workout_sets_set_variant_check
    check (set_variant in ('standard', 'drop')),
  add constraint workout_sets_drop_parent_check
    check (
      (set_variant = 'standard' and parent_set_id is null)
      or
      (set_variant = 'drop' and parent_set_id is not null)
    );

create index if not exists workout_sets_parent_set_id_idx
  on public.workout_sets(parent_set_id)
  where parent_set_id is not null;
