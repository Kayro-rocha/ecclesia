import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import VisitanteCheckin from './VisitanteCheckin'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function VisitantePage({ params }: Props) {
  const { slug } = await params

  const church = await prisma.church.findUnique({
    where: { slug },
    select: { name: true, logoUrl: true, primaryColor: true, secondaryColor: true },
  })

  if (!church) notFound()

  return <VisitanteCheckin slug={slug} church={church} />
}
