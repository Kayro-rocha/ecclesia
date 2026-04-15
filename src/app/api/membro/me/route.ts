import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMembroSession } from '@/lib/membro-auth'

export async function GET() {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: {
      id: true, name: true, phone: true, email: true,
      group: true, role: true, cpfCnpj: true,
      church: { select: { name: true, slug: true, primaryColor: true } },
    },
  })

  if (!member) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
  return NextResponse.json({ ...member, slug: session.slug })
}

export async function PATCH(req: NextRequest) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const name: string | undefined = typeof body.name === 'string' ? body.name.trim() : undefined
  const phone: string | undefined = typeof body.phone === 'string' ? body.phone.trim() : undefined

  if (!name || !phone) {
    return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 })
  }

  const updated = await prisma.member.update({
    where: { id: session.memberId },
    data: { name, phone },
    select: { id: true, name: true, phone: true, cpfCnpj: true, group: true, role: true },
  })

  return NextResponse.json(updated)
}
