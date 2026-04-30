import { NextRequest, NextResponse } from 'next/server'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true, title: true, description: true, date: true, imageUrl: true, listMode: true,
      items: {
        select: { id: true, label: true, claimedBy: true, member: { select: { name: true } } },
      },
      attendees: {
        select: { memberId: true, confirmed: true, contributionItem: true },
      },
    },
  })

  if (!event) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const myAttendee = event.attendees.find(a => a.memberId === session.memberId) ?? null

  return NextResponse.json({
    ...event,
    items: event.items.map(i => ({ ...i, claimedByName: i.member?.name ?? null })),
    myAttendee,
  })
}
