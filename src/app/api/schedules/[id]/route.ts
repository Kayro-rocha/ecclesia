import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { items: { include: { member: true } } },
  })

  if (!schedule) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json(schedule)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { title, date, department, items } = await req.json()

  const existing = await prisma.schedule.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Remove itens antigos e recria mantendo status de confirmação quando possível
  const existingItems = await prisma.scheduleItem.findMany({ where: { scheduleId: id } })
  const existingMap = new Map(existingItems.map(i => [i.memberId, i.confirmed]))

  await prisma.scheduleItem.deleteMany({ where: { scheduleId: id } })

  const schedule = await prisma.schedule.update({
    where: { id },
    data: {
      title,
      date: new Date(date),
      department,
      items: {
        create: items.map((item: { memberId: string; role: string }) => ({
          memberId: item.memberId,
          role: item.role,
          confirmed: existingMap.get(item.memberId) ?? false,
        })),
      },
    },
    include: { items: true },
  })

  return NextResponse.json(schedule)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const existing = await prisma.schedule.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.scheduleItem.deleteMany({ where: { scheduleId: id } })
  await prisma.schedule.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
