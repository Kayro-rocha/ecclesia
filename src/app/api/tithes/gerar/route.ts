import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getChurchApiKey, createOrFindAsaasCustomer, createPixCharge, getPixQrCode } from '@/lib/asaas'
import { isValidCpfCnpj } from '@/lib/cpf'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export async function POST(req: NextRequest) {
  const { slug, mes, ano } = await req.json()

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const apiKey = getChurchApiKey(church)
  if (!apiKey) return NextResponse.json({ error: 'Igreja sem chave Asaas configurada' }, { status: 400 })

  const dizimistas = await prisma.member.findMany({
    where: { churchId: church.id, isTither: true, active: true },
  })

  const existentes = await prisma.tithe.findMany({
    where: { churchId: church.id, month: mes, year: ano },
    select: { memberId: true },
  })
  const existentesIds = new Set(existentes.map(t => t.memberId))
  const pendentes = dizimistas.filter(m => !existentesIds.has(m.id))

  const erros: string[] = []
  let gerados = 0

  const dueDate = new Date(ano, mes, 0).toISOString().split('T')[0]

  for (const member of pendentes) {
    try {
      if (member.cpfCnpj && !isValidCpfCnpj(member.cpfCnpj)) {
        erros.push(`${member.name}: CPF/CNPJ inválido — corrija no cadastro do membro`)
        continue
      }

      const customerId = await createOrFindAsaasCustomer(apiKey, {
        name: member.name,
        phone: member.phone,
        cpfCnpj: member.cpfCnpj,
        email: member.email,
      })

      const charge = await createPixCharge(
        apiKey,
        customerId,
        member.suggestedTithe || 100,
        `Dízimo de ${member.name} — ${mes}/${ano}`,
        dueDate
      )

      const tithe = await prisma.tithe.create({
        data: {
          churchId: church.id,
          memberId: member.id,
          amount: member.suggestedTithe || 100,
          month: mes,
          year: ano,
          status: 'PENDING',
          asaasChargeId: charge.id,
        },
      })

      try {
        const qr = await getPixQrCode(apiKey, charge.id)
        await prisma.tithe.update({
          where: { id: tithe.id },
          data: { qrCodeBase64: qr.encodedImage },
        })
      } catch {
        // QR Code indisponível agora — pode ser buscado depois
      }

      gerados++
    } catch (err) {
      erros.push(`${member.name}: ${err instanceof Error ? err.message : 'erro'}`)
    }
  }

  // Envia push para todos os assinantes da igreja
  if (gerados > 0) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { churchId: church.id },
    })

    if (subscriptions.length > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      const pagarUrl = `${appUrl.replace('https://', `https://${slug}.`)}/dizimo/pagar?mes=${mes}&ano=${ano}`

      const pixInfo = church.pixKey
        ? `Chave PIX: ${church.pixKey}`
        : 'Fale com seu pastor para receber o PIX.'

      const payload = JSON.stringify({
        title: `💰 Dízimo de ${meses[mes - 1]} ${ano}`,
        body: `Sua cobrança foi gerada. ${pixInfo}`,
        icon: '/icon-192.png',
        url: pagarUrl,
      })

      const toDelete: string[] = []
      await Promise.all(
        subscriptions.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            )
          } catch (err: unknown) {
            const status = (err as { statusCode?: number }).statusCode
            if (status === 410 || status === 404) toDelete.push(sub.id)
          }
        })
      )

      if (toDelete.length > 0) {
        await prisma.pushSubscription.deleteMany({ where: { id: { in: toDelete } } })
      }
    }
  }

  return NextResponse.json({ gerados, erros })
}
