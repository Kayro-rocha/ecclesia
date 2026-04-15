import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

interface Props { params: Promise<{ slug: string }> }

export default async function MembroHomePage({ params }: Props) {
  const { slug } = await params
  const session = await getMembroSession()
  if (!session) redirect(`/${slug}/membro/login`)

  const now = new Date()
  const mes = now.getMonth() + 1
  const ano = now.getFullYear()

  const [member, proximaEscala, ultimoComunicado, proximoEvento, dizimoMes] = await Promise.all([
    prisma.member.findUnique({
      where: { id: session.memberId },
      select: { name: true, group: true, church: { select: { name: true, primaryColor: true } } },
    }),

    prisma.scheduleItem.findFirst({
      where: {
        memberId: session.memberId,
        schedule: { date: { gte: now } },
      },
      orderBy: { schedule: { date: 'asc' } },
      include: { schedule: { select: { title: true, date: true, department: true } } },
    }),

    prisma.announcement.findFirst({
      where: {
        churchId: session.churchId,
        OR: [{ targetGroup: null }, { targetGroup: '' }],
      },
      orderBy: { createdAt: 'desc' },
    }),

    prisma.event.findFirst({
      where: {
        churchId: session.churchId,
        date: { gte: now },
        OR: [{ targetGroup: null }, { targetGroup: '' }],
      },
      orderBy: { date: 'asc' },
    }),

    prisma.tithe.findFirst({
      where: { memberId: session.memberId, month: mes, year: ano },
    }),
  ])

  if (!member) redirect(`/${slug}/membro/login`)

  const firstName = member.name.split(' ')[0]
  const color = member.church?.primaryColor || '#3b82f6'

  const weekDay = now.toLocaleDateString('pt-BR', { weekday: 'long' })
  const dataFull = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Banner de boas-vindas */}
      <div style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        borderRadius: '20px', padding: '20px',
        color: 'white',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '13px', opacity: 0.8, textTransform: 'capitalize' }}>
          {weekDay}, {dataFull}
        </p>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700' }}>
          Olá, {firstName}! 👋
        </h1>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
          {member.church?.name}
          {member.group ? ` · ${member.group}` : ''}
        </p>
      </div>

      {/* Grid de cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

        {/* Próxima escala */}
        <Link href={`/${slug}/membro/escalas`} style={{ textDecoration: 'none' }}>
          <div style={cardStyle}>
            <div style={iconBox('#eff6ff', '#3b82f6')}>📅</div>
            <p style={cardLabel}>Próxima Escala</p>
            {proximaEscala ? (
              <>
                <p style={cardValue}>{proximaEscala.schedule.department}</p>
                <p style={cardSub}>
                  {new Date(proximaEscala.schedule.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </p>
                <StatusBadge status={proximaEscala.status} />
              </>
            ) : (
              <p style={cardSub}>Nenhuma escala</p>
            )}
          </div>
        </Link>

        {/* Dízimo do mês */}
        <Link href={`/${slug}/membro/dizimo`} style={{ textDecoration: 'none' }}>
          <div style={cardStyle}>
            <div style={iconBox('#f0fdf4', '#22c55e')}>💰</div>
            <p style={cardLabel}>Dízimo — {mes.toString().padStart(2, '0')}/{ano}</p>
            {dizimoMes ? (
              <>
                <p style={cardValue}>
                  {dizimoMes.status === 'PAID' ? 'Pago' : dizimoMes.status === 'EXEMPT' ? 'Isento' : 'Pendente'}
                </p>
                <p style={cardSub}>
                  R$ {dizimoMes.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </>
            ) : (
              <p style={cardSub}>Sem registro</p>
            )}
            <span style={{
              display: 'inline-block', marginTop: '6px', fontSize: '10px', fontWeight: '600',
              padding: '2px 8px', borderRadius: '20px',
              background: dizimoMes?.status === 'PAID' ? '#dcfce7' : '#fef9c3',
              color: dizimoMes?.status === 'PAID' ? '#16a34a' : '#a16207',
            }}>
              {dizimoMes?.status === 'PAID' ? '✓ Em dia' : 'Ver PIX'}
            </span>
          </div>
        </Link>

        {/* Próximo evento */}
        <Link href={`/${slug}/membro/eventos`} style={{ textDecoration: 'none' }}>
          <div style={cardStyle}>
            <div style={iconBox('#faf5ff', '#a855f7')}>🎉</div>
            <p style={cardLabel}>Próximo Evento</p>
            {proximoEvento ? (
              <>
                <p style={cardValue}>{proximoEvento.title}</p>
                <p style={cardSub}>
                  {new Date(proximoEvento.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </p>
              </>
            ) : (
              <p style={cardSub}>Nenhum evento</p>
            )}
          </div>
        </Link>

        {/* Último comunicado */}
        <Link href={`/${slug}/membro/comunicados`} style={{ textDecoration: 'none' }}>
          <div style={cardStyle}>
            <div style={iconBox('#fff7ed', '#f97316')}>📢</div>
            <p style={cardLabel}>Último Aviso</p>
            {ultimoComunicado ? (
              <>
                <p style={cardValue}>{ultimoComunicado.title}</p>
                <p style={cardSub}>
                  {new Date(ultimoComunicado.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </p>
              </>
            ) : (
              <p style={cardSub}>Nenhum aviso</p>
            )}
          </div>
        </Link>
      </div>

      {/* Ações rápidas */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
          ACESSO RÁPIDO
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { href: `/${slug}/membro/escalas`,     icon: '📅', label: 'Minhas Escalas',    sub: 'Ver todas as convocações' },
            { href: `/${slug}/membro/missoes`,      icon: '🎁', label: 'Missões',           sub: 'Colabore com doações' },
            { href: `/${slug}/membro/comunicados`,  icon: '📢', label: 'Comunicados',       sub: 'Avisos da igreja' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'white', borderRadius: '14px', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: '14px',
                border: '1px solid #f1f5f9',
              }}>
                <span style={{ fontSize: '24px' }}>{item.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{item.sub}</p>
                </div>
                <span style={{ marginLeft: 'auto', color: '#cbd5e1', fontSize: '18px' }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    PENDING:   { label: 'Pendente',   bg: '#fef9c3', color: '#a16207' },
    CONFIRMED: { label: 'Confirmado', bg: '#dcfce7', color: '#16a34a' },
    DECLINED:  { label: 'Recusado',   bg: '#fee2e2', color: '#dc2626' },
  }
  const s = map[status] || map.PENDING
  return (
    <span style={{
      display: 'inline-block', marginTop: '6px', fontSize: '10px', fontWeight: '600',
      padding: '2px 8px', borderRadius: '20px', background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  )
}

// Estilos reutilizáveis
const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '16px', padding: '16px',
  border: '1px solid #f1f5f9', height: '100%',
  display: 'flex', flexDirection: 'column',
}

const cardLabel: React.CSSProperties = {
  margin: '10px 0 4px', fontSize: '11px', fontWeight: '600',
  color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px',
}

const cardValue: React.CSSProperties = {
  margin: '0 0 2px', fontSize: '14px', fontWeight: '700',
  color: '#1e293b', lineHeight: 1.3,
  display: '-webkit-box', WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical', overflow: 'hidden',
}

const cardSub: React.CSSProperties = {
  margin: 0, fontSize: '12px', color: '#94a3b8',
}

function iconBox(bg: string, color: string): React.CSSProperties {
  return {
    width: '36px', height: '36px', borderRadius: '10px',
    background: bg, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '18px',
  }
}
