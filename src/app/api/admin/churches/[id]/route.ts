import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendOnboardingEmail } from '@/lib/email'
import { audit } from '@/lib/audit'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const church = await prisma.church.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          members: true, tithes: true, events: true,
          schedules: true, announcements: true, visitors: true,
          missions: true, pushSubscriptions: true,
        },
      },
      members: { where: { active: true }, select: { id: true, name: true, group: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      tithes: {
        where: { status: 'PAID' },
        select: { amount: true, month: true, year: true, paidAt: true },
        orderBy: { paidAt: 'desc' }, take: 10,
      },
    },
  })

  if (!church) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })

  const pastor = await prisma.user.findFirst({
    where: { churchId: id, role: 'PASTOR' },
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json({ ...church, users: pastor ? [pastor] : [] })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { plan, active, name, encerrar, sendInvite, inviteEmail } = body
  const adminName = session.user?.name || 'Admin'

  // Enviar/reenviar convite de onboarding
  if (sendInvite) {
    if (!inviteEmail) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
    const church = await prisma.church.findUnique({ where: { id }, select: { name: true, plan: true } })
    if (!church) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })

    const token = randomBytes(32).toString('hex')
    await prisma.onboardingToken.create({
      data: {
        email: inviteEmail,
        token,
        plan: church.plan as 'IGREJA' | 'REDE',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    })
    await sendOnboardingEmail(inviteEmail, token, church.plan)
    await audit(adminName, 'ENVIAR_CONVITE', church.name, `Email: ${inviteEmail}`)
    return NextResponse.json({ ok: true })
  }

  // Encerramento definitivo
  if (encerrar) {
    const church = await prisma.church.findUnique({ where: { id }, select: { slug: true, name: true } })
    if (!church) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })

    if (!church.slug.startsWith('_cancelado-')) {
      const cancelledSlug = `_cancelado-${Date.now()}-${church.slug}`
      await prisma.church.update({ where: { id }, data: { active: false, slug: cancelledSlug } })
      await audit(adminName, 'ENCERRAR_CONTA', church.name, `Slug liberado: ${church.slug}`)
    }
    return NextResponse.json({ ok: true })
  }

  const church = await prisma.church.findUnique({ where: { id }, select: { name: true, plan: true, active: true } })
  if (!church) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (plan !== undefined) data.plan = plan
  if (active !== undefined) data.active = active
  if (name !== undefined) data.name = name

  const updated = await prisma.church.update({ where: { id }, data })

  if (active !== undefined && active !== church.active) {
    await audit(adminName, active ? 'REATIVAR_IGREJA' : 'SUSPENDER_IGREJA', church.name)
  }
  if (plan !== undefined && plan !== church.plan) {
    await audit(adminName, 'ALTERAR_PLANO', church.name, `${church.plan} → ${plan}`)
  }
  if (name !== undefined && name !== church.name) {
    await audit(adminName, 'RENOMEAR_IGREJA', church.name, `Novo nome: ${name}`)
  }

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const church = await prisma.church.findUnique({ where: { id }, select: { name: true } })
  await prisma.church.update({ where: { id }, data: { active: false } })
  if (church) await audit('Sistema', 'SUSPENDER_IGREJA', church.name)
  return NextResponse.json({ ok: true })
}
