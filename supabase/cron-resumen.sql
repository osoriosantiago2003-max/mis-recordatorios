-- ============================================================
--  Robot (cron) que te manda un RESUMEN CADA HORA con todo
--  lo que te falta por hacer. Llama a la función
--  "resumen-pendientes" al minuto 0 de cada hora.
--
--  Cómo usarlo:
--    1. Supabase  ->  SQL Editor
--    2. Pega TODO esto y presiona "Run".
--  (Solo hay que hacerlo UNA vez.)
-- ============================================================

-- Las extensiones ya deberían estar activas, pero por si acaso.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Si ya existía un robot con este nombre, lo quitamos para no duplicar.
select cron.unschedule('resumen-pendientes-cada-hora')
where exists (
  select 1 from cron.job where jobname = 'resumen-pendientes-cada-hora'
);

-- Programamos el robot: al minuto 0 de CADA HORA llama a la función.
select cron.schedule(
  'resumen-pendientes-cada-hora',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://bohkpsrykdmqwvhlfand.supabase.co/functions/v1/resumen-pendientes',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
