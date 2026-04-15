import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Endpoint público — sem auth, sem dados de beneficiários
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const mission = await prisma.mission.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      deliveryDate: true,
      church: { select: { name: true, slug: true } },
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          committed: true,
          donations: {
            select: { id: true, donorName: true, quantity: true },
          },
        },
      },
    },
  })

  if (!mission) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json(mission)
}
