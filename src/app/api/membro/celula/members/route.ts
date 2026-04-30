import { NextRequest, NextResponse } from 'next/server'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import { sendPushToMember } from '@/lib/push'

async function getLeaderCell(memberId: string) {
  return prisma.cell.findFirst({
    where: { leaderId: memberId, active: true },
    select: { id: true, churchId: true },
  })
}

// Lista membros da igreja disponíveis para adicionar na célula
export async function GET() {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cell = await getLeaderCell(session.memberId)
  if (!cell) return NextResponse.json({ error: 'Você não é líder de nenhuma célula' }, { status: 403 })

  const [allMembers, cellMembers] = await Promise.all([
    prisma.member.findMany({
      where: { churchId: cell.churchId, active: true },
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    }),
    prisma.cellMember.findMany({
      where: { cellId: cell.id },
      select: { memberId: true },
    }),
  ])

  const inCell = new Set(cellMembers.map(c => c.memberId))
  const available = allMembers.filter(m => !inCell.has(m.id) && m.id !== session.memberId)

  return NextResponse.json({ available, cellId: cell.id })
}

// Adiciona membro à célula
export async function POST(req: NextRequest) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cell = await getLeaderCell(session.memberId)
  if (!cell) return NextResponse.json({ error: 'Você não é líder de nenhuma célula' }, { status: 403 })

  const { memberId } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'memberId obrigatório' }, { status: 400 })

  const existing = await prisma.cellMember.findUnique({
    where: { cellId_memberId: { cellId: cell.id, memberId } },
  })
  if (existing) return NextResponse.json({ error: 'Membro já está na célula' }, { status: 409 })

  const [, cellData] = await Promise.all([
    prisma.cellMember.create({ data: { cellId: cell.id, memberId } }),
    prisma.cell.findUnique({ where: { id: cell.id }, select: { name: true, church: { select: { slug: true } } } }),
  ])

  if (cellData) {
    sendPushToMember(memberId, {
      title: 'Você foi adicionado a uma célula!',
      body: `Você agora faz parte da célula ${cellData.name}. Acesse o app para ver os detalhes.`,
      url: `/${cellData.church.slug}/membro/celula`,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}

// Remove membro da célula
export async function DELETE(req: NextRequest) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cell = await getLeaderCell(session.memberId)
  if (!cell) return NextResponse.json({ error: 'Você não é líder de nenhuma célula' }, { status: 403 })

  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId obrigatório' }, { status: 400 })

  await prisma.cellMember.deleteMany({ where: { cellId: cell.id, memberId } })
  return NextResponse.json({ ok: true })
}
