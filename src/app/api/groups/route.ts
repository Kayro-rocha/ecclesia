import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const groups = await prisma.group.findMany({
    where: { churchId: church.id },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(groups)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, name } = await req.json()
  if (!slug || !name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const existing = await prisma.group.findFirst({ where: { churchId: church.id, name: name.trim() } })
  if (existing) return NextResponse.json({ error: 'Grupo já existe' }, { status: 409 })

  const group = await prisma.group.create({
    data: { churchId: church.id, name: name.trim() },
  })

  return NextResponse.json(group, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await req.json()
  await prisma.group.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
