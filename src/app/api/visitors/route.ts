import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasChurchAccess } from '@/lib/access'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const status = searchParams.get('status')
  const busca = searchParams.get('busca')

  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug }, select: { id: true, parentChurchId: true } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const user = session.user as any
  if (!hasChurchAccess(user, church)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const visitors = await prisma.visitor.findMany({
    where: {
      churchId: church.id,
      ...(status && status !== 'todos' ? { status: status as any } : {}),
      ...(busca ? { name: { contains: busca } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(visitors)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { slug, name, phone, invitedBy, howFound, wantsHomeVisit } = body

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const user = session.user as any
  if (!hasChurchAccess(user, church)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const visitor = await prisma.visitor.create({
    data: {
      churchId: church.id,
      name,
      phone,
      invitedBy: invitedBy || null,
      howFound: howFound || null,
      wantsHomeVisit,
    },
  })

  return NextResponse.json(visitor)
}
