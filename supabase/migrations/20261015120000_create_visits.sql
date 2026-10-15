-- Visitas: una fila por usuario por cada día (UTC) en que entra a la app.
-- Sirve para medir retorno. Cada usuario registra y lee solo las suyas (RLS);
-- el panel admin las agrega en el servidor con la llave secreta.

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null default ((now() at time zone 'utc')::date),
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

create index visits_day_idx on public.visits (day);

alter table public.visits enable row level security;

create policy "cada usuario lee sus visitas"
  on public.visits for select
  to authenticated
  using (user_id = auth.uid());

create policy "cada usuario registra sus visitas"
  on public.visits for insert
  to authenticated
  with check (user_id = auth.uid());
