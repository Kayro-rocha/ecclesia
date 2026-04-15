import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { slug, subscription, memberId } = await req.json()

  if (!slug || !subscription?.endpoint) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const p256dh = subscription.keys?.p256dh
  const auth = subscription.keys?.auth

  if (!p256dh || !auth) {
    return NextResponse.json({ error: 'Chaves de subscription inválidas' }, { status: 400 })
  }

  const endpoint: string = subscription.endpoint

  // memberId opcional — vincula ao membro se fornecido e pertencente à mesma igreja
  let resolvedMemberId: string | null = null
  if (memberId) {
    const member = await prisma.member.findFirst({
      where: { id: memberId, churchId: church.id },
      select: { id: true },
    })
    resolvedMemberId = member?.id ?? null
  }

  // Verifica se já existe pelo endpoint
  const existing = await prisma.pushSubscription.findFirst({
    where: { endpoint },
  })

  if (existing) {
    await prisma.pushSubscription.update({
      where: { id: existing.id },
      data: {
        p256dh, auth, churchId: church.id,
        ...(resolvedMemberId !== null ? { memberId: resolvedMemberId } : {}),
      },
    })
  } else {
    await prisma.pushSubscription.create({
      data: {
        churchId: church.id, endpoint, p256dh, auth,
        ...(resolvedMemberId ? { memberId: resolvedMemberId } : {}),
      },
    })
  }

  return NextResponse.json({ ok: true })
}
