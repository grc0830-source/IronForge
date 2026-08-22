alter table public.profiles
  add column if not exists training_goals text[] not null
    default array['general_fitness']::text[],
  add column if not exists training_style text not null default 'mixed',
  add column if not exists favorite_athletes text[] not null default '{}'::text[];

alter table public.profiles
  add constraint profiles_training_goals_check
    check (
      cardinality(training_goals) between 1 and 5
      and training_goals <@ array[
        'strength',
        'muscle',
        'fat_loss',
        'athleticism',
        'general_fitness'
      ]::text[]
    ),
  add constraint profiles_training_style_check
    check (
      training_style in (
        'bodybuilding',
        'powerlifting',
        'powerbuilding',
        'functional',
        'mixed'
      )
    ),
  add constraint profiles_favorite_athletes_check
    check (cardinality(favorite_athletes) <= 10);
