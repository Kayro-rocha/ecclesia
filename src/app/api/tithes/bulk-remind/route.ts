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

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, month, year } = await req.json()

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  // Apenas pendentes — nunca pagos ou isentos
  const pendingTithes = await prisma.tithe.findMany({
    where: { churchId: church.id, month, year, status: 'PENDING' },
    include: { member: { select: { id: true, name: true } } },
  })

  if (pendingTithes.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, total: 0 })
  }

  const pendingMemberIds = pendingTithes.map((t) => t.memberId)

  // Subscrições vinculadas aos membros pendentes
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { churchId: church.id, memberId: { in: pendingMemberIds } },
  })

  // Mapeia memberId → subscrições
  const subsByMember = new Map<string, typeof subscriptions>()
  for (const sub of subscriptions) {
    if (!sub.memberId) continue
    if (!subsByMember.has(sub.memberId)) subsByMember.set(sub.memberId, [])
    subsByMember.get(sub.memberId)!.push(sub)
  }

  let sent = 0
  const toDelete: string[] = []

  await Promise.all(
    pendingTithes.map(async (tithe) => {
      const memberSubs = subsByMember.get(tithe.memberId) ?? []
      if (memberSubs.length === 0) return

      const firstName = tithe.member.name.split(' ')[0]
      const payload = JSON.stringify({
        title: `💰 Dízimo de ${MESES[month - 1]} pendente`,
        body: `${firstName}, seu dízimo de ${MESES[month - 1]} ${year} ainda não foi pago. Toque para ver.`,
        url: '/dizimo',
      })

      await Promise.all(
        memberSubs.map(async (sub) => {
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
    })
  )

  if (toDelete.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: toDelete } } })
  }

  return NextResponse.json({ ok: true, sent, total: pendingTithes.length })
}
