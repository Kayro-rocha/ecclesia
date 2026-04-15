import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const church = await prisma.church.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          members: true, tithes: true, events: true,
          schedules: true, announcements: true, visitors: true,
          missions: true, pushSubscriptions: true,
        },
      },
      members: { where: { active: true }, select: { id: true, name: true, group: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      tithes: {
        where: { status: 'PAID' },
        select: { amount: true, month: true, year: true, paidAt: true },
        orderBy: { paidAt: 'desc' }, take: 10,
      },
    },
  })

  if (!church) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
  return NextResponse.json(church)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const { plan, active, name } = await req.json()

  const data: Record<string, unknown> = {}
  if (plan !== undefined) data.plan = plan
  if (active !== undefined) data.active = active
  if (name !== undefined) data.name = name

  const church = await prisma.church.update({ where: { id }, data })
  return NextResponse.json(church)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  // Soft delete — apenas desativa
  await prisma.church.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
