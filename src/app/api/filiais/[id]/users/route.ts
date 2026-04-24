import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function getSedeChurch(session: any) {
  const churchId = (session.user as any).churchId as string
  return prisma.church.findUnique({ where: { id: churchId } })
}

async function verifyFilialAccess(sedeId: string, filialId: string) {
  const filial = await prisma.church.findUnique({ where: { id: filialId } })
  return filial?.parentChurchId === sedeId ? filial : null
}

// GET /api/filiais/[id]/users — lista usuários da filial
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: filialId } = await params
  const sede = await getSedeChurch(session)
  if (!sede || sede.plan !== 'REDE') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const filial = await verifyFilialAccess(sede.id, filialId)
  if (!filial) return NextResponse.json({ error: 'Filial não encontrada' }, { status: 404 })

  const users = await prisma.user.findMany({
    where: { churchId: filialId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(users)
}

// POST /api/filiais/[id]/users — cria novo admin para a filial
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: filialId } = await params
  const sede = await getSedeChurch(session)
  if (!sede || sede.plan !== 'REDE') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const filial = await verifyFilialAccess(sede.id, filialId)
  if (!filial) return NextResponse.json({ error: 'Filial não encontrada' }, { status: 404 })

  const { name, email, password } = await req.json()
  if (!name || !email || !password) return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: 'PASTOR', churchId: filialId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return NextResponse.json(user, { status: 201 })
}

// DELETE /api/filiais/[id]/users?userId=xxx — remove admin da filial
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: filialId } = await params
  const sede = await getSedeChurch(session)
  if (!sede || sede.plan !== 'REDE') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const filial = await verifyFilialAccess(sede.id, filialId)
  if (!filial) return NextResponse.json({ error: 'Filial não encontrada' }, { status: 404 })

  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target || target.churchId !== filialId) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  await prisma.user.delete({ where: { id: userId } })
  return NextResponse.json({ ok: true })
}

// PATCH /api/filiais/[id]/users?userId=xxx — reseta senha do admin da filial
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: filialId } = await params
  const sede = await getSedeChurch(session)
  if (!sede || sede.plan !== 'REDE') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const filial = await verifyFilialAccess(sede.id, filialId)
  if (!filial) return NextResponse.json({ error: 'Filial não encontrada' }, { status: 404 })

  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const { password } = await req.json()
  if (!password || password.length < 6) return NextResponse.json({ error: 'Senha muito curta' }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target || target.churchId !== filialId) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
  return NextResponse.json({ ok: true })
}
