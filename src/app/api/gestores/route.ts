import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function getChurch(slug: string) {
  return prisma.church.findUnique({ where: { slug } })
}

function isPastor(session: Session | null) {
  const role = (session?.user as any)?.role
  return role === 'PASTOR' || role === 'MASTER'
}

// Lista gestores (ADMINs) da igreja
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isPastor(session)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await getChurch(slug)
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const gestores = await prisma.user.findMany({
    where: { churchId: church.id, role: 'ADMIN' },
    select: { id: true, name: true, email: true, permissions: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(
    gestores.map((g) => ({
      ...g,
      permissions: g.permissions ? JSON.parse(g.permissions) : [],
    }))
  )
}

// Cria novo gestor
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !isPastor(session)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { slug, name, email, password, permissions } = await req.json()

  if (!slug || !name || !email || !password || !Array.isArray(permissions)) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const church = await getChurch(slug)
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 409 })

  const hashed = await bcrypt.hash(password, 10)
  const gestor = await prisma.user.create({
    data: {
      churchId: church.id,
      name,
      email,
      password: hashed,
      role: 'ADMIN',
      permissions: JSON.stringify(permissions),
    },
    select: { id: true, name: true, email: true, permissions: true, createdAt: true },
  })

  return NextResponse.json({
    ...gestor,
    permissions: JSON.parse(gestor.permissions!),
  }, { status: 201 })
}
