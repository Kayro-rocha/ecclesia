import { NextResponse } from 'next/server'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const cell = await prisma.cell.findFirst({
    where: { leaderId: session.memberId, active: true },
    include: {
      leader: { select: { id: true, name: true } },
      members: {
        include: { member: { select: { id: true, name: true, phone: true } } },
        orderBy: { member: { name: 'asc' } },
      },
      events: {
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          attendees: { select: { id: true, memberId: true, name: true, present: true } },
        },
      },
    },
  })

  if (!cell) return NextResponse.json({ cell: null })
  return NextResponse.json({ cell })
}
