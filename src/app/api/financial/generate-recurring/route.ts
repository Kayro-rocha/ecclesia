import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, month, year } = await req.json()
  if (!slug || !month || !year) return NextResponse.json({ error: 'Dados obrigatórios faltando' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  // Não gerar para meses futuros
  const now = new Date()
  const selectedDate = new Date(year, month - 1, 1)
  const currentDate = new Date(now.getFullYear(), now.getMonth(), 1)
  if (selectedDate > currentDate) return NextResponse.json({ generated: 0 })

  // Mês anterior
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevStart = new Date(prevYear, prevMonth - 1, 1)
  const prevEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59)

  // Mês atual
  const currStart = new Date(year, month - 1, 1)
  const currEnd = new Date(year, month, 0, 23, 59, 59)

  // Busca fixas do mês anterior
  const recurring = await prisma.expense.findMany({
    where: { churchId: church.id, isRecurring: true, date: { gte: prevStart, lte: prevEnd } },
  })

  if (recurring.length === 0) return NextResponse.json({ generated: 0 })

  // Verifica se o mês atual já tem fixas geradas
  const alreadyExists = await prisma.expense.findFirst({
    where: { churchId: church.id, isRecurring: true, date: { gte: currStart, lte: currEnd } },
  })

  if (alreadyExists) return NextResponse.json({ generated: 0 })

  // Gera as fixas do mês atual com data no dia 1
  const created = await prisma.$transaction(
    recurring.map((e) =>
      prisma.expense.create({
        data: {
          churchId: church.id,
          description: e.description,
          amount: e.amount,
          category: e.category,
          isRecurring: true,
          date: new Date(year, month - 1, 1),
        },
      })
    )
  )

  return NextResponse.json({ generated: created.length })
}
