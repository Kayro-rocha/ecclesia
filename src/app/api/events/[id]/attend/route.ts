import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Membro confirma ou cancela presença (página pública — sem auth)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params
  const { memberId, name, phone, confirmed } = await req.json()

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

  if (memberId) {
    // Membro identificado — upsert pelo memberId
    const existing = await prisma.eventAttendee.findFirst({ where: { eventId, memberId } })
    if (existing) {
      await prisma.eventAttendee.update({ where: { id: existing.id }, data: { confirmed } })
    } else {
      const member = await prisma.member.findUnique({ where: { id: memberId } })
      await prisma.eventAttendee.create({
        data: { eventId, memberId, name: member?.name || name, phone: member?.phone || phone, confirmed },
      })
    }
  } else {
    // Não membro — upsert pelo telefone
    const existing = await prisma.eventAttendee.findFirst({ where: { eventId, phone } })
    if (existing) {
      await prisma.eventAttendee.update({ where: { id: existing.id }, data: { confirmed } })
    } else {
      await prisma.eventAttendee.create({ data: { eventId, name, phone, confirmed } })
    }
  }

  return NextResponse.json({ ok: true })
}

// Admin marca presença real no dia
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params
  const { attendeeId, present } = await req.json()

  await prisma.eventAttendee.update({ where: { id: attendeeId }, data: { present } })
  return NextResponse.json({ ok: true })
}
