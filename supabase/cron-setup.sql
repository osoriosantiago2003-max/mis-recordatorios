-- ============================================================
--  Robot (cron) que revisa los recordatorios CADA MINUTO.
--  Llama a la función "enviar-recordatorios" para que mande
--  los avisos push a la hora exacta.
--
--  Cómo usarlo:
--    1. Supabase  ->  SQL Editor
--    2. Pega TODO esto y presiona "Run".
--  (Solo hay que hacerlo UNA vez.)
-- ============================================================

-- Activamos las extensiones necesarias.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Si ya existía un robot con este nombre, lo quitamos para no duplicar.
select cron.unschedule('enviar-recordatorios-cada-minuto')
where exists (
  select 1 from cron.job where jobname = 'enviar-recordatorios-cada-minuto'
);

-- Programamos el robot: cada minuto llama a la función.
select cron.schedule(
  'enviar-recordatorios-cada-minuto',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://bohkpsrykdmqwvhlfand.supabase.co/functions/v1/enviar-recordatorios',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
