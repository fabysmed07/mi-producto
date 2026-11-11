-- Peso opcional (kg) en las sesiones de rutina. Las filas existentes quedan en null.
-- El usuario puede cargarlo al crear la sesión o editarlo después (solo el peso).

alter table public.routine_sessions
  add column peso numeric(4,1) check (peso is null or (peso >= 20 and peso <= 300));

-- Hasta ahora no había UPDATE: cada usuario actualiza solo sus sesiones...
create policy "cada usuario actualiza sus sesiones"
  on public.routine_sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ...y solo la columna peso (rutina, completado, nota y fechas no se pueden alterar).
revoke update on public.routine_sessions from authenticated;
grant update (peso) on public.routine_sessions to authenticated;
