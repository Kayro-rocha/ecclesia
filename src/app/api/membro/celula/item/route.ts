import { NextRequest, NextResponse } from 'next/server'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

// Reivindicar item predefinido
export async function POST(req: NextRequest) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { itemId } = await req.json()
  if (!itemId) return NextResponse.json({ error: 'itemId obrigatório' }, { status: 400 })

  const item = await prisma.eventItem.findUnique({ where: { id: itemId } })
  if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
  if (item.claimedBy && item.claimedBy !== session.memberId) {
    return NextResponse.json({ error: 'Item já foi escolhido por outro membro' }, { status: 409 })
  }

  await prisma.eventItem.update({ where: { id: itemId }, data: { claimedBy: session.memberId } })
  return NextResponse.json({ ok: true })
}

// Liberar item
export async function DELETE(req: NextRequest) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const itemId = req.nextUrl.searchParams.get('itemId')
  if (!itemId) return NextResponse.json({ error: 'itemId obrigatório' }, { status: 400 })

  await prisma.eventItem.updateMany({
    where: { id: itemId, claimedBy: session.memberId },
    data: { claimedBy: null },
  })
  return NextResponse.json({ ok: true })
}
