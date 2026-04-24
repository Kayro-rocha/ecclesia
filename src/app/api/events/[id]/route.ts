import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteUpload } from '@/lib/delete-upload'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      attendees: {
        include: { member: { select: { name: true, group: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  return NextResponse.json(event)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id }, select: { imageUrl: true } })
  await prisma.eventAttendee.deleteMany({ where: { eventId: id } })
  await prisma.event.delete({ where: { id } })
  await deleteUpload(event?.imageUrl ?? null)
  return NextResponse.json({ ok: true })
}
