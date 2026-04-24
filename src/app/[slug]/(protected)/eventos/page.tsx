import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import EventosListGestor from './EventosListGestor'

export const metadata = { title: 'Eventos' }


interface Props { params: Promise<{ slug: string }> }

export default async function EventosPage({ params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const eventos = await prisma.event.findMany({
    where: { churchId: church.id },
    include: { _count: { select: { attendees: true } } },
    orderBy: { date: 'desc' },
  })

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'marketcontroll.com'

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>Eventos</h1>
        <Link href={`/${slug}/eventos/novo`} className="btn-primary">+ Novo evento</Link>
      </div>
      <div className="page-content">
        <EventosListGestor eventos={eventos} slug={slug} appDomain={appDomain} />
      </div>
    </div>
  )
}
