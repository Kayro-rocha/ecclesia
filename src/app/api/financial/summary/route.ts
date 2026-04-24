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

  const [incomesManual, expenses] = await Promise.all([
    prisma.incomeManual.findMany({
      where: { churchId: church.id, date: { gte: startDate, lte: endDate } },
    }),
    prisma.expense.findMany({
      where: { churchId: church.id, date: { gte: startDate, lte: endDate } },
    }),
  ])

  const totalReceitas = incomesManual.reduce((s, i) => s + i.amount, 0)
  const totalDespesas = expenses.reduce((s, e) => s + e.amount, 0)

  const expensesByCategory: Record<string, number> = {}
  for (const e of expenses) {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount
  }

  const incomesByCategory: Record<string, number> = {}
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

    const [hIncomes, hExpenses] = await Promise.all([
      prisma.incomeManual.aggregate({ where: { churchId: church.id, date: { gte: hStart, lte: hEnd } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { churchId: church.id, date: { gte: hStart, lte: hEnd } }, _sum: { amount: true } }),
    ])

    history.push({
      month: hm,
      year: hy,
      receitas: hIncomes._sum.amount || 0,
      despesas: hExpenses._sum.amount || 0,
    })
  }

  return NextResponse.json({
    month: m,
    year: y,
    totalReceitas,
    totalDespesas,
    resultado: totalReceitas - totalDespesas,
    expensesByCategory,
    incomesByCategory,
    history,
  })
}
