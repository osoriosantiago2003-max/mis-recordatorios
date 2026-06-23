// ============================================================
//  Función "resumen-pendientes" (corre en Supabase).
//  Un robot (cron) la llama CADA HORA. Ella:
//   1) Revisa qué horas son en Colombia (solo avisa de día,
//      entre las 8am y las 10pm, para no molestarte de noche).
//   2) Cuenta TODAS tus tareas pendientes (sin completar).
//   3) Te manda UN solo aviso push al teléfono con la lista
//      de lo que te falta por hacer.
//  Este aviso NO marca nada como notificado: es un recordatorio
//  general que se repite cada hora mientras tengas pendientes.
// ============================================================
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

webpush.setVapidDetails(
  'mailto:osoriosantiago2003@gmail.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

// Hora actual (0-23) en Colombia.
function horaColombia(): number {
  const txt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    hour12: false,
  }).format(new Date())
  return parseInt(txt, 10)
}

Deno.serve(async () => {
  const hora = horaColombia()

  // Solo avisamos de día: entre las 8am y las 10pm.
  if (hora < 8 || hora >= 22) {
    return new Response(JSON.stringify({ enviados: 0, motivo: 'fuera-de-horario', hora }), {
      status: 200,
    })
  }

  // 1) Todas las tareas pendientes (sin completar).
  const { data: tareas, error } = await supabase
    .from('tareas')
    .select('id, titulo')
    .eq('completada', false)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const pendientes = tareas ?? []
  if (pendientes.length === 0) {
    return new Response(JSON.stringify({ enviados: 0, motivo: 'sin-pendientes', hora }), {
      status: 200,
    })
  }

  // 2) Armamos el texto del aviso (máximo 4 títulos para no hacerlo larguísimo).
  const titulos = pendientes.map((t) => t.titulo)
  const lista = titulos.slice(0, 4).join(', ')
  const extra = titulos.length > 4 ? ` y ${titulos.length - 4} más` : ''
  const payload = JSON.stringify({
    titulo: `📋 Te faltan ${pendientes.length} cosa(s) por hacer`,
    cuerpo: `${lista}${extra}`,
    tag: 'resumen-horario',
  })

  // 3) Se lo mandamos a todos los teléfonos suscritos.
  const { data: subs } = await supabase
    .from('suscripciones_push')
    .select('id, endpoint, p256dh, auth')

  let enviados = 0
  for (const s of subs ?? []) {
    const suscripcion = {
      endpoint: s.endpoint,
      keys: { p256dh: s.p256dh, auth: s.auth },
    }
    try {
      await webpush.sendNotification(suscripcion, payload)
      enviados++
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) {
        await supabase.from('suscripciones_push').delete().eq('id', s.id)
      }
    }
  }

  return new Response(JSON.stringify({ enviados, pendientes: pendientes.length, hora }), {
    status: 200,
  })
})
