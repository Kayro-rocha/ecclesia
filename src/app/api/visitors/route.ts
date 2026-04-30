import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasChurchAccess } from '@/lib/access'
import { sendText, getInstanceStatus } from '@/lib/evolution'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const status = searchParams.get('status')
  const busca = searchParams.get('busca')

  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({ where: { slug }, select: { id: true, parentChurchId: true } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const user = session.user as any
  if (!hasChurchAccess(user, church)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const visitors = await prisma.visitor.findMany({
    where: {
      churchId: church.id,
      ...(status && status !== 'todos' ? { status: status as any } : {}),
      ...(busca ? { name: { contains: busca } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(visitors)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { slug, name, phone, invitedBy, howFound, wantsHomeVisit } = body

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const user = session.user as any
  if (!hasChurchAccess(user, church)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const visitor = await prisma.visitor.create({
    data: {
      churchId: church.id,
      name,
      phone,
      invitedBy: invitedBy || null,
      howFound: howFound || null,
      wantsHomeVisit,
    },
  })

  // Disparo de boas-vindas: fire-and-forget após 3 minutos
  const churchId = church.id
  const churchSlug = church.slug
  const churchInstance = church.whatsappInstance
  const visitorId = visitor.id
  const visitorName = visitor.name
  const visitorPhone = visitor.phone

  setTimeout(async () => {
    try {
      if (!churchInstance) return
      const automation = await prisma.visitorAutomation.findUnique({
        where: { churchId },
        select: { enabled: true, message: true },
      })
      if (!automation?.enabled || !automation.message) return

      const { status } = await getInstanceStatus(churchInstance)
      if (status !== 'open') return

      const msg = automation.message.replace(/\[nome\]/gi, visitorName)
      const ok = await sendText(churchSlug, visitorPhone, msg)
      if (ok) {
        await prisma.visitorContact.create({
          data: { visitorId, message: msg, type: 'auto_whatsapp', direction: 'SENT' },
        })
      }
    } catch {}
  }, 3 * 60 * 1000)

  return NextResponse.json(visitor)
}
