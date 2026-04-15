import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signMembroToken, MEMBRO_COOKIE } from '@/lib/membro-auth'
import bcrypt from 'bcryptjs'

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, '')
}

export async function POST(req: NextRequest) {
  const { slug, cpf, password } = await req.json()

  if (!slug || !cpf || !password) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const members = await prisma.member.findMany({
    where: { churchId: church.id, active: true },
    select: { id: true, name: true, cpfCnpj: true, memberPassword: true },
  })
  const normalized = normalizeCpf(cpf)
  const member = members.find(m => m.cpfCnpj && normalizeCpf(m.cpfCnpj) === normalized)

  if (!member) return NextResponse.json({ error: 'CPF não encontrado' }, { status: 404 })
  if (member.memberPassword) return NextResponse.json({ error: 'Senha já definida' }, { status: 400 })

  const hash = await bcrypt.hash(password, 10)
  await prisma.member.update({ where: { id: member.id }, data: { memberPassword: hash } })

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
