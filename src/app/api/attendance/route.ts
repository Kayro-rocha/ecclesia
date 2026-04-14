import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Lista cultos agrupados por data+tipo, com contagem de presentes
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const records = await prisma.attendance.findMany({
    where: { churchId: church.id },
    include: { member: { select: { name: true } } },
    orderBy: { date: 'desc' },
  })

  // Agrupa por data+tipo
  const grouped: Record<string, { date: string; type: string; count: number; memberNames: string[] }> = {}
  for (const r of records) {
    const key = `${r.date.toISOString().split('T')[0]}__${r.type}`
    if (!grouped[key]) {
      grouped[key] = { date: r.date.toISOString().split('T')[0], type: r.type, count: 0, memberNames: [] }
    }
    grouped[key].count++
    grouped[key].memberNames.push(r.member.name)
  }

  return NextResponse.json(Object.values(grouped))
}

// Registra presença de um culto (bulk)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, date, type, memberIds } = await req.json()
  if (!slug || !date || !type || !memberIds?.length) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const dateObj = new Date(date + 'T12:00:00')

  // Remove registros existentes para este culto (evita duplicatas ao editar)
  await prisma.attendance.deleteMany({
    where: { churchId: church.id, date: dateObj, type },
  })

  // Insere os novos
  await prisma.attendance.createMany({
    data: memberIds.map((memberId: string) => ({
      churchId: church.id,
      memberId,
      date: dateObj,
      type,
    })),
  })

  return NextResponse.json({ ok: true, registrados: memberIds.length })
}

// Apaga todos os registros de um culto
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, date, type } = await req.json()
  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const dateObj = new Date(date + 'T12:00:00')
  await prisma.attendance.deleteMany({ where: { churchId: church.id, date: dateObj, type } })

  return NextResponse.json({ ok: true })
}
