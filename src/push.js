// ============================================================
//  Notificaciones push: conecta este teléfono con el servidor.
//  1) Registra el "cartero" (service worker).
//  2) Pide permiso de notificaciones.
//  3) Crea una suscripción y la guarda en Supabase para que el
//     servidor pueda mandarte avisos aunque la app esté cerrada.
// ============================================================
import { supabase } from './supabaseClient'

// Llave pública VAPID (autoriza a mandarte push). Viene de las variables de entorno.
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY

// ¿El navegador soporta notificaciones push? (iPhone: solo si la app está instalada).
export function soportaPush() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

// Convierte la llave VAPID (texto) al formato que pide el navegador.
function llaveAUint8(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

// Registra el service worker (lo hace una sola vez al abrir la app).
export async function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch (e) {
    console.error('No se pudo registrar el service worker:', e)
    return null
  }
}

// Activa las alarmas en este teléfono: pide permiso, suscribe y guarda en Supabase.
// Devuelve { ok: true } o { ok: false, motivo: '...' }.
export async function activarAlarmas() {
  if (!soportaPush()) {
    return {
      ok: false,
      motivo:
        'Tu navegador no soporta avisos. En iPhone: primero "Añade a pantalla de inicio" y abre la app desde ahí.',
    }
  }
  if (!VAPID_PUBLIC) {
    return { ok: false, motivo: 'Falta configurar la llave VAPID (VITE_VAPID_PUBLIC_KEY).' }
  }

  // 1) Pedimos permiso (en iPhone debe ser por un toque del usuario).
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') {
    return { ok: false, motivo: 'No diste permiso para mostrar notificaciones.' }
  }

  // 2) Aseguramos que el service worker esté listo.
  const registro = (await navigator.serviceWorker.getRegistration()) || (await registrarServiceWorker())
  await navigator.serviceWorker.ready

  // 3) Creamos (o reutilizamos) la suscripción push.
  let sub = await registro.pushManager.getSubscription()
  if (!sub) {
    sub = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: llaveAUint8(VAPID_PUBLIC),
    })
  }

  // 4) Guardamos la suscripción en Supabase (la usa el servidor para avisarte).
  const datos = sub.toJSON()
  const { error } = await supabase.from('suscripciones_push').upsert(
    {
      endpoint: datos.endpoint,
      p256dh: datos.keys.p256dh,
      auth: datos.keys.auth,
    },
    { onConflict: 'endpoint' }
  )

  if (error) {
    return { ok: false, motivo: 'No se pudo guardar la suscripción: ' + error.message }
  }
  return { ok: true }
}
