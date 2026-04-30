import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasChurchAccess } from '@/lib/access'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const expense = await prisma.expense.findUnique({ where: { id }, select: { id: true, churchId: true } })
  if (!expense) return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 })

  const user = session.user as any
  const church = await prisma.church.findUnique({ where: { id: expense.churchId }, select: { id: true, parentChurchId: true } })
  if (!church || !hasChurchAccess(user, church)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await req.json()
  const { description, amount, category, isRecurring, date } = body

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      description,
      amount: parseFloat(amount),
      category,
      isRecurring: isRecurring || false,
      date: new Date(date),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const expense = await prisma.expense.findUnique({ where: { id } })
  if (!expense) return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 })

  const user = session.user as any
  const church = await prisma.church.findUnique({ where: { id: expense.churchId }, select: { id: true, parentChurchId: true } })
  if (!church || !hasChurchAccess(user, church)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

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
