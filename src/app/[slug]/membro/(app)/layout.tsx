import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import MembroBottomNav from './MembroBottomNav'
import PushActivar from './PushActivar'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function MembroAppLayout({ children, params }: Props) {
  const { slug } = await params
  const session = await getMembroSession()

  if (!session || session.slug !== slug) {
    redirect(`/${slug}/membro/login`)
  }

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { name: true, church: { select: { name: true, primaryColor: true } } },
  })

  if (!member) redirect(`/${slug}/membro/login`)

  const firstName = member.name.split(' ')[0]
  const churchColor = member.church?.primaryColor || '#3b82f6'

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafc', paddingBottom: '62px' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'white', borderBottom: '1px solid #e2e8f0',
        padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '56px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: `${churchColor}20`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>
            ⛪
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1e293b', lineHeight: 1.2 }}>
              {member.church?.name}
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.2 }}>
              Olá, {firstName}
            </p>
          </div>
        </div>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: churchColor, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: 'white',
        }}>
          {firstName[0].toUpperCase()}
        </div>
      </header>

      {/* Banner de notificações — aparece só se permissão ainda não foi dada */}
      <PushActivar slug={slug} memberId={session.memberId} />

      {/* Conteúdo */}
      <main style={{ padding: '0' }}>
        {children}
      </main>

      <MembroBottomNav slug={slug} />
    </div>
  )
}
