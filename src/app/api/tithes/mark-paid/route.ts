import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, memberId, amount, month, year } = await req.json()

  if (!slug || !memberId || !amount || !month || !year) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const member = await prisma.member.findFirst({
    where: { id: memberId, churchId: church.id },
    select: { name: true },
  })
  if (!member) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })

  const paidAt = new Date()

  const tithe = await prisma.tithe.upsert({
    where: { churchId_memberId_month_year: { churchId: church.id, memberId, month, year } },
    create: { churchId: church.id, memberId, amount, month, year, status: 'PAID', paidAt },
    update: { amount, status: 'PAID', paidAt },
  })

  // Garante que existe exatamente um IncomeManual vinculado a este dízimo
  await prisma.incomeManual.deleteMany({ where: { titheId: tithe.id } })
  await prisma.incomeManual.create({
    data: {
      churchId: church.id,
      titheId: tithe.id,
      description: `Dízimo — ${member.name} — ${MESES[month - 1]} ${year}`,
      amount,
      category: 'TITHE',
      date: paidAt,
    },
  })

  return NextResponse.json({ ok: true, titheId: tithe.id })
}
