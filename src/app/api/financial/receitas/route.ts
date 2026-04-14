import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const now = new Date()
  const m = month ? parseInt(month) : now.getMonth() + 1
  const y = year ? parseInt(year) : now.getFullYear()
  const startDate = new Date(y, m - 1, 1)
  const endDate = new Date(y, m, 0, 23, 59, 59)

  const [tithes, offerings, manual] = await Promise.all([
    prisma.tithe.findMany({
      where: { churchId: church.id, status: 'PAID', paidAt: { gte: startDate, lte: endDate } },
      include: { member: { select: { name: true } } },
      orderBy: { paidAt: 'desc' },
    }),
    prisma.offering.findMany({
      where: { churchId: church.id, createdAt: { gte: startDate, lte: endDate } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.incomeManual.findMany({
      where: { churchId: church.id, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'desc' },
    }),
  ])

  const items = [
    ...tithes.map((t) => ({
      id: t.id,
      source: 'TITHE' as const,
      description: `Dízimo — ${t.member.name}`,
      amount: t.amount,
      date: t.paidAt,
    })),
    ...offerings.map((o) => ({
      id: o.id,
      source: 'OFFERING' as const,
      description: `Oferta${o.type ? ` — ${o.type}` : ''}`,
      amount: o.amount,
      date: o.createdAt,
    })),
    ...manual.map((i) => ({
      id: i.id,
      source: 'MANUAL' as const,
      description: i.description,
      amount: i.amount,
      date: i.date,
    })),
  ].sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())

  return NextResponse.json(items)
}
