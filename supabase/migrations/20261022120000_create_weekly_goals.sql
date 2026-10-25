-- Meta semanal: cuántos días a la semana quiere hacer su pausa cada usuario,
-- desde una fecha de inicio. Cada meta nueva es una fila; la vigente es la más reciente.
-- Cada usuario lee e inserta solo lo suyo (RLS); el admin la agrega en el servidor con la llave secreta.

create table public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dias_por_semana integer not null check (dias_por_semana between 1 and 7),
  fecha_inicio date not null,
  created_at timestamptz not null default now()
);

create index weekly_goals_user_created_idx on public.weekly_goals (user_id, created_at desc);

alter table public.weekly_goals enable row level security;

create policy "cada usuario lee lo suyo en weekly_goals"
  on public.weekly_goals for select to authenticated
  using (user_id = auth.uid());

create policy "cada usuario inserta lo suyo en weekly_goals"
  on public.weekly_goals for insert to authenticated
  with check (user_id = auth.uid());
