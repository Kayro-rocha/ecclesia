import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getMembroSession, MEMBRO_COOKIE } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

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

// Retorna tudo que o app nativo precisa para decidir quando/onde monitorar
export async function GET(req: NextRequest) {
  const session = await resolveSession(req)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const church = await prisma.church.findUnique({
    where: { id: session.churchId },
    select: {
      id: true, slug: true, name: true,
      lat: true, lng: true, checkinRadiusM: true,
      cultoSchedules: {
        where: { active: true },
        select: { id: true, weekday: true, hour: true, minute: true },
      },
    },
  })

  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  // Eventos futuros que o membro confirmou presença
  const upcomingEvents = await prisma.eventAttendee.findMany({
    where: {
      memberId: session.memberId,
      confirmed: true,
      present: false,
      event: {
        churchId: session.churchId,
        date: { gte: new Date() },
      },
    },
    include: {
      event: { select: { id: true, title: true, date: true, location: true } },
    },
    orderBy: { event: { date: 'asc' } },
    take: 10,
  })

  return NextResponse.json({
    church: {
      lat: church.lat,
      lng: church.lng,
      radiusM: church.checkinRadiusM,
    },
    cultoSchedules: church.cultoSchedules,
    upcomingEvents: upcomingEvents.map(a => ({
      eventId: a.event.id,
      title: a.event.title,
      date: a.event.date,
      location: a.event.location,
    })),
  })
}
