import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import ComunicadosList from './ComunicadosList'

export const metadata = { title: 'Comunicados' }


interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ id?: string }>
}

export default async function MembroComunicadosPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { id: openId } = await searchParams
  const session = await getMembroSession()
  if (!session) redirect(`/${slug}/membro/login`)

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { group: true },
  })

  const comunicados = await prisma.announcement.findMany({
    where: {
      churchId: session.churchId,
      OR: [
        { targetGroup: null },
        { targetGroup: '' },
        ...(member?.group ? [{ targetGroup: member.group }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return <ComunicadosList comunicados={comunicados} grupo={member?.group ?? null} initialOpenId={openId ?? null} />
}
