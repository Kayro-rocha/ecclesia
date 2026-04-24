import { NextRequest, NextResponse } from 'next/server'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventoId: string }> }) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { eventoId } = await params
  const { name, phone } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const event = await prisma.event.findFirst({
    where: { id: eventoId, cell: { leaderId: session.memberId } },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const visitor = await prisma.eventAttendee.create({
    data: {
      eventId: eventoId,
      memberId: null,
      name,
      phone: phone || null,
      present: true,
      confirmed: true,
    },
  })

  return NextResponse.json(visitor, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ eventoId: string }> }) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { eventoId } = await params
  const attendeeId = req.nextUrl.searchParams.get('attendeeId')
  if (!attendeeId) return NextResponse.json({ error: 'attendeeId obrigatório' }, { status: 400 })

  const event = await prisma.event.findFirst({
    where: { id: eventoId, cell: { leaderId: session.memberId } },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  await prisma.eventAttendee.delete({ where: { id: attendeeId } })
  return NextResponse.json({ ok: true })
}
