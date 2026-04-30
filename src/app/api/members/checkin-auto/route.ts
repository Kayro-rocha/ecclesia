import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'membro-secret-fallback')

async function resolveSession(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    try {
      const { payload } = await jwtVerify(auth.slice(7), SECRET)
      return payload as { memberId: string; churchId: string; slug: string }
    } catch {}
  }
  return getMembroSession()
}

// Haversine: distância em metros entre dois pontos GPS
function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// Chamado pelo app nativo quando membro ficou 10 min na localização
export async function POST(req: NextRequest) {
  const session = await resolveSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { lat, lng, eventId } = await req.json()
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'lat e lng obrigatórios' }, { status: 400 })
  }

  const church = await prisma.church.findUnique({
    where: { id: session.churchId },
    select: { lat: true, lng: true, checkinRadiusM: true, cultoSchedules: { where: { active: true } } },
  })

  const RADIUS_M = 300

  // ── Presença em evento específico ──────────────────────────────────────────
  if (eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { lat: true, lng: true, useChurchLocation: true },
    })
    if (!event) return NextResponse.json({ marked: false, reason: 'event_not_found' })

    // Determina qual localização verificar: do evento ou da sede
    const checkLat = (!event.useChurchLocation && event.lat) ? event.lat : church?.lat
    const checkLng = (!event.useChurchLocation && event.lng) ? event.lng : church?.lng

    if (!checkLat || !checkLng) {
      return NextResponse.json({ marked: false, reason: 'location_not_set' })
    }

    const dist = distanceM(lat, lng, checkLat, checkLng)
    if (dist > RADIUS_M) {
      return NextResponse.json({ marked: false, reason: 'too_far', distanceM: Math.round(dist) })
    }

    const attendee = await prisma.eventAttendee.findFirst({
      where: { eventId, memberId: session.memberId },
    })
    if (!attendee) return NextResponse.json({ marked: false, reason: 'not_rsvpd' })
    if (attendee.present) return NextResponse.json({ marked: false, reason: 'already_marked' })
    await prisma.eventAttendee.update({ where: { id: attendee.id }, data: { present: true } })
    return NextResponse.json({ marked: true, type: 'EVENTO' })
  }

  // ── Culto: exige localização da sede ──────────────────────────────────────
  if (!church?.lat || !church?.lng) {
    return NextResponse.json({ marked: false, reason: 'church_location_not_set' })
  }

  const dist = distanceM(lat, lng, church.lat, church.lng)
  if (dist > RADIUS_M) {
    return NextResponse.json({ marked: false, reason: 'too_far', distanceM: Math.round(dist) })
  }

  // ── Presença em culto fixo ─────────────────────────────────────────────────
  const now = new Date()
  const weekday = now.getDay() // 0=domingo
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const culto = church.cultoSchedules.find(c => {
    if (c.weekday !== weekday) return false
    const cultoMinutes = c.hour * 60 + c.minute
    // Janela: 30 min antes até 2h depois do início
    return nowMinutes >= cultoMinutes - 30 && nowMinutes <= cultoMinutes + 120
  })

  if (!culto) return NextResponse.json({ marked: false, reason: 'no_culto_now' })

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const type = `Culto de ${WEEKDAY_LABELS[culto.weekday]}`

  // Evita duplicata no mesmo dia
  const existing = await prisma.attendance.findFirst({
    where: {
      memberId: session.memberId,
      churchId: session.churchId,
      date: { gte: today },
      type,
    },
  })
  if (existing) return NextResponse.json({ marked: false, reason: 'already_marked' })

  await prisma.attendance.create({
    data: {
      churchId: session.churchId,
      memberId: session.memberId,
      date: now,
      type,
    },
  })

  return NextResponse.json({ marked: true, type })
}
