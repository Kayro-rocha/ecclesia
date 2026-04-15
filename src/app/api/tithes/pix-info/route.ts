import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Endpoint público — retorna chave PIX e info da igreja para o membro pagar
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({
    where: { slug },
    select: { name: true, pixKey: true },
  })

  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })
  if (!church.pixKey) return NextResponse.json({ error: 'Chave PIX não configurada' }, { status: 404 })

  return NextResponse.json({ name: church.name, pixKey: church.pixKey })
}
