import { NextRequest, NextResponse } from 'next/server'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'
import { sendFcmToMany } from '@/lib/fcm'

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const session = await getMembroSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { cellId, title, description, date, imageUrl, notifyTarget, listMode, predefinedItems, useChurchLocation, locationCep } = await req.json()
  if (!cellId || !title || !date) {
    return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 })
  }

  // Verifica que o membro é líder desta célula
  const cell = await prisma.cell.findFirst({
    where: { id: cellId, leaderId: session.memberId, active: true },
    include: {
      members: { include: { member: { select: { id: true } } } },
      church: { select: { id: true, slug: true, name: true } },
    },
  })
  if (!cell) return NextResponse.json({ error: 'Célula não encontrada ou sem permissão' }, { status: 403 })

  const mode = ['none', 'free', 'predefined'].includes(listMode) ? listMode : 'none'

  let eventLat: number | null = null
  let eventLng: number | null = null
  if (!useChurchLocation && locationCep) {
    try {
      const digits = (locationCep as string).replace(/\D/g, '')
      const via = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const addr = await via.json()
      if (!addr.erro) {
        const address = `${addr.logradouro}, ${addr.localidade}, ${addr.uf}, Brasil`
        const nom = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=br`,
          { headers: { 'User-Agent': 'Ecclesia/1.0 (contato@ecclesiaa.com)' } }
        )
        const geo = await nom.json()
        if (geo?.[0]?.lat) { eventLat = parseFloat(geo[0].lat); eventLng = parseFloat(geo[0].lon) }
      }
    } catch {}
  }

  const event = await prisma.event.create({
    data: {
      churchId: cell.church.id,
      cellId,
      title,
      description: description || null,
      date: new Date(date),
      imageUrl: imageUrl || null,
      locationCep: locationCep || null,
      useChurchLocation: useChurchLocation !== false,
      lat: eventLat,
      lng: eventLng,
      targetGroup: notifyTarget === 'all' ? null : (notifyTarget || null),
      listMode: mode,
      ...(mode === 'predefined' && Array.isArray(predefinedItems) && predefinedItems.length > 0
        ? { items: { create: predefinedItems.filter((l: string) => l?.trim()).map((l: string) => ({ label: l.trim() })) } }
        : {}),
    },
  })

  // Envia push notification
  const memberIds = cell.members.map((m) => m.member.id)
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      churchId: cell.church.id,
      ...(notifyTarget === 'cell'
        ? { memberId: { in: memberIds } }
        : {}),
    },
  })

  const payload = JSON.stringify({
    title: `📍 ${cell.name} — ${title}`,
    body: description ? description.slice(0, 100) : 'Nova reunião agendada. Confirme sua presença.',
    url: `/eventos`,
  })

  const toDelete: string[] = []
  await Promise.all(
    subscriptions.map(async (sub) => {
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

  // FCM (app nativo Android)
  const fcmTargetIds = notifyTarget === 'cell' ? memberIds : undefined
  const fcmMembers = await prisma.member.findMany({
    where: {
      churchId: cell.church.id,
      fcmToken: { not: null },
      ...(fcmTargetIds ? { id: { in: fcmTargetIds } } : {}),
    },
    select: { fcmToken: true },
  })
  const fcmTokens = fcmMembers.map(m => m.fcmToken!)
  if (fcmTokens.length > 0) {
    const result = await sendFcmToMany(
      fcmTokens,
      `📍 ${cell.name} — ${title}`,
      description ? description.slice(0, 100) : 'Nova reunião agendada. Confirme sua presença.'
    )
    if (result.invalid.length > 0) {
      await prisma.member.updateMany({
        where: { fcmToken: { in: result.invalid } },
        data: { fcmToken: null },
      })
    }
  }

  return NextResponse.json(event, { status: 201 })
}
