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

  const events = await prisma.event.findMany({
    where: { churchId: church.id },
    include: { _count: { select: { attendees: true } } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, title, description, date, location, targetGroup, imageUrl } = await req.json()
  if (!slug || !title || !date) {
    return NextResponse.json({ error: 'Título e data são obrigatórios' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const event = await prisma.event.create({
    data: {
      churchId: church.id,
      title,
      description: description || null,
      date: new Date(date),
      location: location || null,
      targetGroup: targetGroup || null,
      imageUrl: imageUrl || null,
    },
  })

  return NextResponse.json(event, { status: 201 })
}
