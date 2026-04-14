import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { description, amount, category, date } = body

  const income = await prisma.incomeManual.update({
    where: { id },
    data: {
      description,
      amount: parseFloat(amount),
      category,
      date: new Date(date),
    },
  })

  return NextResponse.json(income)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  await prisma.incomeManual.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
