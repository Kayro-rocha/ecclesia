import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({
    where: { slug },
    select: {
      id: true, name: true, slug: true,
      primaryColor: true, pixKey: true, whatsappInstance: true,
    },
  })

  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })
  return NextResponse.json(church)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, name, primaryColor, pixKey, whatsappInstance } = await req.json()

  const church = await prisma.church.update({
    where: { slug },
    data: {
      name: name || undefined,
      primaryColor: primaryColor || undefined,
      pixKey: pixKey || null,
      whatsappInstance: whatsappInstance || null,
    },
  })

  return NextResponse.json(church)
}
