import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPushToMember } from '@/lib/push'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: cellId } = await params
  const { memberId } = await req.json()

  const existing = await prisma.cellMember.findUnique({
    where: { cellId_memberId: { cellId, memberId } },
  })
  if (existing) return NextResponse.json({ error: 'Membro já está na célula' }, { status: 409 })

  const [cellMember, cell] = await Promise.all([
    prisma.cellMember.create({ data: { cellId, memberId } }),
    prisma.cell.findUnique({ where: { id: cellId }, select: { name: true, church: { select: { slug: true } } } }),
  ])

  if (cell) {
    sendPushToMember(memberId, {
      title: 'Você foi adicionado a uma célula!',
      body: `Você agora faz parte da célula ${cell.name}. Acesse o app para ver os detalhes.`,
      url: `/${cell.church.slug}/membro/celula`,
    }).catch(() => {})
  }

  return NextResponse.json(cellMember, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: cellId } = await params
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId obrigatório' }, { status: 400 })

  await prisma.cellMember.deleteMany({ where: { cellId, memberId } })
  return NextResponse.json({ ok: true })
}
