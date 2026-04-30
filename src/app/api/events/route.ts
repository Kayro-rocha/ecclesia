import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'
import { sendFcmToMany } from '@/lib/fcm'

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const events = await prisma.event.findMany({
    where: { churchId: church.id },
    include: { _count: { select: { attendees: true } } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(events)
}

async function geocodeCep(cep: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const digits = cep.replace(/\D/g, '')
    const via = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    const addr = await via.json()
    if (addr.erro) return null
    const address = `${addr.logradouro}, ${addr.localidade}, ${addr.uf}, Brasil`
    const nom = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=br`,
      { headers: { 'User-Agent': 'Ecclesia/1.0 (contato@ecclesiaa.com)' } }
    )
    const geo = await nom.json()
    if (geo?.[0]?.lat) return { lat: parseFloat(geo[0].lat), lng: parseFloat(geo[0].lon) }
  } catch {}
  return null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, title, description, date, location, locationCep, useChurchLocation, targetGroup, imageUrl, cellId, listMode, predefinedItems } = await req.json()
  if (!slug || !title || !date) {
    return NextResponse.json({ error: 'Título e data são obrigatórios' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  // Geocodifica CEP do evento quando não é na sede
  let eventLat: number | null = null
  let eventLng: number | null = null
  if (!useChurchLocation && locationCep) {
    const coords = await geocodeCep(locationCep)
    if (coords) { eventLat = coords.lat; eventLng = coords.lng }
  }

  const mode = ['none', 'free', 'predefined'].includes(listMode) ? listMode : 'none'

  const event = await prisma.event.create({
    data: {
      churchId: church.id,
      title,
      description: description || null,
      date: new Date(date),
      location: location || null,
      locationCep: locationCep || null,
      useChurchLocation: useChurchLocation !== false,
      lat: eventLat,
      lng: eventLng,
      targetGroup: targetGroup || null,
      imageUrl: imageUrl || null,
      cellId: cellId || null,
      listMode: mode,
      ...(mode === 'predefined' && Array.isArray(predefinedItems) && predefinedItems.length > 0
        ? { items: { create: predefinedItems.filter((l: string) => l?.trim()).map((l: string) => ({ label: l.trim() })) } }
        : {}),
    },
  })

  // Push notification
  const subsWhere: { churchId: string; memberId?: { in: string[] } } = {
    churchId: church.id,
  }
  if (cellId) {
    const cell = await prisma.cell.findUnique({
      where: { id: cellId },
      include: { members: { select: { memberId: true } } },
    })
    if (cell) subsWhere.memberId = { in: cell.members.map(m => m.memberId) }
  } else if (targetGroup) {
    const members = await prisma.member.findMany({
      where: { churchId: church.id, group: targetGroup, active: true },
      select: { id: true },
    })
    subsWhere.memberId = { in: members.map(m => m.id) }
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where: subsWhere })

  const eventDate = new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  const payload = JSON.stringify({
    title: `📅 ${title}`,
    body: description ? description.slice(0, 100) : `Novo evento em ${eventDate}`,
    icon: '/icon-192.png',
    url: `/${slug}/membro/eventos`,
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
  const fcmWhere: { churchId: string; fcmToken: { not: null }; id?: { in: string[] } } = {
    churchId: church.id,
    fcmToken: { not: null },
  }
  if (subsWhere.memberId) fcmWhere.id = subsWhere.memberId
  const fcmMembers = await prisma.member.findMany({ where: fcmWhere, select: { fcmToken: true } })
  const fcmTokens = fcmMembers.map(m => m.fcmToken!)
  if (fcmTokens.length > 0) {
    const result = await sendFcmToMany(fcmTokens, `📅 ${title}`, payload ? JSON.parse(payload).body : title)
    if (result.invalid.length > 0) {
      await prisma.member.updateMany({
        where: { fcmToken: { in: result.invalid } },
        data: { fcmToken: null },
      })
    }
  }

  return NextResponse.json(event, { status: 201 })
}
