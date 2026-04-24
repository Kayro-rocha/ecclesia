import { NextRequest, NextResponse } from 'next/server'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { cellId, title, description, date, imageUrl, notifyTarget } = await req.json()
  if (!cellId || !title || !date) {
    return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 })
  }

  // Verifica que o membro é líder desta célula
  const cell = await prisma.cell.findFirst({
    where: { id: cellId, leaderId: session.memberId, active: true },
    include: {
      members: { include: { member: { select: { id: true } } } },
      church: { select: { id: true, slug: true, name: true } },
    },
  })
  if (!cell) return NextResponse.json({ error: 'Célula não encontrada ou sem permissão' }, { status: 403 })

  // Cria o evento vinculado à célula
  const event = await prisma.event.create({
    data: {
      churchId: cell.church.id,
      cellId,
      title,
      description: description || null,
      date: new Date(date),
      imageUrl: imageUrl || null,
      targetGroup: notifyTarget === 'all' ? null : (notifyTarget || null),
    },
  })

  // Envia push notification
  const memberIds = cell.members.map((m) => m.member.id)
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      churchId: cell.church.id,
      ...(notifyTarget === 'cell'
        ? { memberId: { in: memberIds } }
        : {}),
    },
  })

  const payload = JSON.stringify({
    title: `📍 ${cell.name} — ${title}`,
    body: description ? description.slice(0, 100) : 'Nova reunião agendada. Confirme sua presença.',
    url: `/eventos`,
  })

  const toDelete: string[] = []
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) toDelete.push(sub.id)
      }
    })
  )
  if (toDelete.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: toDelete } } })
  }

  return NextResponse.json(event, { status: 201 })
}
