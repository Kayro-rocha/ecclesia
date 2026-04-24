import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const churchId = (session.user as any).churchId as string

  const filiais = await prisma.church.findMany({
    where: { parentChurchId: churchId },
    include: {
      _count: { select: { members: true, tithes: true, events: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(filiais)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const userRole = (session.user as any).role as string
  if (userRole !== 'PASTOR' && userRole !== 'MASTER') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const churchId = (session.user as any).churchId as string
  const sede = await prisma.church.findUnique({ where: { id: churchId } })

  if (!sede || sede.plan !== 'REDE') {
    return NextResponse.json({ error: 'Plano REDE necessário' }, { status: 403 })
  }

  const filiaisCount = await prisma.church.count({ where: { parentChurchId: churchId } })
  if (filiaisCount >= 3) {
    return NextResponse.json({ error: 'Limite de 3 filiais atingido' }, { status: 400 })
  }

  const { name, slug, pastorName, pastorEmail, pastorPassword } = await req.json()

  if (!name || !slug || !pastorName || !pastorEmail || !pastorPassword) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
  }

  const existing = await prisma.church.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ error: 'Slug já em uso' }, { status: 409 })

  const existingUser = await prisma.user.findUnique({ where: { email: pastorEmail } })
  if (existingUser) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })

  const filial = await prisma.church.create({
    data: {
      name,
      slug,
      plan: 'REDE',
      primaryColor: sede.primaryColor,
      parentChurchId: churchId,
    },
  })

  const hashedPassword = await bcrypt.hash(pastorPassword, 10)
  await prisma.user.create({
    data: {
      name: pastorName,
      email: pastorEmail,
      password: hashedPassword,
      role: 'PASTOR',
      churchId: filial.id,
    },
  })

  return NextResponse.json(filial, { status: 201 })
}
