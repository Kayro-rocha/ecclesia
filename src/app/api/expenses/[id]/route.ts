import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { description, amount, category, isRecurring, date } = body

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      description,
      amount: parseFloat(amount),
      category,
      isRecurring: isRecurring || false,
      date: new Date(date),
    },
  })

  return NextResponse.json(expense)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const expense = await prisma.expense.findUnique({ where: { id } })
  if (!expense) return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 })

  // Se era fixa, desmarca todas as outras ocorrências do mesmo gasto nos outros meses
  // para impedir que continuem sendo usadas como template de geração automática
  if (expense.isRecurring) {
    await prisma.expense.updateMany({
      where: {
        id: { not: id },
        churchId: expense.churchId,
        description: expense.description,
        category: expense.category,
        isRecurring: true,
      },
      data: { isRecurring: false },
    })
  }

  await prisma.expense.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
