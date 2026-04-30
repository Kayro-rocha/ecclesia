import { NextRequest, NextResponse } from 'next/server'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { eventId, going, contributionItem } = await req.json()
  if (!eventId) return NextResponse.json({ error: 'eventId obrigatório' }, { status: 400 })

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { name: true },
  })
  if (!member) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })

  const existing = await prisma.eventAttendee.findFirst({
    where: { eventId, memberId: session.memberId },
  })

  if (existing) {
    await prisma.eventAttendee.update({
      where: { id: existing.id },
      data: {
        confirmed: going,
        ...(contributionItem !== undefined && { contributionItem: contributionItem || null }),
      },
    })
  } else {
    await prisma.eventAttendee.create({
      data: {
        eventId,
        memberId: session.memberId,
        name: member.name,
        confirmed: going,
        contributionItem: contributionItem || null,
      },
    })
  }

  return NextResponse.json({ ok: true })
}
