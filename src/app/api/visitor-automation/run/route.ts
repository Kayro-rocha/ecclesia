import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendText, getInstanceStatus } from '@/lib/evolution'

// Chamado por cron diário — protegido pelo CLEANUP_SECRET
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CLEANUP_SECRET || auth !== `Bearer ${process.env.CLEANUP_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const automations = await prisma.visitorAutomation.findMany({
    where: { enabled: true },
    include: { church: { select: { id: true, slug: true, whatsappInstance: true } } },
  })

  const results: { churchSlug: string; sent: number; errors: string[] }[] = []

  for (const auto of automations) {
    const { church, triggerDays, message } = auto
    if (!church.whatsappInstance || !message) continue

    const { status } = await getInstanceStatus(church.whatsappInstance)
    if (status !== 'open') continue

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - triggerDays)

    // Visitantes cadastrados há X dias e sem nenhum contato ainda
    const visitors = await prisma.visitor.findMany({
      where: {
        churchId: church.id,
        status: { in: ['NEW', 'RETURNED'] },
        createdAt: { lte: cutoff },
        contacts: { none: {} },
      },
      select: { id: true, name: true, phone: true },
    })

    let sent = 0
    const errors: string[] = []

    for (const v of visitors) {
      const personalizedMsg = message.replace(/\[nome\]/gi, v.name)
      const ok = await sendText(church.whatsappInstance, v.phone, personalizedMsg)

      if (ok) {
        await prisma.visitorContact.create({
          data: { visitorId: v.id, message: personalizedMsg, type: 'auto_whatsapp' },
        })
        sent++
      } else {
        errors.push(`${v.name}: falha no envio`)
      }

      // 20s de delay entre cada mensagem
      await new Promise(r => setTimeout(r, 20_000))
    }

    await prisma.visitorAutomation.update({
      where: { id: auto.id },
      data: { lastRunAt: new Date() },
    })

    results.push({ churchSlug: church.slug, sent, errors })
  }

  return NextResponse.json({ ok: true, results })
}
