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

  // Receitas automáticas: dízimos pagos
  const tithes = await prisma.tithe.findMany({
    where: { churchId: church.id, status: 'PAID', paidAt: { gte: startDate, lte: endDate } },
  })

  // Receitas automáticas: ofertas via PIX
  const offerings = await prisma.offering.findMany({
    where: { churchId: church.id, createdAt: { gte: startDate, lte: endDate } },
  })

  // Receitas manuais (coleta, doações em espécie)
  const incomesManual = await prisma.incomeManual.findMany({
    where: { churchId: church.id, date: { gte: startDate, lte: endDate } },
  })

  // Despesas
  const expenses = await prisma.expense.findMany({
    where: { churchId: church.id, date: { gte: startDate, lte: endDate } },
  })

  const totalTithes = tithes.reduce((s, t) => s + t.amount, 0)
  const totalOfferings = offerings.reduce((s, o) => s + o.amount, 0)
  const totalIncomesManual = incomesManual.reduce((s, i) => s + i.amount, 0)
  const totalReceitas = totalTithes + totalOfferings + totalIncomesManual
  const totalDespesas = expenses.reduce((s, e) => s + e.amount, 0)

  // Despesas por categoria
  const expensesByCategory: Record<string, number> = {}
  for (const e of expenses) {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount
  }

  // Receitas por categoria
  const incomesByCategory: Record<string, number> = {
    TITHE: totalTithes,
    OFFERING: totalOfferings,
  }
  for (const i of incomesManual) {
    incomesByCategory[i.category] = (incomesByCategory[i.category] || 0) + i.amount
  }

  // Histórico dos últimos 6 meses
  const history = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    const hm = d.getMonth() + 1
    const hy = d.getFullYear()
    const hStart = new Date(hy, hm - 1, 1)
    const hEnd = new Date(hy, hm, 0, 23, 59, 59)

    const [hTithes, hOfferings, hIncomes, hExpenses] = await Promise.all([
      prisma.tithe.aggregate({ where: { churchId: church.id, status: 'PAID', paidAt: { gte: hStart, lte: hEnd } }, _sum: { amount: true } }),
      prisma.offering.aggregate({ where: { churchId: church.id, createdAt: { gte: hStart, lte: hEnd } }, _sum: { amount: true } }),
      prisma.incomeManual.aggregate({ where: { churchId: church.id, date: { gte: hStart, lte: hEnd } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { churchId: church.id, date: { gte: hStart, lte: hEnd } }, _sum: { amount: true } }),
    ])

    history.push({
      month: hm,
      year: hy,
      receitas: (hTithes._sum.amount || 0) + (hOfferings._sum.amount || 0) + (hIncomes._sum.amount || 0),
      despesas: hExpenses._sum.amount || 0,
    })
  }

  return NextResponse.json({
    month: m,
    year: y,
    totalReceitas,
    totalDespesas,
    resultado: totalReceitas - totalDespesas,
    breakdown: { totalTithes, totalOfferings, totalIncomesManual },
    expensesByCategory,
    incomesByCategory,
    history,
  })
}
