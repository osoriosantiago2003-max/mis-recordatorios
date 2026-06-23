// ============================================================
//  Función "enviar-recordatorios" (corre en Supabase).
//  Un robot (cron) la llama cada minuto. Ella:
//   1) Busca tareas cuya fecha+hora ya llegó y no se han avisado.
//   2) Manda una notificación push a todos los teléfonos suscritos.
//   3) Marca esas tareas como "notificada" para no repetir el aviso.
// ============================================================
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Configuramos las llaves VAPID (autorizan a mandarte push).
webpush.setVapidDetails(
  'mailto:osoriosantiago2003@gmail.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

// Fecha y hora actuales en Colombia, en texto ordenable "YYYY-MM-DDTHH:MM".
function ahoraColombia(): string {
  const f = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
  return f.replace(' ', 'T') // "2026-06-23 14:05" -> "2026-06-23T14:05"
}

Deno.serve(async () => {
  const ahora = ahoraColombia()

  // 1) Tareas pendientes con fecha y hora puestas, no avisadas aún.
  const { data: tareas, error } = await supabase
    .from('tareas')
    .select('id, titulo, fecha, hora')
    .eq('completada', false)
    .eq('notificada', false)
    .not('fecha', 'is', null)
    .not('hora', 'is', null)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Nos quedamos solo con las que ya les llegó la hora.
  const vencidas = (tareas ?? []).filter((t) => {
    const objetivo = `${t.fecha}T${String(t.hora).slice(0, 5)}`
    return objetivo <= ahora
  })

  if (vencidas.length === 0) {
    return new Response(JSON.stringify({ enviados: 0, hora: ahora }), { status: 200 })
  }

  // 2) Traemos todos los teléfonos suscritos.
  const { data: subs } = await supabase
    .from('suscripciones_push')
    .select('id, endpoint, p256dh, auth')

  let enviados = 0
  for (const t of vencidas) {
    const payload = JSON.stringify({
      titulo: '⏰ ' + t.titulo,
      cuerpo: '¡Es hora! Tienes este recordatorio pendiente.',
      tag: 'tarea-' + t.id,
    })

    for (const s of subs ?? []) {
      const suscripcion = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      }
      try {
        await webpush.sendNotification(suscripcion, payload)
        enviados++
      } catch (e) {
        // Si el teléfono ya no existe (410/404), borramos esa suscripción.
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await supabase.from('suscripciones_push').delete().eq('id', s.id)
        }
      }
    }

    // 3) Marcamos la tarea como avisada para no repetir.
    await supabase.from('tareas').update({ notificada: true }).eq('id', t.id)
  }

  return new Response(JSON.stringify({ enviados, tareas: vencidas.length, hora: ahora }), {
    status: 200,
  })
})
