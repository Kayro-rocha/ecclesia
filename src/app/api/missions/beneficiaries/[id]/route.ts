import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const beneficiary = await prisma.beneficiary.findUnique({ where: { id } })
  if (!beneficiary) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json(beneficiary)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, phone, familySize, need, observations, active } = body

  const beneficiary = await prisma.beneficiary.update({
    where: { id },
    data: {
      name,
      phone,
      familySize: parseInt(familySize) || 1,
      need: need || null,
      observations: observations || null,
      active,
    },
  })

  return NextResponse.json(beneficiary)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.beneficiary.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
