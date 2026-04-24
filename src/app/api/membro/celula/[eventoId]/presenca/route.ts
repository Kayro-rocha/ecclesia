import { NextRequest, NextResponse } from 'next/server'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

// Salva presença em lote: recebe array de { memberId, name, present }
export async function POST(req: NextRequest, { params }: { params: Promise<{ eventoId: string }> }) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { eventoId } = await params
  const { attendees } = await req.json() as { attendees: { memberId: string; name: string; present: boolean }[] }

  // Verifica que o evento pertence a uma célula que o membro lidera
  const event = await prisma.event.findFirst({
    where: { id: eventoId, cell: { leaderId: session.memberId } },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  // Remove presenças antigas de membros e reinicia
  await prisma.eventAttendee.deleteMany({
    where: { eventId: eventoId, memberId: { not: null } },
  })

  if (attendees.length > 0) {
    await prisma.eventAttendee.createMany({
      data: attendees.map((a) => ({
        eventId: eventoId,
        memberId: a.memberId,
        name: a.name,
        present: a.present,
        confirmed: true,
      })),
    })
  }

  return NextResponse.json({ ok: true })
}
