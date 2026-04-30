import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '../lookup/route'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const { slug, token, name, phone, invitedBy, howFound, wantsHomeVisit } = body

  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  // ── Visitante retornando (token assinado) ─────────
  if (token) {
    const visitorId = verifyToken(token)
    if (!visitorId) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 })
    }

    const existing = await prisma.visitor.findUnique({ where: { id: visitorId } })
    if (!existing || existing.churchId !== church.id) {
      return NextResponse.json({ error: 'Visitante não encontrado' }, { status: 404 })
    }

    const updated = await prisma.visitor.update({
      where: { id: visitorId },
      data: {
        visits: { increment: 1 },
        lastVisit: new Date(),
        status: existing.status === 'NEW' ? 'RETURNED' : existing.status,
      },
    })

    return NextResponse.json({ ok: true, type: 'returning', name: updated.name })
  }

  // ── Novo visitante ────────────────────────────────
  if (!name || !phone) {
    return NextResponse.json({ error: 'Nome e telefone obrigatórios' }, { status: 400 })
  }

  // Bloqueia telefone duplicado na mesma igreja
  const phoneDigits = phone.replace(/\D/g, '').replace(/^55/, '')
  const existing = await prisma.visitor.findMany({
    where: { churchId: church.id },
    select: { phone: true },
  })
  const duplicate = existing.find(v => v.phone.replace(/\D/g, '').replace(/^55/, '') === phoneDigits)
  if (duplicate) {
    return NextResponse.json({ error: 'Já existe um visitante com esse número nesta igreja.' }, { status: 409 })
  }

  const visitor = await prisma.visitor.create({
    data: {
      churchId: church.id,
      name: name.trim(),
      phone: phone.trim(),
      invitedBy: invitedBy?.trim() || null,
      howFound: howFound || null,
      wantsHomeVisit: wantsHomeVisit ?? false,
    },
  })

  return NextResponse.json({ ok: true, type: 'new', name: visitor.name })
}
