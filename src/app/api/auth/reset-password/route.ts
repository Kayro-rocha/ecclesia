import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })

  const record = await prisma.passwordResetToken.findUnique({ where: { token } })

  if (!record) return NextResponse.json({ error: 'Link inválido' }, { status: 400 })
  if (record.usedAt) return NextResponse.json({ error: 'Este link já foi utilizado' }, { status: 400 })
  if (record.expiresAt < new Date()) return NextResponse.json({ error: 'Link expirado. Solicite um novo.' }, { status: 400 })

  const hashed = await bcrypt.hash(password, 10)

  await prisma.user.update({ where: { email: record.email }, data: { password: hashed } })
  await prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } })

  return NextResponse.json({ ok: true })
}
