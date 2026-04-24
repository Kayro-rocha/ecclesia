import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import { Building2 } from 'lucide-react'
import MembroBottomNav from './MembroBottomNav'
import PushActivar from './PushActivar'
import SessionGuard from './SessionGuard'
import AutoRefresh from './AutoRefresh'

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
    select: { name: true, group: true, church: { select: { name: true, primaryColor: true, secondaryColor: true, logoUrl: true, phone: true } } },
  })

  if (!member) redirect(`/${slug}/membro/login`)

  const leaderCell = await prisma.cell.findFirst({
    where: { leaderId: session.memberId, active: true },
    select: { id: true },
  })
  const isLeader = !!leaderCell

  const firstName = member.name.split(' ')[0]
  const churchColor = member.church?.primaryColor || '#3b82f6'
  const churchSecondary = member.church?.secondaryColor || '#1e40af'
  const churchLogo = member.church?.logoUrl ?? null

  // Link wa.me: remove tudo que não é dígito e prepend 55 se necessário
  const rawPhone = member.church?.phone ?? ''
  const digits = rawPhone.replace(/\D/g, '')
  const waPhone = digits.startsWith('55') ? digits : digits ? `55${digits}` : ''
  const whatsappUrl = waPhone ? `https://wa.me/${waPhone}` : null

  const groupFilter = [
    { targetGroup: null },
    { targetGroup: '' },
    ...(member.group ? [{ targetGroup: member.group }] : []),
  ]

  // Timestamps mais recentes para badges de não-lido
  const [latestComunicado, latestEscala] = await Promise.all([
    prisma.announcement.findFirst({
      where: { churchId: session.churchId, OR: groupFilter },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    prisma.schedule.findFirst({
      where: { churchId: session.churchId, items: { some: { memberId: session.memberId } } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ])

  const latestComunicadoAt = latestComunicado?.createdAt.toISOString() ?? null
  const latestEscalaAt = latestEscala?.createdAt.toISOString() ?? null

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafc', paddingBottom: '62px' }}>
      <style>{`
        :root {
          --church-primary: ${churchColor};
          --church-secondary: ${churchSecondary};
          --church-primary-light: ${churchColor}18;
        }
      `}</style>
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
            background: churchLogo ? 'transparent' : `${churchColor}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: churchColor, overflow: 'hidden', flexShrink: 0,
          }}>
            {churchLogo
              ? <img src={churchLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Building2 size={18} />
            }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Falar com a igreja no WhatsApp"
              style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: '#dcfce7', display: 'flex', alignItems: 'center',
                justifyContent: 'center', textDecoration: 'none', flexShrink: 0,
              }}
            >
              {/* Ícone WhatsApp SVG inline */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#16a34a">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          )}
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: churchColor, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: 'white',
          }}>
            {firstName[0].toUpperCase()}
          </div>
        </div>
      </header>

      {/* Banner de notificações — aparece só se permissão ainda não foi dada */}
      <PushActivar slug={slug} memberId={session.memberId} />
      <AutoRefresh />

      {/* Conteúdo */}
      <main style={{ padding: '0' }}>
        {children}
      </main>

      <MembroBottomNav slug={slug} latestComunicadoAt={latestComunicadoAt} latestEscalaAt={latestEscalaAt} isLeader={isLeader} />
      <SessionGuard />
    </div>
  )
}
