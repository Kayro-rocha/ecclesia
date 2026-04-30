import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Retorna os últimos 12 meses de snapshots + backfill calculado para meses sem dados
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()
  const months: { month: number; year: number; label: string }[] = []

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    })
  }

  const stored = await prisma.mrrSnapshot.findMany({
    where: {
      OR: months.map(m => ({ month: m.month, year: m.year })),
    },
  })
  const storedMap = Object.fromEntries(stored.map(s => [`${s.year}-${s.month}`, s]))

  // Busca todas as igrejas para calcular meses sem snapshot
  const allChurches = await prisma.church.findMany({
    select: { id: true, plan: true, active: true, createdAt: true },
  })

  const result = await Promise.all(months.map(async ({ month, year, label }) => {
    const key = `${year}-${month}`
    if (storedMap[key]) {
      return { label, ...storedMap[key] }
    }

    // Calcula aproximação: igrejas criadas até o fim desse mês
    const endOfMonth = new Date(year, month, 0, 23, 59, 59)
    const existing = allChurches.filter(c => new Date(c.createdAt) <= endOfMonth)
    const igrejaPlan = existing.filter(c => c.plan === 'IGREJA').length
    const redePlan = existing.filter(c => c.plan === 'REDE').length
    const activeChurches = existing.length

    // Novos nesse mês
    const startOfMonth = new Date(year, month - 1, 1)
    const newChurches = allChurches.filter(c => {
      const d = new Date(c.createdAt)
      return d >= startOfMonth && d <= endOfMonth
    }).length

    // Churn: busca no audit log (disponível a partir de quando implementamos)
    const churnedChurches = await prisma.auditLog.count({
      where: {
        action: { in: ['SUSPENDER_IGREJA', 'ENCERRAR_CONTA'] },
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    const mrr = igrejaPlan * 79.9 + redePlan * 199.9

    return { label, month, year, mrr, activeChurches, igrejaPlan, redePlan, newChurches, churnedChurches }
  }))

  return NextResponse.json(result)
}

// Toma um snapshot do mês atual (chamado pelo cron)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const session = await getServerSession(authOptions)
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin = session?.user?.role === 'MASTER'
  if (!isCron && !isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const [igrejaPlan, redePlan] = await Promise.all([
    prisma.church.count({ where: { plan: 'IGREJA', active: true } }),
    prisma.church.count({ where: { plan: 'REDE', active: true } }),
  ])

  const startOfMonth = new Date(year, month - 1, 1)
  const [newChurches, churnedChurches] = await Promise.all([
    prisma.church.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.auditLog.count({
      where: {
        action: { in: ['SUSPENDER_IGREJA', 'ENCERRAR_CONTA'] },
        createdAt: { gte: startOfMonth },
      },
    }),
  ])

  const mrr = igrejaPlan * 79.9 + redePlan * 199.9
  const activeChurches = igrejaPlan + redePlan

  const snapshot = await prisma.mrrSnapshot.upsert({
    where: { month_year: { month, year } },
    update: { mrr, activeChurches, igrejaPlan, redePlan, newChurches, churnedChurches },
    create: { month, year, mrr, activeChurches, igrejaPlan, redePlan, newChurches, churnedChurches },
  })

  return NextResponse.json(snapshot)
}
