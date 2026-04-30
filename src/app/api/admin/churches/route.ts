import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const search = req.nextUrl.searchParams.get('search') || ''
  const plan = req.nextUrl.searchParams.get('plan') || ''
  const status = req.nextUrl.searchParams.get('status') || ''
  const format = req.nextUrl.searchParams.get('format') || ''
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const limit = 20

  const where: Record<string, unknown> = {}
  if (search) where.OR = [
    { name: { contains: search } },
    { slug: { contains: search } },
  ]
  if (plan) where.plan = plan
  if (status === 'active') where.active = true
  if (status === 'inactive') where.active = false

  // Exportação CSV — sem paginação, todos os registros
  if (format === 'csv') {
    const all = await prisma.church.findMany({
      where,
      include: { _count: { select: { members: true, events: true, tithes: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const header = ['Nome', 'Slug', 'Plano', 'Status', 'Membros', 'PIX', 'WhatsApp', 'Cadastro']
    const rows = all.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.slug,
      c.plan,
      c.active ? 'Ativa' : 'Inativa',
      c._count.members,
      c.pixKey ? 'Sim' : 'Não',
      c.whatsappInstance ? 'Sim' : 'Não',
      new Date(c.createdAt).toLocaleDateString('pt-BR'),
    ])

    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="igrejas-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  const [churches, total] = await Promise.all([
    prisma.church.findMany({
      where,
      include: {
        _count: { select: { members: true, events: true, tithes: true } },
        parent: { select: { id: true, name: true, slug: true } },
        filiais: { select: { id: true, name: true, slug: true, active: true }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.church.count({ where }),
  ])

  return NextResponse.json({ churches, total, page, totalPages: Math.ceil(total / limit) })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { ids, active } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0 || typeof active !== 'boolean') {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const churches = await prisma.church.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  })

  await prisma.church.updateMany({ where: { id: { in: ids } }, data: { active } })

  const adminName = session.user?.name || 'Admin'
  const action = active ? 'REATIVAR_IGREJA' : 'SUSPENDER_IGREJA'
  await Promise.all(
    churches.map(c => audit(adminName, action, c.name, `Ação em lote (${ids.length} igrejas)`))
  )

  return NextResponse.json({ updated: ids.length })
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

  const adminName = session.user?.name || 'Admin'
  await audit(adminName, 'CRIAR_IGREJA', name, `Slug: ${slug} | Plano: ${plan || 'IGREJA'}`)

  return NextResponse.json(church, { status: 201 })
}
