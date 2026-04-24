import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { NotificarPendentes } from './DashboardActions'

export const metadata = { title: 'Dashboard' }


interface Props {
  params: Promise<{ slug: string }>
}

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getBirthdaysThisWeek(members: { id: string; name: string; phone: string; birthDate: Date | null }[]) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return members
    .filter((m) => {
      if (!m.birthDate) return false
      const bd = new Date(m.birthDate)
      const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate())
      return thisYear >= weekStart && thisYear <= weekEnd
    })
    .map((m) => ({
      ...m,
      bdayThisYear: new Date(now.getFullYear(), m.birthDate!.getMonth(), m.birthDate!.getDate()),
    }))
    .sort((a, b) => a.bdayThisYear.getTime() - b.bdayThisYear.getTime())
}

export default async function DashboardPage({ params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const userPermissions = (session.user as any).permissions as string[] | null
  const can = (module: string) => !userPermissions || userPermissions.includes(module)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalMembers,
    totalVisitors,
    totalSchedules,
    currentMonthTithes,
    nextSchedule,
    visitorsToFollow,
    pendingPrayers,
    upcomingEvents,
    membersWithBirthday,
  ] = await Promise.all([
    can('membros') ? prisma.member.count({ where: { churchId: church.id, active: true } }) : 0,
    can('visitantes') ? prisma.visitor.count({ where: { churchId: church.id } }) : 0,
    can('escalas') ? prisma.schedule.count({ where: { churchId: church.id } }) : 0,
    can('dizimo') ? prisma.tithe.findMany({
      where: { churchId: church.id, month: currentMonth, year: currentYear },
      include: { member: { select: { name: true } } },
    }) : [],
    can('escalas') ? prisma.schedule.findFirst({
      where: { churchId: church.id, date: { gte: now } },
      orderBy: { date: 'asc' },
      include: {
        items: {
          include: { member: { select: { name: true } } },
          orderBy: { role: 'asc' },
        },
      },
    }) : null,
    can('visitantes') ? prisma.visitor.findMany({
      where: {
        churchId: church.id,
        lastVisit: { lte: sevenDaysAgo },
        status: { in: ['NEW', 'RETURNED'] },
      },
      orderBy: { lastVisit: 'asc' },
      take: 4,
    }) : [],
    can('oracoes') ? prisma.prayerRequest.findMany({
      where: { churchId: church.id, status: 'PENDING' },
      include: { member: { select: { name: true, group: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }) : [],
    can('eventos') ? prisma.event.findMany({
      where: { churchId: church.id, date: { gte: now } },
      orderBy: { date: 'asc' },
      take: 3,
    }) : [],
    can('membros') ? prisma.member.findMany({
      where: { churchId: church.id, active: true, birthDate: { not: null } },
      select: { id: true, name: true, phone: true, birthDate: true },
    }) : [],
  ])

  const tithePaid = currentMonthTithes.filter((t) => t.status === 'PAID')
  const tithePending = currentMonthTithes.filter((t) => t.status === 'PENDING')
  const titheTotal = tithePaid.reduce((s, t) => s + t.amount, 0)
  const titheProgress = currentMonthTithes.length > 0
    ? Math.round((tithePaid.length / currentMonthTithes.length) * 100)
    : 0

  const scheduleConfirmed = nextSchedule?.items.filter((i) => i.confirmed).length ?? 0
  const scheduleTotal = nextSchedule?.items.length ?? 0

  const birthdaysThisWeek = getBirthdaysThisWeek(membersWithBirthday as Parameters<typeof getBirthdaysThisWeek>[0])

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

  return (
    <div>
      <style>{`
        .widget { background: white; border-radius: 12px; border: 1px solid #edf2f7; padding: 20px; }
        .widget-title { font-size: 13px; font-weight: 600; color: #718096; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 16px; }
        .stat-card { transition: all 0.15s; }
        .stat-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        .alert-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f7fafc; }
        .alert-row:last-child { border-bottom: none; padding-bottom: 0; }
        .alert-row:first-child { padding-top: 0; }
        .avatar-sm { width: 28px; height: 28px; border-radius: 50%; background: var(--primary-light); display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 11px; font-weight: 600; flex-shrink: 0; }
        .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        .chip-green { background: #f0fff4; color: #276749; }
        .chip-orange { background: #fffaf0; color: #744210; }
        .chip-blue { background: var(--primary-light); color: var(--primary); }
        .chip-gray { background: #f7fafc; color: #718096; }
        .progress-bar { background: #edf2f7; border-radius: 99px; height: 8px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 99px; background: var(--primary); transition: width 0.4s; }
        .event-card { background: #fafbfc; border-radius: 10px; padding: 12px 14px; border: 1px solid #edf2f7; }
        .dash-link { color: var(--primary); font-size: 12px; font-weight: 500; text-decoration: none; }
        .dash-link:hover { text-decoration: underline; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '28px 32px 0' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a2e', marginBottom: '2px' }}>
          {saudacao()}, {session.user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: '14px', color: '#a0aec0' }}>
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div style={{ padding: '20px 32px 32px' }}>

        {/* Stat cards */}
        {(() => {
          const statCards = [
            can('membros')   && { label: 'Membros ativos', value: totalMembers, color: '#667eea', href: `/${slug}/membros` },
            can('visitantes') && { label: 'Visitantes', value: totalVisitors, color: '#48bb78', href: `/${slug}/visitantes` },
            can('dizimo')    && { label: `Dízimo ${MESES[currentMonth - 1]}`, value: `R$ ${titheTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: '#ed8936', href: `/${slug}/dizimo` },
            can('escalas')   && { label: 'Total de escalas', value: totalSchedules, color: '#9f7aea', href: `/${slug}/escalas` },
          ].filter(Boolean) as { label: string; value: string | number; color: string; href: string }[]
          if (statCards.length === 0) return null
          return (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statCards.length}, 1fr)`, gap: '14px', marginBottom: '24px' }}>
              {statCards.map((card) => (
                <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
                  <div className="stat-card widget" style={{ borderLeft: `4px solid ${card.color}`, cursor: 'pointer' }}>
                    <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '6px', fontWeight: '500' }}>{card.label}</p>
                    <p style={{ fontSize: '26px', fontWeight: '700', color: '#1a1a2e' }}>{card.value}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        })()}

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Dízimo do Mês */}
            {can('dizimo') && <div className="widget">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <p className="widget-title" style={{ margin: 0 }}>Dízimo — {MESES[currentMonth - 1]}</p>
                <Link href={`/${slug}/dizimo`} className="dash-link">Ver detalhes →</Link>
              </div>

              {currentMonthTithes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ color: '#a0aec0', fontSize: '14px' }}>Nenhuma cobrança gerada este mês</p>
                  <Link href={`/${slug}/dizimo`} className="btn-primary" style={{ display: 'inline-block', marginTop: '12px', fontSize: '13px', padding: '8px 16px' }}>
                    Gerar cobranças
                  </Link>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center', background: '#f0fff4', borderRadius: '10px', padding: '12px' }}>
                      <p style={{ fontSize: '22px', fontWeight: '700', color: '#276749' }}>{tithePaid.length}</p>
                      <p style={{ fontSize: '12px', color: '#38a169' }}>Pagos</p>
                    </div>
                    <div style={{ textAlign: 'center', background: '#fffaf0', borderRadius: '10px', padding: '12px' }}>
                      <p style={{ fontSize: '22px', fontWeight: '700', color: '#744210' }}>{tithePending.length}</p>
                      <p style={{ fontSize: '12px', color: '#dd6b20' }}>Pendentes</p>
                    </div>
                    <div style={{ textAlign: 'center', background: 'var(--primary-light)', borderRadius: '10px', padding: '12px' }}>
                      <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>
                        R$ {titheTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--primary)' }}>Arrecadado</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#718096' }}>Progresso do mês</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a2e' }}>{titheProgress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${titheProgress}%` }} />
                    </div>
                  </div>

                  {tithePending.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffaf0', borderRadius: '8px', padding: '10px 14px' }}>
                      <span style={{ fontSize: '13px', color: '#744210' }}>
                        {tithePending.length} {tithePending.length === 1 ? 'membro pendente' : 'membros pendentes'} — notificar via push
                      </span>
                      <NotificarPendentes slug={slug} pendingCount={tithePending.length} month={currentMonth} year={currentYear} />
                    </div>
                  )}
                </>
              )}
            </div>}

            {/* Próxima Escala */}
            {can('escalas') && <div className="widget">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <p className="widget-title" style={{ margin: 0 }}>Próxima Escala</p>
                <Link href={`/${slug}/escalas`} className="dash-link">Ver todas →</Link>
              </div>

              {!nextSchedule ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ color: '#a0aec0', fontSize: '14px' }}>Nenhuma escala futura cadastrada</p>
                  <Link href={`/${slug}/escalas`} className="btn-primary" style={{ display: 'inline-block', marginTop: '12px', fontSize: '13px', padding: '8px 16px' }}>
                    Criar escala
                  </Link>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <p style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '15px', marginBottom: '4px' }}>{nextSchedule.title}</p>
                      <p style={{ fontSize: '13px', color: '#718096' }}>
                        {new Date(nextSchedule.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                        {' · '}{nextSchedule.department}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '18px', fontWeight: '700', color: scheduleConfirmed === scheduleTotal && scheduleTotal > 0 ? '#276749' : '#1a1a2e' }}>
                        {scheduleConfirmed}/{scheduleTotal}
                      </p>
                      <p style={{ fontSize: '11px', color: '#a0aec0' }}>confirmados</p>
                    </div>
                  </div>

                  {nextSchedule.items.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {nextSchedule.items.map((item) => (
                        <div key={item.id} className={`chip ${item.confirmed ? 'chip-green' : 'chip-orange'}`}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.confirmed ? '#38a169' : '#dd6b20', flexShrink: 0 }} />
                          {item.member.name.split(' ')[0]}
                          <span style={{ fontSize: '11px', opacity: 0.7 }}>· {item.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>}

            {/* Próximos Eventos */}
            {can('eventos') && upcomingEvents.length > 0 && (
              <div className="widget">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <p className="widget-title" style={{ margin: 0 }}>Próximos Eventos</p>
                  <Link href={`/${slug}/eventos`} className="dash-link">Ver todos →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {upcomingEvents.map((ev) => (
                    <div key={ev.id} className="event-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '42px', flexShrink: 0, textAlign: 'center',
                        background: 'var(--primary-light)', borderRadius: '8px', padding: '6px 0',
                      }}>
                        <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', lineHeight: 1 }}>
                          {new Date(ev.date).getDate()}
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--primary)', textTransform: 'uppercase' }}>
                          {MESES[new Date(ev.date).getMonth()].slice(0, 3)}
                        </p>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: '500', fontSize: '14px', color: '#1a1a2e', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ev.title}
                        </p>
                        {ev.location && (
                          <p style={{ fontSize: '12px', color: '#a0aec0' }}>{ev.location}</p>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: '#a0aec0', flexShrink: 0 }}>
                        {DIAS_SEMANA[new Date(ev.date).getDay()]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Aniversariantes da semana */}
            {can('membros') && <div className="widget">
              <p className="widget-title">Aniversariantes da semana</p>
              {birthdaysThisWeek.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#a0aec0', textAlign: 'center', padding: '12px 0' }}>
                  Nenhum aniversariante esta semana
                </p>
              ) : (
                <div>
                  {birthdaysThisWeek.map((m) => {
                    const isToday = m.bdayThisYear.toDateString() === now.toDateString()
                    const isTomorrow = m.bdayThisYear.toDateString() === new Date(now.getTime() + 86400000).toDateString()
                    const label = isToday ? 'Hoje! 🎂' : isTomorrow ? 'Amanhã' : DIAS_SEMANA[m.bdayThisYear.getDay()]
                    const waLink = `https://wa.me/55${m.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Parabéns pelo seu aniversário! 🎉 Que Deus te abençoe muito!`)}`
                    return (
                      <div key={m.id} className="alert-row">
                        <div className="avatar-sm">{m.name.charAt(0)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.name.split(' ').slice(0, 2).join(' ')}
                          </p>
                          <p style={{ fontSize: '11px', color: isToday ? '#276749' : '#a0aec0', fontWeight: isToday ? '600' : '400' }}>
                            {label}
                          </p>
                        </div>
                        <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                          fontSize: '11px', background: '#dcfce7', color: '#166534',
                          padding: '3px 8px', borderRadius: '20px', textDecoration: 'none',
                          fontWeight: '500', flexShrink: 0,
                        }}>
                          WhatsApp
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
              <div style={{ marginTop: '12px', borderTop: '1px solid #f7fafc', paddingTop: '10px' }}>
                <p style={{ fontSize: '11px', color: '#cbd5e0', textAlign: 'center' }}>
                  Adicione aniversários no cadastro dos membros
                </p>
              </div>
            </div>}

            {/* Visitantes para acompanhar */}
            {can('visitantes') && <div className="widget">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <p className="widget-title" style={{ margin: 0 }}>Visitantes sem retorno</p>
                <Link href={`/${slug}/visitantes`} className="dash-link">Ver todos →</Link>
              </div>

              {visitorsToFollow.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#48bb78', textAlign: 'center', padding: '8px 0' }}>
                  ✓ Nenhum visitante pendente
                </p>
              ) : (
                <>
                  <div style={{ background: '#fffaf0', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>⚠️</span>
                    <p style={{ fontSize: '13px', color: '#744210' }}>
                      <strong>{visitorsToFollow.length}</strong> {visitorsToFollow.length === 1 ? 'visitante' : 'visitantes'} sem resposta há 7+ dias
                    </p>
                  </div>
                  <div>
                    {visitorsToFollow.map((v) => {
                      const days = Math.floor((now.getTime() - new Date(v.lastVisit).getTime()) / 86400000)
                      const waLink = `https://wa.me/55${v.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${v.name.split(' ')[0]}! Sentimos sua falta. Esperamos te ver em breve. 🙏`)}`
                      return (
                        <div key={v.id} className="alert-row">
                          <div className="avatar-sm" style={{ background: '#fffaf0', color: '#dd6b20' }}>{v.name.charAt(0)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {v.name.split(' ').slice(0, 2).join(' ')}
                            </p>
                            <p style={{ fontSize: '11px', color: '#a0aec0' }}>{days} dias sem visita</p>
                          </div>
                          <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                            fontSize: '11px', background: '#dcfce7', color: '#166534',
                            padding: '3px 8px', borderRadius: '20px', textDecoration: 'none',
                            fontWeight: '500', flexShrink: 0,
                          }}>
                            Contatar
                          </a>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>}

            {/* Orações pendentes */}
            {can('oracoes') && <div className="widget">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <p className="widget-title" style={{ margin: 0 }}>Orações Pendentes</p>
                <Link href={`/${slug}/oracoes`} className="dash-link">Ver todas →</Link>
              </div>

              {pendingPrayers.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#48bb78', textAlign: 'center', padding: '8px 0' }}>
                  ✓ Nenhum pedido pendente
                </p>
              ) : (
                <div>
                  {pendingPrayers.map((p) => (
                    <div key={p.id} className="alert-row">
                      <div className="avatar-sm" style={{ background: '#faf5ff', color: '#7c3aed' }}>{p.member.name.charAt(0)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>
                          {p.member.name.split(' ')[0]}
                          {p.member.group && <span style={{ color: '#a0aec0', fontWeight: '400' }}> · {p.member.group}</span>}
                        </p>
                        <p style={{ fontSize: '12px', color: '#718096', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.request}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>}

          </div>
        </div>
      </div>
    </div>
  )
}
