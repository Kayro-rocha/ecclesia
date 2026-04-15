import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalChurches,
    activeChurches,
    inactiveChurches,
    basicPlan,
    proPlan,
    newChurches30d,
    totalMembers,
    totalUsers,
    churchesPerMonth,
  ] = await Promise.all([
    prisma.church.count(),
    prisma.church.count({ where: { active: true } }),
    prisma.church.count({ where: { active: false } }),
    prisma.church.count({ where: { plan: 'BASIC', active: true } }),
    prisma.church.count({ where: { plan: 'PRO', active: true } }),
    prisma.church.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.member.count({ where: { active: true } }),
    prisma.user.count(),
    prisma.church.groupBy({
      by: ['createdAt'],
      _count: true,
      orderBy: { createdAt: 'asc' },
    }),
  ])

  // MRR estimado (BASIC = R$97, PRO = R$197)
  const mrr = basicPlan * 97 + proPlan * 197

  // Agrupa cadastros por mês (últimos 6 meses)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), count: 0 }
  })

  const recentChurches = await prisma.church.findMany({
    where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
    select: { createdAt: true },
  })

  recentChurches.forEach(c => {
    const m = c.createdAt.getMonth() + 1
    const y = c.createdAt.getFullYear()
    const slot = last6Months.find(s => s.month === m && s.year === y)
    if (slot) slot.count++
  })

  return NextResponse.json({
    totalChurches,
    activeChurches,
    inactiveChurches,
    basicPlan,
    proPlan,
    newChurches30d,
    totalMembers,
    totalUsers,
    mrr,
    growthChart: last6Months,
  })
}
