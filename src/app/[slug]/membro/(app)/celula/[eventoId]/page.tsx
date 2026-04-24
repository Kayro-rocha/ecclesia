import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import ReuniaoClient from './ReuniaoClient'

interface Props {
  params: Promise<{ slug: string; eventoId: string }>
}

export default async function ReuniaoDetalhePage({ params }: Props) {
  const { slug, eventoId } = await params
  const session = await getMembroSession()
  if (!session || session.slug !== slug) redirect(`/${slug}/membro/login`)

  const event = await prisma.event.findFirst({
    where: { id: eventoId, cell: { leaderId: session.memberId } },
    include: {
      cell: {
        include: {
          members: {
            include: { member: { select: { id: true, name: true } } },
            orderBy: { member: { name: 'asc' } },
          },
        },
      },
      attendees: { select: { id: true, memberId: true, name: true, phone: true, present: true } },
    },
  })

  if (!event || !event.cell) redirect(`/${slug}/membro/celula`)

  const cellMembers = event.cell.members.map(m => m.member)
  const visitors = event.attendees.filter(a => a.memberId === null)

  return (
    <ReuniaoClient
      slug={slug}
      event={{
        id: event.id,
        title: event.title,
        date: event.date.toISOString(),
        imageUrl: event.imageUrl,
        description: event.description,
      }}
      cellMembers={cellMembers}
      existingAttendees={event.attendees.filter(a => a.memberId !== null).map(a => ({
        memberId: a.memberId!,
        name: a.name,
        present: a.present,
      }))}
      visitors={visitors.map(v => ({ id: v.id, name: v.name, phone: v.phone }))}
    />
  )
}
