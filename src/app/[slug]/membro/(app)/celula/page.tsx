import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata = { title: 'Célula' }


interface Props {
  params: Promise<{ slug: string }>
}

const DIAS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function CelulaLiderPage({ params }: Props) {
  const { slug } = await params
  const session = await getMembroSession()
  if (!session || session.slug !== slug) redirect(`/${slug}/membro/login`)

  const cell = await prisma.cell.findFirst({
    where: { leaderId: session.memberId, active: true },
    include: {
      members: {
        include: { member: { select: { id: true, name: true, phone: true } } },
        orderBy: { member: { name: 'asc' } },
      },
      events: {
        orderBy: { date: 'desc' },
        take: 8,
        include: {
          attendees: { select: { id: true, memberId: true, name: true, present: true } },
        },
      },
    },
  })

  if (!cell) redirect(`/${slug}/membro/home`)

  const now = new Date()
  const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1)
  const reunioesThisMonth = cell.events.filter(e => new Date(e.date) >= mesInicio)
  const visitantesThisMonth = reunioesThisMonth.reduce(
    (s, e) => s + e.attendees.filter(a => !a.memberId && a.present).length, 0
  )

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <p style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{cell.name}</p>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
              {DIAS_FULL[cell.dayOfWeek]}s · você é o líder
            </p>
          </div>
          <Link
            href={`/${slug}/membro/celula/nova`}
            style={{
              background: '#3b82f6', color: 'white', borderRadius: '10px',
              padding: '8px 14px', fontSize: '13px', fontWeight: '600', textDecoration: 'none',
            }}
          >
            + Reunião
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: 'Membros', value: cell.members.length },
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

      {/* Membros */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
          Membros da célula
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cell.members.map(({ member: m }) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#3b82f6', flexShrink: 0 }}>
                {m.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{m.name.split(' ').slice(0, 2).join(' ')}</p>
              </div>
              {m.phone && (
                <a
                  href={`https://wa.me/55${m.phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ width: '32px', height: '32px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reuniões */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
          Reuniões recentes
        </p>
        {cell.events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Nenhuma reunião ainda</p>
            <Link href={`/${slug}/membro/celula/nova`} style={{ display: 'inline-block', marginTop: '10px', fontSize: '13px', color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>
              Criar primeira reunião →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cell.events.map(ev => {
              const presentes = ev.attendees.filter(a => a.present && a.memberId).length
              const visitantes = ev.attendees.filter(a => a.present && !a.memberId).length
              const isPast = new Date(ev.date) < now
              return (
                <Link
                  key={ev.id}
                  href={`/${slug}/membro/celula/${ev.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{
                      width: '44px', flexShrink: 0, textAlign: 'center',
                      background: '#eff6ff', borderRadius: '10px', padding: '6px 0',
                    }}>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6', lineHeight: 1 }}>
                        {new Date(ev.date).getDate()}
                      </p>
                      <p style={{ fontSize: '10px', color: '#3b82f6', textTransform: 'uppercase' }}>
                        {new Date(ev.date).toLocaleDateString('pt-BR', { month: 'short' })}
                      </p>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.title}
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isPast && presentes > 0 && (
                          <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#166534', padding: '1px 8px', borderRadius: '20px' }}>
                            {presentes} presente{presentes !== 1 ? 's' : ''}
                          </span>
                        )}
                        {visitantes > 0 && (
                          <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', padding: '1px 8px', borderRadius: '20px' }}>
                            {visitantes} visitante{visitantes !== 1 ? 's' : ''}
                          </span>
                        )}
                        {isPast && presentes === 0 && visitantes === 0 && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Presença não lançada</span>
                        )}
                        {!isPast && (
                          <span style={{ fontSize: '11px', background: '#fff7ed', color: '#c2410c', padding: '1px 8px', borderRadius: '20px' }}>
                            Em breve
                          </span>
                        )}
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
