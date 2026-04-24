import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, memberId, month, year, title, message } = await req.json()

  if (!slug || !title || !message) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  let targetMemberIds: string[]

  if (memberId) {
    targetMemberIds = [memberId]
  } else {
    // Todos os dizimantes que ainda não pagaram este mês
    const tithers = await prisma.member.findMany({
      where: { churchId: church.id, isTither: true, active: true },
      select: { id: true },
    })
    const paid = await prisma.tithe.findMany({
      where: { churchId: church.id, month, year },
      select: { memberId: true },
    })
    const paidIds = new Set(paid.map((t) => t.memberId))
    targetMemberIds = tithers.map((m) => m.id).filter((id) => !paidIds.has(id))
  }

  if (targetMemberIds.length === 0) return NextResponse.json({ ok: true, sent: 0, total: 0 })

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { churchId: church.id, memberId: { in: targetMemberIds } },
  })

  const payload = JSON.stringify({ title, body: message, url: '/dizimo' })

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

  return NextResponse.json({ ok: true, sent, total: subscriptions.length })
}
