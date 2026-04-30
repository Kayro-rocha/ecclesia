import admin from 'firebase-admin'

function getApp() {
  if (admin.apps.length) return admin.apps[0]!

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT não configurado')

  const serviceAccount = JSON.parse(raw)
  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

export async function sendFcmNotification(token: string, title: string, body: string): Promise<boolean> {
  try {
    await getApp().messaging().send({
      token,
      notification: { title, body },
      android: { priority: 'high', notification: { sound: 'default' } },
    })
    return true
  } catch {
    return false
  }
}

export async function sendFcmToMany(tokens: string[], title: string, body: string): Promise<{ sent: number, invalid: string[] }> {
  if (!tokens.length) return { sent: 0, invalid: [] }

  const results = await Promise.all(tokens.map(t => sendFcmNotification(t, title, body).then(ok => ({ token: t, ok }))))
  return {
    sent: results.filter(r => r.ok).length,
    invalid: results.filter(r => !r.ok).map(r => r.token),
  }
}
