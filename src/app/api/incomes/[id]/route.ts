import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasChurchAccess } from '@/lib/access'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const income = await prisma.incomeManual.findUnique({ where: { id }, select: { id: true, churchId: true } })
  if (!income) return NextResponse.json({ error: 'Receita não encontrada' }, { status: 404 })

  const user = session.user as any
  const church = await prisma.church.findUnique({ where: { id: income.churchId }, select: { id: true, parentChurchId: true } })
  if (!church || !hasChurchAccess(user, church)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const body = await req.json()
  const { description, amount, category, date } = body

  const updated = await prisma.incomeManual.update({
    where: { id },
    data: {
      description,
      amount: parseFloat(amount),
      category,
      date: new Date(date),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const income = await prisma.incomeManual.findUnique({ where: { id }, select: { id: true, churchId: true } })
  if (!income) return NextResponse.json({ error: 'Receita não encontrada' }, { status: 404 })

  const user = session.user as any
  const church = await prisma.church.findUnique({ where: { id: income.churchId }, select: { id: true, parentChurchId: true } })
  if (!church || !hasChurchAccess(user, church)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  await prisma.incomeManual.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
