import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signMembroToken, MEMBRO_COOKIE } from '@/lib/membro-auth'
import bcrypt from 'bcryptjs'

// Normaliza CPF removendo pontuação
function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, '')
}

export async function POST(req: NextRequest) {
  const { slug, cpf, password } = await req.json()

  if (!slug || !cpf) {
    return NextResponse.json({ error: 'Slug e CPF obrigatórios' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  // Busca membro pelo CPF normalizado
  const members = await prisma.member.findMany({
    where: { churchId: church.id, active: true },
    select: { id: true, name: true, cpfCnpj: true, memberPassword: true, churchId: true },
  })
  const normalized = normalizeCpf(cpf)
  const member = members.find(m => m.cpfCnpj && normalizeCpf(m.cpfCnpj) === normalized)

  if (!member) {
    return NextResponse.json({ error: 'CPF não encontrado nesta igreja' }, { status: 404 })
  }

  // Primeiro acesso — ainda não tem senha
  if (!member.memberPassword) {
    return NextResponse.json({ firstAccess: true, memberId: member.id })
  }

  // Acesso normal — valida senha
  if (!password) {
    return NextResponse.json({ firstAccess: false, needsPassword: true })
  }

  const valid = await bcrypt.compare(password, member.memberPassword)
  if (!valid) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const token = await signMembroToken({ memberId: member.id, churchId: church.id, slug })

  const res = NextResponse.json({ ok: true, name: member.name })
  res.cookies.set(MEMBRO_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
