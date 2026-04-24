import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import MissoesClient from './MissoesClient'

export const metadata = { title: 'Missões' }


interface Props { params: Promise<{ slug: string }> }

export default async function MembroMissoesPage({ params }: Props) {
  const { slug } = await params
  const session = await getMembroSession()
  if (!session) redirect(`/${slug}/membro/login`)

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { name: true, phone: true },
  })

  const now = new Date()
  const itemSelect = {
    select: { id: true, name: true, quantity: true, committed: true },
  }

  const [ativas, encerradas] = await Promise.all([
    prisma.mission.findMany({
      where: { churchId: session.churchId, deliveryDate: { gte: now } },
      orderBy: { deliveryDate: 'asc' },
      include: { items: itemSelect },
    }),
    prisma.mission.findMany({
      where: { churchId: session.churchId, deliveryDate: { lt: now } },
      orderBy: { deliveryDate: 'desc' },
      take: 5,
      include: { items: itemSelect },
    }),
  ])

  return (
    <MissoesClient
      ativas={ativas}
      encerradas={encerradas}
      memberName={member?.name ?? ''}
      memberPhone={member?.phone ?? ''}
    />
  )
}
