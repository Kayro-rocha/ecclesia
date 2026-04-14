import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  // Valida o token de autenticação do Asaas
  const token = req.headers.get('asaas-access-token')
  if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { event, payment } = body

  if (!payment?.id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Confirma pagamento do dízimo
  if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
    const tithe = await prisma.tithe.findFirst({
      where: { asaasChargeId: payment.id },
    })

    if (tithe) {
      await prisma.tithe.update({
        where: { id: tithe.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      })
    }
  }

  return NextResponse.json({ received: true })
}
