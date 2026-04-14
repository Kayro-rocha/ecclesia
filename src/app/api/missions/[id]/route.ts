import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const mission = await prisma.mission.findUnique({
    where: { id },
    include: { items: { include: { donations: true } } },
  })
  if (!mission) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json(mission)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, description, deliveryDate, items } = body

  await prisma.mission.update({
    where: { id },
    data: {
      title,
      description: description || null,
      deliveryDate: new Date(deliveryDate),
    },
  })

  if (items) {
    const existingItems = await prisma.missionItem.findMany({ where: { missionId: id } })
    const incomingIds = (items as Array<{ id?: string }>).filter(i => i.id).map(i => i.id as string)

    // Delete items not in incoming list (only if committed === 0)
    for (const existing of existingItems) {
      if (!incomingIds.includes(existing.id) && existing.committed === 0) {
        await prisma.missionItem.delete({ where: { id: existing.id } })
      }
    }

    // Update or create items
    for (const item of items as Array<{ id?: string; name: string; quantity: number }>) {
      if (item.id) {
        await prisma.missionItem.update({
          where: { id: item.id },
          data: { name: item.name, quantity: item.quantity },
        })
      } else {
        await prisma.missionItem.create({
          data: { missionId: id, name: item.name, quantity: item.quantity },
        })
      }
    }
  }

  const mission = await prisma.mission.findUnique({
    where: { id },
    include: { items: { include: { donations: true } } },
  })

  return NextResponse.json(mission)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const items = await prisma.missionItem.findMany({ where: { missionId: id } })
  for (const item of items) {
    await prisma.missionDonor.deleteMany({ where: { missionItemId: item.id } })
  }
  await prisma.missionItem.deleteMany({ where: { missionId: id } })
  await prisma.mission.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
