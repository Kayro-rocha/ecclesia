import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function isPastor(session: any) {
  const role = session?.user?.role
  return role === 'PASTOR' || role === 'MASTER'
}

// Atualiza permissions (e opcionalmente senha) de um gestor
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !isPastor(session)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const { slug, permissions, password } = await req.json()

  if (!slug || !Array.isArray(permissions)) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const data: Record<string, unknown> = { permissions: JSON.stringify(permissions) }
  if (password) data.password = await bcrypt.hash(password, 10)

  const updated = await prisma.user.update({
    where: { id, churchId: church.id },
    data,
    select: { id: true, name: true, email: true, permissions: true },
  })

  return NextResponse.json({
    ...updated,
    permissions: JSON.parse(updated.permissions!),
  })
}

// Remove gestor
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !isPastor(session)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  await prisma.user.deleteMany({ where: { id, churchId: church.id, role: 'ADMIN' } })

  return NextResponse.json({ ok: true })
}
