import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ valid: false, error: 'Token não informado' })

  const record = await prisma.onboardingToken.findUnique({ where: { token } })

  if (!record) return NextResponse.json({ valid: false, error: 'Link inválido' })
  if (record.usedAt) return NextResponse.json({ valid: false, error: 'Este link já foi utilizado. Acesse o painel da sua igreja.' })
  if (record.expiresAt < new Date()) return NextResponse.json({ valid: false, error: 'Link expirado. Entre em contato com o suporte.' })

  return NextResponse.json({ valid: true, email: record.email, plan: record.plan })
}
