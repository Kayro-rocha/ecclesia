import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasChurchAccess } from '@/lib/access'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const slug = new URL(req.url).searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug }, select: { id: true, parentChurchId: true } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const user = session.user as any
  if (!hasChurchAccess(user, church)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const automation = await prisma.visitorAutomation.findUnique({ where: { churchId: church.id } })
  return NextResponse.json(automation ?? { enabled: false, triggerDays: 3, message: '' })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, enabled, triggerDays, message } = await req.json()
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug }, select: { id: true, parentChurchId: true } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const user = session.user as any
  if (!hasChurchAccess(user, church)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const automation = await prisma.visitorAutomation.upsert({
    where: { churchId: church.id },
    update: { enabled, triggerDays: Number(triggerDays), message },
    create: { churchId: church.id, enabled, triggerDays: Number(triggerDays), message },
  })

  return NextResponse.json(automation)
}
