import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CATEGORY_LABELS: Record<string, string> = {
  TITHE: 'Dízimo',
  OFFERING: 'Oferta de Coleta',
  DONATION: 'Doação',
  EVENT: 'Renda de Evento',
  OTHER: 'Outros',
}

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

  const items = await prisma.incomeManual.findMany({
    where: { churchId: church.id, date: { gte: startDate, lte: endDate } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(
    items.map((i) => ({
      id: i.id,
      description: i.description,
      category: i.category,
      categoryLabel: CATEGORY_LABELS[i.category] || i.category,
      amount: i.amount,
      date: i.date,
      isFromTithe: !!i.titheId,
    }))
  )
}
