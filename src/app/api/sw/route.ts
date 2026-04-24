import { NextResponse } from 'next/server'

const SW_CONTENT = `
self.addEventListener('push', function (event) {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      // Procura janela já aberta do app (qualquer página) e navega para a URL correta
      for (const client of list) {
        if ('focus' in client && 'navigate' in client) {
          return client.focus().then(function () {
            return client.navigate(url)
          })
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
`.trim()

export async function GET() {
  return new NextResponse(SW_CONTENT, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  })
}
