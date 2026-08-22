create table if not exists public.user_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_key text not null,
  status text not null default 'expired',
  source text not null,
  product_id text,
  original_transaction_id text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, entitlement_key),
  constraint user_entitlements_key_check
    check (entitlement_key in ('ai_coach')),
  constraint user_entitlements_status_check
    check (status in ('active', 'grace_period', 'expired', 'revoked')),
  constraint user_entitlements_source_check
    check (source in ('app_store', 'play_store', 'promotion', 'manual'))
);

alter table public.user_entitlements enable row level security;

revoke insert, update, delete on public.user_entitlements
  from anon, authenticated;
grant select on public.user_entitlements to authenticated;

create policy "Users can read their own entitlements"
  on public.user_entitlements
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists user_entitlements_expires_at_idx
  on public.user_entitlements (expires_at)
  where expires_at is not null;

comment on table public.user_entitlements is
  'Server-managed premium access. Clients may read their own row but cannot grant access.';
