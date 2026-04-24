import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const member = await prisma.member.findUnique({ where: { id } })
  if (!member) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const userGet = session.user as any
  if (userGet.role !== 'MASTER' && userGet.churchId !== member.churchId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  return NextResponse.json(member)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const existing = await prisma.member.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const userDel = session.user as any
  if (userDel.role !== 'MASTER' && userDel.churchId !== existing.churchId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Remove registros dependentes antes de apagar o membro
  await prisma.attendance.deleteMany({ where: { memberId: id } })
  await prisma.scheduleItem.deleteMany({ where: { memberId: id } })
  await prisma.tithe.deleteMany({ where: { memberId: id } })
  await prisma.member.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, phone, cpfCnpj, email, group, role, isTither, suggestedTithe, birthDate, active } = body

  const existing = await prisma.member.findUnique({ where: { id }, select: { churchId: true } })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const userPut = session.user as any
  if (userPut.role !== 'MASTER' && userPut.churchId !== existing.churchId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const member = await prisma.member.update({
    where: { id },
    data: {
      name,
      phone,
      cpfCnpj: cpfCnpj || null,
      email: email || null,
      group: group || null,
      role,
      isTither,
      suggestedTithe: suggestedTithe ? parseFloat(suggestedTithe) : null,
      birthDate: birthDate ? new Date(birthDate) : null,
      active,
    },
  })

  return NextResponse.json(member)
}
