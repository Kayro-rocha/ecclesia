import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { slug, name, phone, cpfCnpj, email, group, role, isTither, suggestedTithe } = body

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const member = await prisma.member.create({
    data: {
      churchId: church.id,
      name,
      phone,
      cpfCnpj: cpfCnpj || null,
      email: email || null,
      group: group || null,
      role,
      isTither,
      suggestedTithe: suggestedTithe ? parseFloat(suggestedTithe) : null,
    },
  })

  return NextResponse.json(member)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const members = await prisma.member.findMany({
    where: { churchId: church.id, active: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(members)
}