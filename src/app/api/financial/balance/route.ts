import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAsaasBalance, getChurchApiKey } from '@/lib/asaas'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  if (!church.asaasApiKey) {
    return NextResponse.json({ balance: null, error: 'Subconta Asaas não configurada' })
  }

  try {
    const apiKey = getChurchApiKey(church)
    const balance = await getAsaasBalance(apiKey)
    return NextResponse.json(balance)
  } catch {
    return NextResponse.json({ balance: null, error: 'Erro ao consultar saldo Asaas' })
  }
}
