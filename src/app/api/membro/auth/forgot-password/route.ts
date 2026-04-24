import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMemberPasswordResetEmail } from '@/lib/email'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { randomUUID } from 'crypto'

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, '')
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`forgot:${getIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 })
  }

  const { cpf } = await req.json()
  if (!cpf) return NextResponse.json({ error: 'CPF obrigatório' }, { status: 400 })

  const normalized = normalizeCpf(cpf)

  const member = await prisma.member.findFirst({
    where: { cpfCnpj: normalized, active: true },
    include: { church: { select: { slug: true, name: true } } },
  }) ?? await prisma.member.findFirst({
    where: { cpfCnpj: normalized.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'), active: true },
    include: { church: { select: { slug: true, name: true } } },
  })

  // Sempre retorna ok — não revela se o CPF existe
  if (!member) return NextResponse.json({ ok: true })

  if (!member.email) {
    return NextResponse.json({ ok: true, noEmail: true })
  }

  // Invalida tokens anteriores
  await prisma.memberResetToken.updateMany({
    where: { memberId: member.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  const token = randomUUID()
  await prisma.memberResetToken.create({
    data: {
      memberId: member.id,
      slug: member.church.slug,
      token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  })

  await sendMemberPasswordResetEmail(member.email, member.name, token)

  return NextResponse.json({ ok: true })
}
