-- Tips: consejos que solo el admin crea, edita y borra. Todo usuario con sesión puede leerlos.
-- Sin policies de insert/update/delete: la escritura va por rutas /api/admin con la llave secreta.

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  consejo_dia text not null check (char_length(consejo_dia) between 1 and 280),
  consejo_zona text not null check (char_length(consejo_zona) between 1 and 280),
  zona text not null check (zona in ('cuello', 'espalda_baja', 'cadera', 'hombros', 'munecas', 'cuerpo_completo')),
  complejidad text not null check (complejidad in ('baja', 'media', 'alta')),
  created_at timestamptz not null default now()
);

create index tips_created_idx on public.tips (created_at desc);

alter table public.tips enable row level security;

create policy "usuarios con sesion leen los tips"
  on public.tips for select
  to authenticated
  using (true);
