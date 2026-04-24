self.addEventListener('push', function (event) {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || '/' },
      }),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
        list.forEach(function (client) { client.postMessage({ type: 'PUSH_RECEIVED' }) })
      }),
    ])
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (const client of list) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
