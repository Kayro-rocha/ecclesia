import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, titheId } = await req.json()

  if (!slug || !titheId) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const tithe = await prisma.tithe.findFirst({ where: { id: titheId, churchId: church.id } })
  if (!tithe) return NextResponse.json({ error: 'Dízimo não encontrado' }, { status: 404 })

  await prisma.incomeManual.deleteMany({ where: { titheId } })
  await prisma.tithe.delete({ where: { id: titheId } })

  return NextResponse.json({ ok: true })
}
