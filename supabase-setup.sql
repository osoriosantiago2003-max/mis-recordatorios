-- ============================================================
--  Script para crear la tabla de la app "Mis Recordatorios".
--  Cómo usarlo:
--    1. Entra a tu proyecto en https://supabase.com
--    2. Menú izquierdo  ->  "SQL Editor"
--    3. Pega TODO este contenido y presiona "Run".
-- ============================================================

-- Tabla donde se guardan las tareas/recordatorios.
create table if not exists public.tareas (
  id          bigint generated always as identity primary key,
  titulo      text not null,
  fecha       date,
  completada  boolean not null default false,
  creada_en   timestamptz not null default now()
);

-- Activamos la seguridad por filas (RLS). Supabase lo recomienda.
alter table public.tareas enable row level security;

-- Para esta práctica universitaria permitimos que cualquiera con la
-- clave pública pueda leer y escribir. (En una app real harías login).
drop policy if exists "acceso_publico_tareas" on public.tareas;
create policy "acceso_publico_tareas"
  on public.tareas
  for all
  using (true)
  with check (true);
