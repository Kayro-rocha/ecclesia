import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { missionItemId, donorName, donorPhone, quantity } = await req.json()

  if (!missionItemId || !donorName?.trim()) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const qty = Math.max(1, parseInt(quantity) || 1)

  const item = await prisma.missionItem.findUnique({
    where: { id: missionItemId },
  })

  if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
  if (item.missionId !== id) return NextResponse.json({ error: 'Item não pertence a esta campanha' }, { status: 400 })

  const disponivel = item.quantity - item.committed
  if (disponivel <= 0) {
    return NextResponse.json({ error: 'Este item já atingiu a quantidade necessária' }, { status: 409 })
  }

  const qtyFinal = Math.min(qty, disponivel)

  await prisma.$transaction([
    prisma.missionDonor.create({
      data: {
        missionItemId,
        donorName: donorName.trim(),
        donorPhone: donorPhone?.trim() || '',
        quantity: qtyFinal,
      },
    }),
    prisma.missionItem.update({
      where: { id: missionItemId },
      data: { committed: { increment: qtyFinal } },
    }),
  ])

  return NextResponse.json({ ok: true, quantity: qtyFinal })
}
