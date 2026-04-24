import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const cells = await prisma.cell.findMany({
    where: { churchId: church.id, active: true },
    include: {
      leader: { select: { id: true, name: true } },
      _count: { select: { members: true, events: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(cells)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, name, leaderId, dayOfWeek, memberIds } = await req.json()
  if (!slug || !name || !leaderId || dayOfWeek === undefined) {
    return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const cell = await prisma.cell.create({
    data: {
      churchId: church.id,
      name,
      leaderId,
      dayOfWeek: parseInt(dayOfWeek),
      members: {
        create: (memberIds ?? []).map((memberId: string) => ({ memberId })),
      },
    },
    include: {
      leader: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
  })

  return NextResponse.json(cell, { status: 201 })
}
