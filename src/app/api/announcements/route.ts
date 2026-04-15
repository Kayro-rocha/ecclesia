import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { slug, title, body: texto, imageUrl, enviar, targetGroup } = body

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const membersWhere = {
    churchId: church.id,
    active: true,
    ...(targetGroup ? { group: targetGroup } : {}),
  }

  const members = await prisma.member.findMany({ where: membersWhere })

  const announcement = await prisma.announcement.create({
    data: {
      churchId: church.id,
      title,
      body: texto,
      imageUrl: imageUrl || null,
      targetGroup: targetGroup || null,
      sentAt: enviar ? new Date() : null,
      recipientCount: enviar ? members.length : 0,
    },
  })

  if (enviar) {
    // Push notification para todos os assinantes da igreja
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { churchId: church.id },
    })

    const payload = JSON.stringify({
      title,
      body: texto.length > 100 ? texto.slice(0, 97) + '...' : texto,
      icon: '/icon-192.png',
      url: `/${slug}/comunicados`,
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

    // WhatsApp via Evolution API (mantido para igrejas que usam)
    if (church.whatsappInstance && process.env.EVOLUTION_API_URL) {
      const groupSuffix = targetGroup ? `\n\n_Para: ${targetGroup}_` : ''
      for (const member of members) {
        try {
          await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${church.whatsappInstance}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.EVOLUTION_API_KEY!,
            },
            body: JSON.stringify({
              number: member.phone,
              text: `*${title}*\n\n${texto}${groupSuffix}`,
            }),
          })
        } catch (err) {
          console.error(`Erro ao enviar WhatsApp para ${member.name}:`, err)
        }
      }
    }
  }

  return NextResponse.json(announcement)
}
