-- ============================================================
--  Alarmas con hora + notificaciones push al teléfono.
--  Agrega la HORA a los recordatorios, una tabla para guardar
--  los teléfonos suscritos, y marca cuáles ya fueron avisados.
-- ============================================================

-- 1) Nuevos campos en la tabla de tareas.
alter table public.tareas
  add column if not exists hora time;                -- hora de la alarma (opcional)

alter table public.tareas
  add column if not exists notificada boolean not null default false;  -- ya se envió el aviso

-- 2) Tabla donde guardamos cada teléfono/navegador que quiere recibir avisos.
--    "endpoint" + las llaves son lo que necesita el servidor para mandar el push.
create table if not exists public.suscripciones_push (
  id         bigint generated always as identity primary key,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  creada_en  timestamptz not null default now()
);

alter table public.suscripciones_push enable row level security;

-- Para esta práctica permitimos que cualquiera con la clave pública
-- guarde su suscripción (igual que la tabla de tareas).
drop policy if exists "acceso_publico_suscripciones" on public.suscripciones_push;
create policy "acceso_publico_suscripciones"
  on public.suscripciones_push
  for all
  using (true)
  with check (true);
