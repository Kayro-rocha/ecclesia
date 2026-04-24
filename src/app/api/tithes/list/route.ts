import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const now = new Date()
  const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(now.getFullYear()))

  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const [members, tithes, templates] = await Promise.all([
    prisma.member.findMany({
      where: { churchId: church.id, isTither: true, active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, suggestedTithe: true },
    }),
    prisma.tithe.findMany({
      where: { churchId: church.id, month, year },
      select: { id: true, memberId: true, amount: true, paidAt: true },
    }),
    prisma.messageTemplate.findMany({
      where: { churchId: church.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, body: true },
    }),
  ])

  const titheByMember = new Map(tithes.map((t) => [t.memberId, t]))

  const rows = members.map((m) => ({
    memberId: m.id,
    name: m.name,
    suggestedTithe: m.suggestedTithe,
    tithe: titheByMember.get(m.id) ?? null,
  }))

  return NextResponse.json({ rows, templates })
}
