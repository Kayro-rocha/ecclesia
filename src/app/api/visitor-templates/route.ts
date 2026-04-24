import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasChurchAccess } from '@/lib/access'

const MAX_TEMPLATES = 5

async function getChurch(slug: string) {
  return prisma.church.findUnique({ where: { slug }, select: { id: true, parentChurchId: true } })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const slug = new URL(req.url).searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await getChurch(slug)
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const user = session.user as any
  if (!hasChurchAccess(user, church)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const templates = await prisma.visitorTemplate.findMany({
    where: { churchId: church.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, title, text } = await req.json()
  if (!slug || !title?.trim() || !text?.trim()) {
    return NextResponse.json({ error: 'Slug, título e texto obrigatórios' }, { status: 400 })
  }

  const church = await getChurch(slug)
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const user = session.user as any
  if (!hasChurchAccess(user, church)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const count = await prisma.visitorTemplate.count({ where: { churchId: church.id } })
  if (count >= MAX_TEMPLATES) {
    return NextResponse.json({ error: `Limite de ${MAX_TEMPLATES} templates atingido.` }, { status: 400 })
  }

  const template = await prisma.visitorTemplate.create({
    data: { churchId: church.id, title: title.trim(), text: text.trim() },
  })

  return NextResponse.json(template)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const template = await prisma.visitorTemplate.findUnique({ where: { id } })
  if (!template) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const user = session.user as any
  const templateChurch = await prisma.church.findUnique({ where: { id: template.churchId }, select: { id: true, parentChurchId: true } })
  if (!templateChurch || !hasChurchAccess(user, templateChurch)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  await prisma.visitorTemplate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
