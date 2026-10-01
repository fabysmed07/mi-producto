create extension if not exists pgcrypto;

create table public.signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
alter table public.signups enable row level security;

create policy "cualquiera puede insertar en signups"
  on public.signups for insert
  to anon, authenticated
  with check (true);

create policy "solo autenticados leen signups"
  on public.signups for select
  to authenticated
  using (true);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  texto text not null check (char_length(trim(texto)) > 0 and char_length(texto) <= 2000),
  email text,
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;

create policy "cualquiera puede insertar en feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (true);

create policy "solo autenticados leen feedback"
  on public.feedback for select
  to authenticated
  using (true);
