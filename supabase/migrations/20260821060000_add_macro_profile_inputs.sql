alter table public.profiles
  add column if not exists age_years integer,
  add column if not exists height_cm numeric,
  add column if not exists weight_kg numeric,
  add column if not exists equation_sex text,
  add column if not exists activity_level text not null default 'moderate',
  add column if not exists calorie_direction text not null default 'maintain';

alter table public.profiles
  add constraint profiles_age_years_check
    check (age_years is null or age_years between 18 and 100),
  add constraint profiles_height_cm_check
    check (height_cm is null or height_cm between 120 and 230),
  add constraint profiles_weight_kg_check
    check (weight_kg is null or weight_kg between 30 and 350),
  add constraint profiles_equation_sex_check
    check (equation_sex is null or equation_sex in ('female', 'male')),
  add constraint profiles_activity_level_check
    check (activity_level in ('sedentary', 'light', 'moderate', 'very_active')),
  add constraint profiles_calorie_direction_check
    check (calorie_direction in ('lose', 'maintain', 'gain'));
