import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasChurchAccess } from '@/lib/access'

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
  if (!hasChurchAccess(user, church)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const cultos = await prisma.cultoSchedule.findMany({
    where: { churchId: church.id, active: true },
    orderBy: [{ weekday: 'asc' }, { hour: 'asc' }],
  })
  return NextResponse.json(cultos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, weekday, hour, minute } = await req.json()
  if (!slug || weekday === undefined || hour === undefined) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const church = await getChurch(slug)
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const user = session.user as any
  if (!hasChurchAccess(user, church)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const culto = await prisma.cultoSchedule.create({
    data: { churchId: church.id, weekday: Number(weekday), hour: Number(hour), minute: Number(minute ?? 0) },
  })
  return NextResponse.json(culto)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const culto = await prisma.cultoSchedule.findUnique({ where: { id } })
  if (!culto) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const church = await prisma.church.findUnique({ where: { id: culto.churchId }, select: { id: true, parentChurchId: true } })
  const user = session.user as any
  if (!church || !hasChurchAccess(user, church)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  await prisma.cultoSchedule.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
