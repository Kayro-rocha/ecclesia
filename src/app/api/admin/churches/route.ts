import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const search = req.nextUrl.searchParams.get('search') || ''
  const plan = req.nextUrl.searchParams.get('plan') || ''
  const status = req.nextUrl.searchParams.get('status') || ''

  const where: Record<string, unknown> = {}
  if (search) where.OR = [
    { name: { contains: search } },
    { slug: { contains: search } },
  ]
  if (plan) where.plan = plan
  if (status === 'active') where.active = true
  if (status === 'inactive') where.active = false

  const churches = await prisma.church.findMany({
    where,
    include: {
      _count: {
        select: { members: true, events: true, tithes: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(churches)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { name, slug, plan } = await req.json()
  if (!name || !slug) return NextResponse.json({ error: 'Nome e slug obrigatórios' }, { status: 400 })

  const existing = await prisma.church.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ error: 'Slug já em uso' }, { status: 409 })

  const church = await prisma.church.create({
    data: { name, slug, plan: plan || 'IGREJA' },
  })

  return NextResponse.json(church, { status: 201 })
}
