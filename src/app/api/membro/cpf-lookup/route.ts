import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getIp } from '@/lib/rate-limit'

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, '')
}

function formatCpf(digits: string) {
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 10, 60_000)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 })
  }

  const { cpf } = await req.json()
  if (!cpf) return NextResponse.json({ error: 'CPF obrigatório' }, { status: 400 })

  const normalized = normalizeCpf(cpf)
  if (normalized.length !== 11) return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })

  const member = await prisma.member.findFirst({
    where: { cpfCnpj: normalized, active: true },
    select: {
      memberPassword: true,
      church: { select: { slug: true, name: true, primaryColor: true, secondaryColor: true, logoUrl: true } },
    },
  }) ?? await prisma.member.findFirst({
    where: { cpfCnpj: formatCpf(normalized), active: true },
    select: {
      memberPassword: true,
      church: { select: { slug: true, name: true, primaryColor: true, secondaryColor: true, logoUrl: true } },
    },
  })

  if (!member) return NextResponse.json({ error: 'CPF não encontrado' }, { status: 404 })

  return NextResponse.json({
    slug: member.church.slug,
    church: member.church,
    firstAccess: !member.memberPassword,
  })
}
