-- Límites de weekly_goals: rango amplio para fecha_inicio (el rango fino, relativo a hoy,
-- lo valida la API) y tope de 50 metas por usuario.

alter table public.weekly_goals
  add constraint weekly_goals_fecha_inicio_rango
  check (fecha_inicio between date '2000-01-01' and date '2100-12-31');

create function public.weekly_goals_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.weekly_goals where user_id = new.user_id) >= 50 then
    raise exception 'limite_metas' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger weekly_goals_limit
  before insert on public.weekly_goals
  for each row execute function public.weekly_goals_limit();
