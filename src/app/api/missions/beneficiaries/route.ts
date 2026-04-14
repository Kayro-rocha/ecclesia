import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { slug, name, phone, familySize, need, observations } = body

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const beneficiary = await prisma.beneficiary.create({
    data: {
      churchId: church.id,
      name,
      phone,
      familySize: parseInt(familySize) || 1,
      need: need || null,
      observations: observations || null,
    },
  })

  return NextResponse.json(beneficiary)
}
