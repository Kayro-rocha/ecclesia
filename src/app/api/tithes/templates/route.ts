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

  const templates = await prisma.messageTemplate.findMany({
    where: { churchId: church.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, title, body } = await req.json()

  if (!slug || !title || !body) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const template = await prisma.messageTemplate.create({
    data: { churchId: church.id, title, body },
  })

  return NextResponse.json(template, { status: 201 })
}
