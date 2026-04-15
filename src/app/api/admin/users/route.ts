import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const search = req.nextUrl.searchParams.get('search') || ''

  const users = await prisma.user.findMany({
    where: search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    } : undefined,
    select: {
      id: true, name: true, email: true, role: true, churchId: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Busca nomes das igrejas
  const churchIds = [...new Set(users.map(u => u.churchId).filter(Boolean))] as string[]
  const churches = await prisma.church.findMany({
    where: { id: { in: churchIds } },
    select: { id: true, name: true, slug: true },
  })
  const churchMap = Object.fromEntries(churches.map(c => [c.id, c]))

  const result = users.map(u => ({
    ...u,
    church: u.churchId ? churchMap[u.churchId] : null,
  }))

  return NextResponse.json(result)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id, action, newPassword } = await req.json()

  if (action === 'reset-password') {
    if (!newPassword) return NextResponse.json({ error: 'Senha obrigatória' }, { status: 400 })
    const hash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id }, data: { password: hash } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
