import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendText, getInstanceStatus } from '@/lib/evolution'
import { hasChurchAccess } from '@/lib/access'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { message } = await req.json()

  if (!message?.trim()) return NextResponse.json({ error: 'Mensagem obrigatória' }, { status: 400 })

  const visitor = await prisma.visitor.findUnique({
    where: { id },
    include: { church: { select: { id: true, slug: true, name: true, whatsappInstance: true, parentChurchId: true } } },
  })

  if (!visitor) return NextResponse.json({ error: 'Visitante não encontrado' }, { status: 404 })

  const user = session.user as any
  if (!hasChurchAccess(user, visitor.church)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const instance = visitor.church.whatsappInstance
  if (!instance) {
    return NextResponse.json({ error: 'WhatsApp não configurado. Conecte nas Configurações.' }, { status: 400 })
  }

  const { status } = await getInstanceStatus(instance)
  if (status !== 'open') {
    return NextResponse.json({ error: 'WhatsApp desconectado. Reconecte nas Configurações.' }, { status: 400 })
  }

  const sent = await sendText(instance, visitor.phone, message)
  if (!sent) return NextResponse.json({ error: 'Falha ao enviar mensagem. Verifique a conexão.' }, { status: 500 })

  const contact = await prisma.visitorContact.create({
    data: { visitorId: id, message, type: 'whatsapp' },
  })

  return NextResponse.json({ ok: true, contact })
}
