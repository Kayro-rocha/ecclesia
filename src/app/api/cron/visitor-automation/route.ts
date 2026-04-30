import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendText } from '@/lib/evolution'

const MAX_PER_RUN = 5 // máx por igreja por rodada (anti-ban Evolution API)

function getBrazilTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
}

function replaceVars(template: string, name: string): string {
  return template.replace(/\[nome\]/gi, name)
}

// Delay aleatório entre 4s e 8s para parecer comportamento humano
function randomDelay(): Promise<void> {
  const ms = 4000 + Math.floor(Math.random() * 4000)
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendWithDelay(
  slug: string,
  visitorId: string,
  phone: string,
  msg: string,
  isFirst: boolean,
): Promise<boolean> {
  if (!isFirst) await randomDelay()
  try {
    await sendText(slug, phone, msg)
    await prisma.visitorContact.create({
      data: { visitorId, message: msg, type: 'whatsapp', direction: 'SENT' },
    })
    return true
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = getBrazilTime()
  const weekday = now.getDay()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const OFFSET = 150    // 2h30 em minutos
  const TOLERANCE = 15  // ±15 min de tolerância (cron a cada 3 min não perde a janela)
  const windowMin = nowMinutes - OFFSET - TOLERANCE
  const windowMax = nowMinutes - OFFSET + TOLERANCE

  let postCultoSent = 0
  let followUpSent = 0

  // ──────────────────────────────────────────────
  // JOB 1: Boas-vindas 2h30 após o culto
  // ──────────────────────────────────────────────
  const cultos = await prisma.cultoSchedule.findMany({
    where: { weekday, active: true },
    include: { church: { select: { id: true, slug: true } } },
  })

  for (const culto of cultos) {
    const cultoMinutes = culto.hour * 60 + culto.minute
    if (cultoMinutes < windowMin || cultoMinutes > windowMax) continue

    const automation = await prisma.visitorAutomation.findUnique({
      where: { churchId: culto.church.id },
      select: { enabled: true, message: true },
    })
    if (!automation?.enabled || !automation.message) continue

    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    // Pega só os próximos MAX_PER_RUN pendentes (sem mensagem enviada hoje)
    const visitors = await prisma.visitor.findMany({
      where: {
        churchId: culto.church.id,
        lastVisit: { gte: todayStart, lte: todayEnd },
        flowActive: true,
        contacts: { none: { direction: 'SENT', sentAt: { gte: todayStart } } },
      },
      select: { id: true, name: true, phone: true },
      take: MAX_PER_RUN,
      orderBy: { lastVisit: 'asc' },
    })

    for (let i = 0; i < visitors.length; i++) {
      const v = visitors[i]
      const msg = replaceVars(automation.message, v.name)
      const ok = await sendWithDelay(culto.church.slug, v.id, v.phone, msg, i === 0)
      if (ok) postCultoSent++
    }
  }

  // ──────────────────────────────────────────────
  // JOB 2: Follow-up N dias sem contato
  // ──────────────────────────────────────────────
  const automations = await prisma.visitorAutomation.findMany({
    where: { enabled: true },
    select: { churchId: true, triggerDays: true, followUpMessage: true, church: { select: { slug: true } } },
  })

  for (const automation of automations) {
    if (!automation.followUpMessage) continue

    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - automation.triggerDays)

    // Pega só os próximos MAX_PER_RUN que nunca receberam mensagem
    const visitors = await prisma.visitor.findMany({
      where: {
        churchId: automation.churchId,
        createdAt: { lte: cutoff },
        flowActive: true,
        contacts: { none: { direction: 'SENT' } },
      },
      select: { id: true, name: true, phone: true },
      take: MAX_PER_RUN,
      orderBy: { createdAt: 'asc' },
    })

    for (let i = 0; i < visitors.length; i++) {
      const v = visitors[i]
      const msg = replaceVars(automation.followUpMessage!, v.name)
      const ok = await sendWithDelay(automation.church.slug, v.id, v.phone, msg, i === 0)
      if (ok) followUpSent++
    }
  }

  // ──────────────────────────────────────────────
  // JOB 3: Auto-inativar visitantes sem retorno há 30+ dias
  // ──────────────────────────────────────────────
  const cutoffInactive = new Date(now)
  cutoffInactive.setDate(cutoffInactive.getDate() - 30)

  const { count: inativados } = await prisma.visitor.updateMany({
    where: {
      status: { in: ['NEW', 'RETURNED'] },
      lastVisit: { lte: cutoffInactive },
    },
    data: { status: 'INACTIVE', flowActive: false },
  })

  return NextResponse.json({ ok: true, postCultoSent, followUpSent, inativados, timestamp: now.toISOString() })
}
