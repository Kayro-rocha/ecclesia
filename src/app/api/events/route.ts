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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const events = await prisma.event.findMany({
    where: { churchId: church.id },
    include: { _count: { select: { attendees: true } } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, title, description, date, location, targetGroup, imageUrl, cellId } = await req.json()
  if (!slug || !title || !date) {
    return NextResponse.json({ error: 'Título e data são obrigatórios' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const event = await prisma.event.create({
    data: {
      churchId: church.id,
      title,
      description: description || null,
      date: new Date(date),
      location: location || null,
      targetGroup: targetGroup || null,
      imageUrl: imageUrl || null,
      cellId: cellId || null,
    },
  })

  // Push notification
  const subsWhere: { churchId: string; memberId?: { in: string[] } } = {
    churchId: church.id,
  }
  if (cellId) {
    const cell = await prisma.cell.findUnique({
      where: { id: cellId },
      include: { members: { select: { memberId: true } } },
    })
    if (cell) subsWhere.memberId = { in: cell.members.map(m => m.memberId) }
  } else if (targetGroup) {
    const members = await prisma.member.findMany({
      where: { churchId: church.id, group: targetGroup, active: true },
      select: { id: true },
    })
    subsWhere.memberId = { in: members.map(m => m.id) }
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where: subsWhere })

  const eventDate = new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  const payload = JSON.stringify({
    title: `📅 ${title}`,
    body: description ? description.slice(0, 100) : `Novo evento em ${eventDate}`,
    icon: '/icon-192.png',
    url: `/${slug}/membro/eventos`,
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
