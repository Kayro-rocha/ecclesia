import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasChurchAccess } from '@/lib/access'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { slug, title, date, department, items } = body

  const church = await prisma.church.findUnique({ where: { slug }, select: { id: true, parentChurchId: true } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const user = session.user as any
  if (!hasChurchAccess(user, church)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const schedule = await prisma.schedule.create({
    data: {
      churchId: church.id,
      title,
      date: new Date(date),
      department,
      items: {
        create: items.map((item: { memberId: string; role: string }) => ({
          memberId: item.memberId,
          role: item.role,
        })),
      },
    },
    include: { items: true },
  })

  return NextResponse.json(schedule)
}
