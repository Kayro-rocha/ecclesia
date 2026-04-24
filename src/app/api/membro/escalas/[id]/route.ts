import { NextRequest, NextResponse } from 'next/server'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

interface Params { params: Promise<{ id: string }> }

// Retorna detalhes da escala com todos os participantes
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params

  // Verifica que o item pertence ao membro logado
  const myItem = await prisma.scheduleItem.findFirst({
    where: { id, memberId: session.memberId },
    include: { schedule: true },
  })
  if (!myItem) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Busca todos os participantes da mesma escala
  const allItems = await prisma.scheduleItem.findMany({
    where: { scheduleId: myItem.scheduleId },
    include: { member: { select: { name: true } } },
    orderBy: { member: { name: 'asc' } },
  })

  return NextResponse.json({
    schedule: myItem.schedule,
    myItemId: myItem.id,
    participants: allItems.map(i => ({
      id: i.id,
      name: i.member.name,
      role: i.role,
      status: i.status,
      isMe: i.memberId === session.memberId,
    })),
  })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()

  if (!['CONFIRMED', 'DECLINED'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  // Garante que o item pertence ao membro logado
  const item = await prisma.scheduleItem.findFirst({
    where: { id, memberId: session.memberId },
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const updated = await prisma.scheduleItem.update({
    where: { id },
    data: {
      status: status as 'CONFIRMED' | 'DECLINED',
      confirmed: status === 'CONFIRMED',
    },
  })

  return NextResponse.json(updated)
}
