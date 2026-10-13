-- Sesiones de rutina: cada vez que alguien completa o abandona una rutina de 6 minutos.
-- Cada usuario ve e inserta solo las suyas (RLS). Se accede desde rutas /api con la sesión del usuario.

create table public.routine_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rutina text not null check (rutina in ('cuello', 'espalda_baja', 'cadera', 'hombros', 'munecas', 'cuerpo_completo')),
  completado boolean not null,
  nota text check (nota is null or char_length(nota) <= 280),
  created_at timestamptz not null default now()
);

create index routine_sessions_user_created_idx
  on public.routine_sessions (user_id, created_at desc);

alter table public.routine_sessions enable row level security;

create policy "cada usuario lee sus sesiones"
  on public.routine_sessions for select
  to authenticated
  using (user_id = auth.uid());

create policy "cada usuario inserta sus sesiones"
  on public.routine_sessions for insert
  to authenticated
  with check (user_id = auth.uid());
