import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

// POST — membro envia pedido de oração
export async function POST(req: NextRequest) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { request } = await req.json()
  if (!request || String(request).trim().length < 5) {
    return NextResponse.json({ error: 'Pedido muito curto' }, { status: 400 })
  }

  const prayer = await prisma.prayerRequest.create({
    data: {
      churchId: session.churchId,
      memberId: session.memberId,
      request: String(request).trim(),
    },
  })

  return NextResponse.json(prayer, { status: 201 })
}

// GET — pastor lista pedidos de oração da igreja
export async function GET(req: NextRequest) {
  const gestor = await getServerSession(authOptions)
  if (!gestor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const prayers = await prisma.prayerRequest.findMany({
    where: { churchId: church.id },
    orderBy: { createdAt: 'desc' },
    include: { member: { select: { name: true, group: true } } },
  })

  return NextResponse.json(prayers)
}
