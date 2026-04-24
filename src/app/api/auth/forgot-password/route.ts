import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })

  // Sempre retorna sucesso para não revelar se o email existe
  if (!user) return NextResponse.json({ ok: true })

  // Invalida tokens anteriores
  await prisma.passwordResetToken.updateMany({
    where: { email, usedAt: null },
    data: { usedAt: new Date() },
  })

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

  await prisma.passwordResetToken.create({ data: { email, token, expiresAt } })

  await sendPasswordResetEmail(email, token)

  return NextResponse.json({ ok: true })
}
