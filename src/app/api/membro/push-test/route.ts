import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMembroSession } from '@/lib/membro-auth'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function POST() {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { memberId: session.memberId },
  })

  if (subscriptions.length === 0) {
    // Diagnóstico: verifica se existe subscription da igreja sem memberId vinculado
    const semMembro = await prisma.pushSubscription.count({
      where: { churchId: session.churchId, memberId: null },
    })
    const msg = semMembro > 0
      ? `Subscription existe mas sem vínculo ao membro (${semMembro} encontrada). Clique em "Ativar / Reativar" para vincular.`
      : 'Nenhuma subscription encontrada. Clique em "Ativar / Reativar notificações".'
    return NextResponse.json({ error: msg }, { status: 404 })
  }

  const payload = JSON.stringify({
    title: '🔔 Notificação de teste',
    body: 'Funcionou! Suas notificações estão ativas.',
    url: `/${session.slug}/membro/home`,
  })

  const toDelete: string[] = []
  let sent = 0

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) toDelete.push(sub.id)
      }
    }),
  )

  if (toDelete.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: toDelete } } })
  }

  return NextResponse.json({ ok: true, sent, total: subscriptions.length })
}
