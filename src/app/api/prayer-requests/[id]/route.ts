import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH — pastor marca como orado
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gestor = await getServerSession(authOptions)
  if (!gestor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()

  if (!['PENDING', 'PRAYED'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const updated = await prisma.prayerRequest.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(updated)
}
