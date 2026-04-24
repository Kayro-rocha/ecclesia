import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Wallet, Clock, MapPin, Gift, ChevronRight } from 'lucide-react'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import HomeRsvp from './HomeRsvp'
import HomePrayerButton from './HomePrayerButton'

export const metadata = { title: 'Início' }


interface Props { params: Promise<{ slug: string }> }

export default async function MembroHomePage({ params }: Props) {
  const { slug } = await params
  const session = await getMembroSession()
  if (!session) redirect(`/${slug}/membro/login`)

  const now = new Date()
  const mes = now.getMonth() + 1
  const ano = now.getFullYear()
  const hora = now.getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  // Comunicado só aparece se criado nos últimos 14 dias
  const quatorzeAtras = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { name: true, phone: true, group: true, church: { select: { name: true, primaryColor: true } } },
  })
  if (!member) redirect(`/${slug}/membro/login`)

  const groupFilter = [
    { targetGroup: null },
    { targetGroup: '' },
    ...(member.group ? [{ targetGroup: member.group }] : []),
  ]

  const [
    proximaEscala,
    ultimoComunicado,
    proximoEvento,
    dizimoMes,
    missaoAtiva,
    rsvpEvento,
  ] = await Promise.all([
    prisma.schedule.findFirst({
      where: {
        date: { gte: now },
        items: { some: { memberId: session.memberId } },
      },
      orderBy: { date: 'asc' },
      include: {
        items: {
          where: { memberId: session.memberId },
          select: { id: true, role: true, status: true },
        },
      },
    }),

    // Só mostra comunicado recente (últimos 14 dias)
    prisma.announcement.findFirst({
      where: {
        churchId: session.churchId,
        createdAt: { gte: quatorzeAtras },
        OR: groupFilter,
      },
      orderBy: { createdAt: 'desc' },
    }),

    prisma.event.findFirst({
      where: { churchId: session.churchId, date: { gte: now }, OR: groupFilter },
      orderBy: { date: 'asc' },
    }),

    prisma.tithe.findFirst({
      where: { memberId: session.memberId, month: mes, year: ano },
    }),

    prisma.mission.findFirst({
      where: { churchId: session.churchId, deliveryDate: { gte: now } },
      orderBy: { deliveryDate: 'asc' },
      include: { items: { select: { quantity: true, committed: true } } },
    }),

    // RSVP do membro no próximo evento
    prisma.event.findFirst({
      where: { churchId: session.churchId, date: { gte: now }, OR: groupFilter },
      orderBy: { date: 'asc' },
      select: { id: true },
    }).then(ev => ev
      ? prisma.eventAttendee.findFirst({
          where: { eventId: ev.id, memberId: session.memberId },
          select: { confirmed: true },
        })
      : null
    ),
  ])

  const firstName = member.name.split(' ')[0]
  const color = member.church?.primaryColor || '#3b82f6'

  const weekDay = now.toLocaleDateString('pt-BR', { weekday: 'long' })
  const dataFull = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })

  // Missão: cálculo de progresso
  const mTotalQtd  = missaoAtiva?.items.reduce((s, i) => s + i.quantity, 0) ?? 0
  const mCommitted = missaoAtiva?.items.reduce((s, i) => s + i.committed, 0) ?? 0
  const mPct       = mTotalQtd > 0 ? Math.min(Math.round((mCommitted / mTotalQtd) * 100), 100) : 0

  // Comunicado: "NOVO" se criado nos últimos 3 dias
  const isNew = ultimoComunicado
    ? (now.getTime() - new Date(ultimoComunicado.createdAt).getTime()) < 3 * 86400000
    : false

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Banner ─────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        borderRadius: '20px', padding: '20px', color: 'white',
      }}>
        <p style={{ margin: '0 0 2px', fontSize: '13px', opacity: 0.8, textTransform: 'capitalize' }}>
          {weekDay}, {dataFull}
        </p>
        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700' }}>
          {saudacao}, {firstName}! 👋
        </h1>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
          {member.church?.name}{member.group ? ` · ${member.group}` : ''}
        </p>
      </div>

      {/* ── Pedido de oração ───────────────────────────────────────── */}
      <HomePrayerButton slug={slug} memberId={session.memberId} />

      {/* ── Próximo evento (só se houver evento futuro) ─────────────── */}
      {proximoEvento && (
        <section>
          <p style={sectionLabel}>PRÓXIMO EVENTO</p>
          <div style={{ background: 'white', borderRadius: '18px', border: '1px solid #bfdbfe', overflow: 'hidden' }}>
            <Link href={`/${slug}/membro/eventos?id=${proximoEvento.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              {proximoEvento.imageUrl && (
                <img
                  src={proximoEvento.imageUrl}
                  alt={proximoEvento.title}
                  style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                />
              )}
              <div style={{ display: 'flex' }}>
                <div style={{
                  minWidth: '68px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', padding: '16px 10px',
                  background: '#eff6ff', borderRight: '1px solid #e0f2fe',
                }}>
                  <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '700', textTransform: 'uppercase' }}>
                    {new Date(proximoEvento.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                  </span>
                  <span style={{ fontSize: '30px', fontWeight: '800', color: '#1e40af', lineHeight: 1 }}>
                    {new Date(proximoEvento.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                  </span>
                  <span style={{ fontSize: '11px', color: '#60a5fa' }}>
                    {new Date(proximoEvento.date).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                  </span>
                </div>
                <div style={{ flex: 1, padding: '14px 16px' }}>
                  <h2 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                    {proximoEvento.title}
                  </h2>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                      <Clock size={12} color="#94a3b8" />
                      {new Date(proximoEvento.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {proximoEvento.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                        <MapPin size={12} color="#94a3b8" />{proximoEvento.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>

            <div style={{ padding: '0 14px 14px' }}>
              <HomeRsvp
                eventId={proximoEvento.id}
                memberId={session.memberId}
                memberName={member.name}
                memberPhone={member.phone ?? ''}
                initialRsvp={rsvpEvento ? rsvpEvento.confirmed : null}
                slug={slug}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Comunicado recente (só se criado nos últimos 14 dias) ───── */}
      {ultimoComunicado && (
        <section>
          <p style={sectionLabel}>AVISO RECENTE</p>
          <Link href={`/${slug}/membro/comunicados`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white', borderRadius: '18px',
              border: `1px solid ${isNew ? '#bfdbfe' : '#f1f5f9'}`,
              overflow: 'hidden',
            }}>
              {ultimoComunicado.imageUrl && (
                <img
                  src={ultimoComunicado.imageUrl}
                  alt={ultimoComunicado.title}
                  style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                />
              )}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {isNew && (
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: '#eff6ff', color: '#3b82f6' }}>
                      NOVO
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {new Date(ultimoComunicado.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                  {ultimoComunicado.title}
                </h3>
                <p style={{
                  margin: '0 0 8px', fontSize: '13px', color: '#475569', lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {ultimoComunicado.body}
                </p>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
                  Ler mais <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── Grid: escala + dízimo ──────────────────────────────────── */}
      {/* Se não tem escala, dízimo ocupa largura total */}
      {proximaEscala ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Link href={`/${slug}/membro/escalas`} style={{ textDecoration: 'none' }}>
            <div style={cardStyle}>
              <div style={iconBox('#eff6ff', '#3b82f6')}><Calendar size={18} /></div>
              <p style={cardLabel}>Próxima Escala</p>
              <p style={cardValue}>{proximaEscala.department}</p>
              <p style={cardSub}>
                {new Date(proximaEscala.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </p>
              <StatusBadge status={proximaEscala.items[0]?.status ?? 'PENDING'} />
            </div>
          </Link>
          <Link href={`/${slug}/membro/dizimo`} style={{ textDecoration: 'none' }}>
            <div style={cardStyle}>
              <DizimoCard dizimoMes={dizimoMes} mes={mes} ano={ano} />
            </div>
          </Link>
        </div>
      ) : (
        <Link href={`/${slug}/membro/dizimo`} style={{ textDecoration: 'none' }}>
          <div style={{ ...cardStyle, flexDirection: 'row', alignItems: 'center', gap: '14px', padding: '16px 20px' }}>
            <div style={iconBox('#f0fdf4', '#22c55e')}><Wallet size={18} /></div>
            <div style={{ flex: 1 }}>
              <p style={cardLabel}>Dízimo {mes.toString().padStart(2, '0')}/{ano}</p>
              <p style={{ ...cardValue, fontSize: '16px' }}>
                {dizimoMes
                  ? dizimoMes.status === 'PAID' ? 'Em dia ✓' : dizimoMes.status === 'EXEMPT' ? 'Isento' : 'Pendente'
                  : 'Sem registro'}
              </p>
              {dizimoMes?.amount && (
                <p style={cardSub}>
                  R$ {dizimoMes.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
            <span style={{
              fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px',
              background: dizimoMes?.status === 'PAID' ? '#dcfce7' : '#fef9c3',
              color: dizimoMes?.status === 'PAID' ? '#16a34a' : '#a16207',
            }}>
              {dizimoMes?.status === 'PAID' ? '✓ Em dia' : 'Ver PIX'}
            </span>
          </div>
        </Link>
      )}

      {/* ── Missão ativa (só se houver missão com data futura e < 100%) */}
      {missaoAtiva && mPct < 100 && (
        <section>
          <p style={sectionLabel}>MISSÃO ATIVA</p>
          <Link href={`/${slug}/membro/missoes`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white', borderRadius: '18px', padding: '16px',
              border: '1px solid #fed7aa',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Gift size={15} color="#f97316" />{missaoAtiva.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                    Entrega: {new Date(missaoAtiva.deliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </p>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f97316' }}>{mPct}%</span>
              </div>
              <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '8px', marginBottom: '10px' }}>
                <div style={{
                  height: '8px', borderRadius: '99px', width: `${mPct}%`,
                  background: mPct > 70 ? '#22c55e' : '#f97316', transition: 'width 0.4s',
                }} />
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#f97316', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}>
                Toque para colaborar <ChevronRight size={14} />
              </p>
            </div>
          </Link>
        </section>
      )}

    </div>
  )
}

// ── Sub-componentes ─────────────────────────────────────────────────────────

function DizimoCard({ dizimoMes, mes, ano }: {
  dizimoMes: { status: string; amount: number } | null
  mes: number
  ano: number
}) {
  return (
    <>
      <div style={iconBox('#f0fdf4', '#22c55e')}><Wallet size={18} /></div>
      <p style={cardLabel}>Dízimo {mes.toString().padStart(2, '0')}/{ano}</p>
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
    </>
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

// ── Estilos ─────────────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  margin: '0 0 10px', fontSize: '11px', fontWeight: '700',
  color: '#94a3b8', letterSpacing: '0.5px',
}

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
    justifyContent: 'center', color,
  }
}
