import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import EventosList from './EventosList'

export const metadata = { title: 'Eventos' }


interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ id?: string }>
}

export default async function MembroEventosPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { id: openId } = await searchParams
  const session = await getMembroSession()
  if (!session) redirect(`/${slug}/membro/login`)

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { group: true, name: true, phone: true },
  })

  const now = new Date()
  const groupFilter = [
    { targetGroup: null },
    { targetGroup: '' },
    ...(member?.group ? [{ targetGroup: member.group }] : []),
  ]

  const [proximos, anteriores] = await Promise.all([
    prisma.event.findMany({
      where: { churchId: session.churchId, date: { gte: now }, OR: groupFilter },
      orderBy: { date: 'asc' },
    }),
    prisma.event.findMany({
      where: { churchId: session.churchId, date: { lt: now }, OR: groupFilter },
      orderBy: { date: 'desc' },
      take: 10,
    }),
  ])

  const allIds = [...proximos, ...anteriores].map(e => e.id)

  // Busca confirmações do membro logado para esses eventos
  const attendees = await prisma.eventAttendee.findMany({
    where: { memberId: session.memberId, eventId: { in: allIds } },
    select: { eventId: true, confirmed: true },
  })

  const rsvpMap: Record<string, boolean | null> = {}
  for (const a of attendees) {
    rsvpMap[a.eventId] = a.confirmed
  }

  return (
    <EventosList
      proximos={proximos}
      anteriores={anteriores}
      rsvpMap={rsvpMap}
      memberId={session.memberId}
      memberName={member?.name ?? ''}
      memberPhone={member?.phone ?? ''}
      initialOpenId={openId ?? null}
    />
  )
}
