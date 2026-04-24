import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteUpload } from '@/lib/delete-upload'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const announcement = await prisma.announcement.findUnique({ where: { id } })
  if (!announcement) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json(announcement)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.announcement.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  if (existing.sentAt) return NextResponse.json({ error: 'Comunicado já enviado não pode ser editado' }, { status: 400 })

  const { title, body } = await req.json()

  const announcement = await prisma.announcement.update({
    where: { id },
    data: { title, body },
  })

  return NextResponse.json(announcement)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.announcement.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.announcement.delete({ where: { id } })
  await deleteUpload(existing.imageUrl ?? null)
  return NextResponse.json({ ok: true })
}
