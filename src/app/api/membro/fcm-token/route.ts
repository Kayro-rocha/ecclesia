import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { memberId, token } = await req.json()
  if (!memberId || !token) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  await prisma.member.update({
    where: { id: memberId },
    data: { fcmToken: token },
  })

  return NextResponse.json({ ok: true })
}
