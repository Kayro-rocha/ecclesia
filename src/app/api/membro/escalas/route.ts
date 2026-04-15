import { NextResponse } from 'next/server'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const items = await prisma.scheduleItem.findMany({
    where: { memberId: session.memberId },
    include: {
      schedule: {
        select: { id: true, title: true, date: true, department: true },
      },
    },
    orderBy: { schedule: { date: 'asc' } },
  })

  return NextResponse.json(items)
}
