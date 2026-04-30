import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'
import { sendFcmToMany } from '@/lib/fcm'

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, title, body, url } = await req.json()

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  // ── Web Push (PWA) ────────────────────────────────────────────────────────
  const subscriptions = await prisma.pushSubscription.findMany({ where: { churchId: church.id } })
  const payload = JSON.stringify({ title, body, url: url || '/' })
  let sent = 0
  const toDelete: string[] = []

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) toDelete.push(sub.id)
      }
    })
  )

  if (toDelete.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: toDelete } } })
  }

  // ── FCM (app nativo Android) ──────────────────────────────────────────────
  const members = await prisma.member.findMany({
    where: { churchId: church.id, fcmToken: { not: null } },
    select: { fcmToken: true },
  })
  const fcmTokens = members.map(m => m.fcmToken!).filter(Boolean)

  let fcmSent = 0
  if (fcmTokens.length > 0 && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const result = await sendFcmToMany(fcmTokens, title, body)
    fcmSent = result.sent

    // Remove tokens inválidos
    if (result.invalid.length > 0) {
      await prisma.member.updateMany({
        where: { fcmToken: { in: result.invalid } },
        data: { fcmToken: null },
      })
    }
  }

  return NextResponse.json({ ok: true, sent: sent + fcmSent, webPush: sent, fcm: fcmSent })
}
