-- Interruptores de features: una fila por feature, apagada por defecto.
-- Todo usuario con sesión puede leer el estado (la app lo consulta en el servidor con su sesión).
-- Sin policies de insert/update/delete: solo el admin cambia el estado, por /api/admin con la llave secreta.

create table public.feature_flags (
  key text primary key check (char_length(key) between 1 and 60),
  enabled boolean not null default false,
  enabled_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;

create policy "usuarios con sesion leen los interruptores"
  on public.feature_flags for select
  to authenticated
  using (true);

revoke insert, update, delete on public.feature_flags from anon, authenticated;

-- enabled_at guarda la última vez que se encendió (no se borra al apagar).
create function public.feature_flags_touch() returns trigger
language plpgsql as $$
begin
  if new.enabled and not coalesce(old.enabled, false) then
    new.enabled_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger feature_flags_touch
  before update on public.feature_flags
  for each row execute function public.feature_flags_touch();

-- Contador de días seguidos (hipótesis en product/hypotheses/contador-dias-seguidos.md).
insert into public.feature_flags (key, enabled) values ('contador_racha', false);
