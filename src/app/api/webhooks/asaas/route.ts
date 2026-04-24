import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import {
  sendOnboardingEmail,
  sendInvoiceCreatedEmail,
  sendPaymentOverdueEmail,
  sendPaymentDeclinedEmail,
} from '@/lib/email'
import { randomUUID } from 'crypto'

const PLAN_LINKS: Record<string, 'IGREJA' | 'REDE'> = {
  [process.env.ASAAS_PLAN_IGREJA_LINK || '0orcbmyyc1mv68aa']: 'IGREJA',
  [process.env.ASAAS_PLAN_REDE_LINK   || '0l3ufctgqsnojrbu']: 'REDE',
}

const DECLINED_EVENTS = new Set([
  'PAYMENT_DECLINED',
  'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
  'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
])

async function fetchAsaasCustomer(customerId: string) {
  const res = await fetch(
    `${process.env.ASAAS_API_URL}/customers/${customerId}`,
    { headers: { 'access_token': process.env.ASAAS_API_KEY || '' } }
  )
  if (!res.ok) return null
  return res.json() as Promise<{ email: string; name: string }>
}

async function findChurchByCustomer(customerId: string) {
  const customer = await fetchAsaasCustomer(customerId)
  if (!customer?.email) return null
  const user = await prisma.user.findFirst({ where: { email: customer.email } })
  if (!user?.churchId) return null
  const church = await prisma.church.findUnique({ where: { id: user.churchId } })
  return { email: customer.email, church }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('asaas-access-token') ?? ''
  const expected = process.env.ASAAS_WEBHOOK_TOKEN ?? ''
  if (expected) {
    const a = Buffer.from(token.padEnd(expected.length))
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const body = await req.json()
  const { event, payment } = body

  if (!payment?.id) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  // ── Pagamento de plano confirmado ──────────────────────────────────────────
  if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
    const paymentLinkId = payment.paymentLink as string | undefined
    if (paymentLinkId && PLAN_LINKS[paymentLinkId]) {
      const plan = PLAN_LINKS[paymentLinkId]
      const customer = await fetchAsaasCustomer(payment.customer)
      if (!customer?.email) return NextResponse.json({ received: true })

      // Igreja já cadastrada → renovação mensal: confirma ativo e atualiza plano
      const user = await prisma.user.findFirst({ where: { email: customer.email } })
      if (user?.churchId) {
        await prisma.church.update({
          where: { id: user.churchId },
          data: { active: true, plan },
        })
        return NextResponse.json({ received: true })
      }

      // Novo cliente → cria token de onboarding (48h para cadastrar)
      const existingToken = await prisma.onboardingToken.findFirst({
        where: { email: customer.email, usedAt: null, expiresAt: { gt: new Date() } },
      })
      if (existingToken) return NextResponse.json({ received: true })

      const tokenValue = randomUUID()
      await prisma.onboardingToken.create({
        data: { email: customer.email, token: tokenValue, plan, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) },
      })
      await sendOnboardingEmail(customer.email, tokenValue, plan)
    }
  }

  // ── Nova fatura de assinatura criada ───────────────────────────────────────
  if (event === 'PAYMENT_CREATED' && payment.subscription && !payment.paymentLink) {
    const result = await findChurchByCustomer(payment.customer)
    if (result?.church) {
      sendInvoiceCreatedEmail(result.email, result.church.name, payment.value, payment.dueDate)
        .catch(err => console.error('[email] invoice_created:', err))
    }
  }

  // ── Fatura vencida → suspende a conta ─────────────────────────────────────
  if (event === 'PAYMENT_OVERDUE') {
    const result = await findChurchByCustomer(payment.customer)
    if (result?.church) {
      // Suspende somente se for cobrança de assinatura de plano
      if (payment.subscription) {
        await prisma.church.update({
          where: { id: result.church.id },
          data: { active: false },
        })
      }
      sendPaymentOverdueEmail(result.email, result.church.name, payment.value, payment.invoiceUrl)
        .catch(err => console.error('[email] overdue:', err))
    }
  }

  // ── Pagamento recusado ─────────────────────────────────────────────────────
  if (DECLINED_EVENTS.has(event)) {
    const result = await findChurchByCustomer(payment.customer)
    if (result?.church) {
      sendPaymentDeclinedEmail(result.email, result.church.name, payment.invoiceUrl)
        .catch(err => console.error('[email] declined:', err))
    }
  }

  // ── Assinatura cancelada definitivamente → libera o slug ───────────────────
  if (event === 'SUBSCRIPTION_DELETED') {
    const result = await findChurchByCustomer(payment.customer)
    if (result?.church && !result.church.slug.startsWith('_cancelado-')) {
      const cancelledSlug = `_cancelado-${Date.now()}-${result.church.slug}`
      await prisma.church.update({
        where: { id: result.church.id },
        data: { active: false, slug: cancelledSlug },
      })
    }
  }

  return NextResponse.json({ received: true })
}
