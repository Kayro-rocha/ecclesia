import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { slug, title, body: texto, imageUrl, enviar } = body

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const members = await prisma.member.findMany({
    where: { churchId: church.id, active: true },
  })

  const announcement = await prisma.announcement.create({
    data: {
      churchId: church.id,
      title,
      body: texto,
      imageUrl: imageUrl || null,
      sentAt: enviar ? new Date() : null,
      recipientCount: enviar ? members.length : 0,
    },
  })

  if (enviar && church.whatsappInstance) {
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
            text: `*${title}*\n\n${texto}`,
          }),
        })
      } catch (err) {
        console.error(`Erro ao enviar para ${member.name}:`, err)
      }
    }
  }

  return NextResponse.json(announcement)
}
