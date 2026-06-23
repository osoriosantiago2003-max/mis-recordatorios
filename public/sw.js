// ============================================================
//  Service Worker = el "cartero" de la app.
//  Sigue trabajando aunque la app esté cerrada: recibe los avisos
//  push del servidor y los muestra en la pantalla del teléfono.
// ============================================================

// Se activa apenas se instala, sin esperar.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// Llega un aviso push desde el servidor (Supabase).
self.addEventListener('push', (event) => {
  let datos = { titulo: '🔔 Recordatorio', cuerpo: 'Tienes algo pendiente.' }
  try {
    if (event.data) datos = { ...datos, ...event.data.json() }
  } catch (e) {
    // Si viene como texto plano, lo usamos como cuerpo.
    if (event.data) datos.cuerpo = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: datos.tag || 'recordatorio',
      renotify: true,
      data: { url: '/' },
    })
  )
})

// El usuario toca la notificación: abrimos (o enfocamos) la app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if ('focus' in cliente) return cliente.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    })
  )
})
