import { NextRequest, NextResponse } from 'next/server'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

interface Params { params: Promise<{ id: string }> }

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
