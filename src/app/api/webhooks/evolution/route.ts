import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendText } from '@/lib/evolution'

function normalizePhone(jid: string) {
  // "5511999999999@s.whatsapp.net" → "11999999999"
  return jid.replace('@s.whatsapp.net', '').replace(/^55/, '')
}

function extractText(message: Record<string, unknown>): string {
  return (
    (message?.conversation as string) ||
    ((message?.extendedTextMessage as Record<string, unknown>)?.text as string) ||
    ''
  )
}

function bumpTemperature(current: string): string {
  if (current === 'COLD') return 'WARM'
  if (current === 'WARM') return 'HOT'
  return 'HOT'
}

export async function POST(req: NextRequest) {
  // A Evolution API envia o header "apikey" com a chave global configurada
  const incomingKey = req.headers.get('apikey')
  if (!incomingKey || incomingKey !== process.env.EVOLUTION_API_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: true })

  const { event, instance, data } = body

  // Só processa mensagens recebidas (não enviadas pelo próprio número)
  if (event !== 'messages.upsert') return NextResponse.json({ ok: true })
  if (!data?.key || data.key.fromMe) return NextResponse.json({ ok: true })

  const remoteJid: string = data.key.remoteJid ?? ''
  if (!remoteJid.includes('@s.whatsapp.net')) return NextResponse.json({ ok: true })

  const phone = normalizePhone(remoteJid)
  const text = extractText(data.message ?? {})
  if (!text) return NextResponse.json({ ok: true })

  // Encontra a igreja pela instância (= slug)
  const church = await prisma.church.findUnique({
    where: { slug: instance },
    select: { id: true, slug: true },
  })
  if (!church) return NextResponse.json({ ok: true })

  // Encontra visitante pelo telefone
  const digits = phone.replace(/\D/g, '')
  const visitors = await prisma.visitor.findMany({
    where: { churchId: church.id },
    select: { id: true, phone: true, temperature: true, flowStage: true, lastContactAt: true },
  })
  const visitor = visitors.find(v => v.phone.replace(/\D/g, '').replace(/^55/, '') === digits)
  if (!visitor) return NextResponse.json({ ok: true })

  // AutoReply só dispara se for o primeiro contato OU se houve silêncio > 4h
  // Evita resposta automática durante conversa ativa com a equipe
  const SILENCE_THRESHOLD_MS = 4 * 60 * 60 * 1000
  const shouldAutoReply =
    visitor.lastContactAt === null ||
    Date.now() - new Date(visitor.lastContactAt).getTime() > SILENCE_THRESHOLD_MS

  // Salva mensagem recebida
  await prisma.visitorContact.create({
    data: {
      visitorId: visitor.id,
      message: text,
      type: 'whatsapp',
      direction: 'RECEIVED',
    },
  })

  // Atualiza visitante: sobe temperatura, marca resposta não lida
  await prisma.visitor.update({
    where: { id: visitor.id },
    data: {
      temperature: bumpTemperature(visitor.temperature) as any,
      hasUnreadReply: true,
      lastContactAt: new Date(),
    },
  })

  if (shouldAutoReply) {
    const automation = await prisma.visitorAutomation.findUnique({
      where: { churchId: church.id },
      select: { autoReply: true, enabled: true },
    })

    if (automation?.enabled && automation.autoReply) {
      const autoReplyMsg = automation.autoReply
      const visitorId = visitor.id
      const churchSlug = church.slug

      // Aguarda 1 minuto antes de enviar — cancela se a equipe já respondeu nesse intervalo
      setTimeout(async () => {
        const recentSent = await prisma.visitorContact.findFirst({
          where: {
            visitorId,
            direction: 'SENT',
            sentAt: { gte: new Date(Date.now() - 70 * 1000) },
          },
        })
        if (recentSent) return

        await sendText(churchSlug, phone, autoReplyMsg)
        await prisma.visitorContact.create({
          data: {
            visitorId,
            message: autoReplyMsg,
            type: 'auto_whatsapp',
            direction: 'SENT',
          },
        })
      }, 60 * 1000)
    }
  }

  return NextResponse.json({ ok: true })
}
