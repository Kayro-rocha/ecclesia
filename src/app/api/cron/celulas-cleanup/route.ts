import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 15)

  // Células inativas: criadas há mais de 15 dias e sem nenhuma reunião nos últimos 15 dias
  const { count } = await prisma.cell.updateMany({
    where: {
      active: true,
      createdAt: { lt: cutoff },
      events: { none: { date: { gte: cutoff } } },
    },
    data: { active: false },
  })

  return NextResponse.json({ ok: true, desativadas: count, cutoff: cutoff.toISOString() })
}
