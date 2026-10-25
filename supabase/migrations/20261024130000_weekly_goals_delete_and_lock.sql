-- Cada usuario puede borrar sus propias metas (así nunca se queda sin salida al llegar al tope)
-- y el tope de 50 se impone también con envíos simultáneos: el trigger toma un bloqueo por usuario.

create policy "cada usuario borra lo suyo en weekly_goals"
  on public.weekly_goals for delete to authenticated
  using (user_id = auth.uid());

create or replace function public.weekly_goals_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Serializa los inserts del mismo usuario hasta que termine la transacción.
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));
  if (select count(*) from public.weekly_goals where user_id = new.user_id) >= 50 then
    raise exception 'limite_metas' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
