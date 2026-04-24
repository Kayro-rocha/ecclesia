import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getInstanceStatus } from '@/lib/evolution'
import { hasChurchAccess } from '@/lib/access'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const slug = new URL(req.url).searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const user = session.user as any
  const church = await prisma.church.findUnique({ where: { slug }, select: { id: true, parentChurchId: true } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })
  if (!hasChurchAccess(user, church)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { status, number } = await getInstanceStatus(slug)
  return NextResponse.json({ status, number })
}
