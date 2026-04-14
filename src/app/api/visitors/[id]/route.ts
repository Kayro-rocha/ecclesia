import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const visitor = await prisma.visitor.findUnique({
    where: { id },
    include: { contacts: { orderBy: { sentAt: 'desc' } } },
  })

  if (!visitor) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json(visitor)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.visitor.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const { name, phone, invitedBy, howFound, wantsHomeVisit, status, registerVisit } = body

  const visitor = await prisma.visitor.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(invitedBy !== undefined && { invitedBy: invitedBy || null }),
      ...(howFound !== undefined && { howFound: howFound || null }),
      ...(wantsHomeVisit !== undefined && { wantsHomeVisit }),
      ...(status !== undefined && { status }),
      ...(registerVisit && {
        visits: { increment: 1 },
        lastVisit: new Date(),
        status: existing.status === 'NEW' ? 'RETURNED' : existing.status,
      }),
    },
  })

  return NextResponse.json(visitor)
}
