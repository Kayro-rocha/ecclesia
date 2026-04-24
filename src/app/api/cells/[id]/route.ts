import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const cell = await prisma.cell.findUnique({
    where: { id },
    include: {
      leader: { select: { id: true, name: true, phone: true } },
      members: {
        include: { member: { select: { id: true, name: true, phone: true, group: true } } },
        orderBy: { member: { name: 'asc' } },
      },
      events: {
        orderBy: { date: 'desc' },
        include: {
          _count: { select: { attendees: true } },
          attendees: {
            where: { present: true },
            select: { id: true, memberId: true },
          },
        },
      },
    },
  })

  if (!cell) return NextResponse.json({ error: 'Célula não encontrada' }, { status: 404 })
  return NextResponse.json(cell)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { name, leaderId, dayOfWeek } = await req.json()

  const cell = await prisma.cell.update({
    where: { id },
    data: { name, leaderId, dayOfWeek: parseInt(dayOfWeek) },
  })

  return NextResponse.json(cell)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.cell.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
