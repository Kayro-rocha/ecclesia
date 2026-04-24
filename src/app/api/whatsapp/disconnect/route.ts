import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { disconnectInstance } from '@/lib/evolution'
import { hasChurchAccess } from '@/lib/access'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug } = await req.json()
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const user = session.user as any
  const church = await prisma.church.findUnique({ where: { slug }, select: { id: true, parentChurchId: true } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })
  if (!hasChurchAccess(user, church)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  await disconnectInstance(slug)
  await prisma.church.update({ where: { slug }, data: { whatsappInstance: null } })

  return NextResponse.json({ ok: true })
}
