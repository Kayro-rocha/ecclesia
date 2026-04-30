import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CelulaMembrosMobile from './CelulaMembrosMobile'

interface Props { params: Promise<{ slug: string }> }

const DIAS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function CelulaPage({ params }: Props) {
  const { slug } = await params
  const session = await getMembroSession()
  if (!session || session.slug !== slug) redirect(`/${slug}/membro/login`)

  // Verifica se é líder
  const leaderCell = await prisma.cell.findFirst({
    where: { leaderId: session.memberId, active: true },
    include: {
      members: { include: { member: { select: { id: true, name: true, phone: true } } }, orderBy: { member: { name: 'asc' } } },
      events: { orderBy: { date: 'desc' }, take: 8, include: { attendees: { select: { id: true, memberId: true, name: true, present: true } } } },
    },
  })

  if (leaderCell) {
    // ── VISÃO DO LÍDER ──────────────────────────────────────────
    const now = new Date()
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1)
    const reunioesThisMonth = leaderCell.events.filter(e => new Date(e.date) >= mesInicio)
    const visitantesThisMonth = reunioesThisMonth.reduce((s, e) => s + e.attendees.filter(a => !a.memberId && a.present).length, 0)

    return (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{leaderCell.name}</p>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{DIAS_FULL[leaderCell.dayOfWeek]}s · você é o líder</p>
            </div>
            <Link href={`/${slug}/membro/celula/nova`}
              style={{ background: '#3b82f6', color: 'white', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
              + Reunião
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { label: 'Membros', value: leaderCell.members.length },
              { label: 'Reuniões/mês', value: reunioesThisMonth.length },
              { label: 'Visitantes/mês', value: visitantesThisMonth },
            ].map(s => (
              <div key={s.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: '#94a3b8' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <CelulaMembrosMobile
          membrosIniciais={leaderCell.members.map(({ member: m }) => ({ id: m.id, name: m.name, phone: m.phone }))}
          slug={slug}
        />

        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>Reuniões recentes</p>
          {leaderCell.events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>Nenhuma reunião ainda</p>
              <Link href={`/${slug}/membro/celula/nova`} style={{ display: 'inline-block', marginTop: '10px', fontSize: '13px', color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>Criar primeira reunião →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {leaderCell.events.map(ev => {
                const presentes = ev.attendees.filter(a => a.present && a.memberId).length
                const visitantes = ev.attendees.filter(a => a.present && !a.memberId).length
                const isPast = new Date(ev.date) < now
                return (
                  <Link key={ev.id} href={`/${slug}/membro/celula/${ev.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', flexShrink: 0, textAlign: 'center', background: '#eff6ff', borderRadius: '10px', padding: '6px 0' }}>
                        <p style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6', lineHeight: 1 }}>{new Date(ev.date).getDate()}</p>
                        <p style={{ fontSize: '10px', color: '#3b82f6', textTransform: 'uppercase' }}>{new Date(ev.date).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {isPast && presentes > 0 && <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#166534', padding: '1px 8px', borderRadius: '20px' }}>{presentes} presentes</span>}
                          {visitantes > 0 && <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', padding: '1px 8px', borderRadius: '20px' }}>{visitantes} visitantes</span>}
                          {isPast && presentes === 0 && visitantes === 0 && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Presença não lançada</span>}
                          {!isPast && <span style={{ fontSize: '11px', background: '#fff7ed', color: '#c2410c', padding: '1px 8px', borderRadius: '20px' }}>Em breve</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: '18px', color: '#cbd5e1' }}>›</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── VISÃO DO PARTICIPANTE ────────────────────────────────────
  const membership = await prisma.cellMember.findFirst({
    where: { memberId: session.memberId, cell: { active: true } },
    include: {
      cell: {
        include: {
          leader: { select: { name: true } },
          events: {
            orderBy: { date: 'asc' },
            take: 10,
            select: {
              id: true, title: true, date: true, imageUrl: true,
              attendees: { where: { memberId: session.memberId }, select: { confirmed: true } },
            },
          },
        },
      },
    },
  })

  if (!membership) redirect(`/${slug}/membro/home`)

  const cell = membership.cell
  const now = new Date()
  const upcoming = cell.events.filter(e => new Date(e.date) >= now)
  const past = cell.events.filter(e => new Date(e.date) < now).reverse()

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Info da célula */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{cell.name}</p>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
          {DIAS_FULL[cell.dayOfWeek]}s · Líder: {cell.leader.name.split(' ')[0]}
        </p>
      </div>

      {/* Próximas reuniões */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
          Próximas reuniões
        </p>
        {upcoming.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>Nenhuma reunião agendada</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcoming.map(ev => {
              const myRsvp = ev.attendees[0]
              return (
                <Link key={ev.id} href={`/${slug}/membro/celula/reuniao/${ev.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', background: 'white' }}>
                    {ev.imageUrl && (
                      <img src={ev.imageUrl} alt="" style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                    )}
                    <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', flexShrink: 0, textAlign: 'center', background: '#eff6ff', borderRadius: '10px', padding: '6px 0' }}>
                        <p style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6', lineHeight: 1 }}>{new Date(ev.date).getDate()}</p>
                        <p style={{ fontSize: '10px', color: '#3b82f6', textTransform: 'uppercase' }}>{new Date(ev.date).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {new Date(ev.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {myRsvp ? (
                        <span style={{
                          fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px', flexShrink: 0,
                          background: myRsvp.confirmed ? '#dcfce7' : '#fee2e2',
                          color: myRsvp.confirmed ? '#166534' : '#991b1b',
                        }}>
                          {myRsvp.confirmed ? '✓ Vou' : 'Não vou'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600', flexShrink: 0 }}>Confirmar →</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Reuniões passadas */}
      {past.length > 0 && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
            Reuniões anteriores
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {past.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '13px', color: '#94a3b8', flexShrink: 0, width: '60px' }}>
                  {new Date(ev.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </p>
                <p style={{ fontSize: '14px', color: '#475569', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
