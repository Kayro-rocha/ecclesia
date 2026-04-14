import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registerAsaasWebhook } from '@/lib/asaas'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug } = await req.json()
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })
  if (!church.asaasApiKey) return NextResponse.json({ error: 'Igreja sem API Key do Asaas' }, { status: 400 })

  const webhookUrl = `https://${process.env.NEXT_PUBLIC_APP_DOMAIN}/api/webhooks/asaas`
  const result = await registerAsaasWebhook(
    church.asaasApiKey,
    webhookUrl,
    process.env.ASAAS_WEBHOOK_TOKEN || undefined
  )

  return NextResponse.json({ ok: true, result })
}
