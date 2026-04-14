import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requestAsaasWithdrawal, getChurchApiKey } from '@/lib/asaas'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { slug, amount, pixKey, pixKeyType, description } = body

  if (!slug || !amount || !pixKey || !pixKeyType) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })
  if (!church.asaasApiKey) return NextResponse.json({ error: 'Subconta Asaas não configurada' }, { status: 400 })

  const apiKey = getChurchApiKey(church)
  const result = await requestAsaasWithdrawal(apiKey, parseFloat(amount), pixKey, pixKeyType, description)

  return NextResponse.json(result)
}
