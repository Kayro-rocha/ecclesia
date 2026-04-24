import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CelulaDetalheClient from './CelulaDetalheClient'
import CelulaActions from './CelulaActions'

interface Props {
  params: Promise<{ slug: string; id: string }>
}

const DIAS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function CelulaDetalhePage({ params }: Props) {
  const { slug, id } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const cell = await prisma.cell.findFirst({
    where: { id, churchId: church.id },
    include: {
      leader: { select: { id: true, name: true } },
      members: {
        include: { member: { select: { id: true, name: true, phone: true, group: true } } },
        orderBy: { member: { name: 'asc' } },
      },
      events: {
        orderBy: { date: 'desc' },
        include: {
          attendees: { select: { id: true, memberId: true, name: true, present: true } },
        },
      },
    },
  })

  if (!cell) redirect(`/${slug}/celulas`)

  const allMembers = await prisma.member.findMany({
    where: { churchId: church.id, active: true },
    select: { id: true, name: true, group: true },
    orderBy: { name: 'asc' },
  })

  const now = new Date()
  const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1)
  const reunioesThisMonth = cell.events.filter(e => new Date(e.date) >= mesInicio)
  const visitantesThisMonth = reunioesThisMonth.reduce(
    (s, e) => s + e.attendees.filter(a => a.memberId === null && a.present).length, 0
  )
  const totalPresencas = cell.events.reduce(
    (s, e) => s + e.attendees.filter(a => a.present).length, 0
  )

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/celulas`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Células</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>{cell.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <CelulaActions
            cellId={id}
            slug={slug}
            cell={{ name: cell.name, leaderId: cell.leaderId, dayOfWeek: cell.dayOfWeek }}
            allMembers={allMembers}
          />
          <Link href={`/${slug}/celulas/${id}/nova-reuniao`} className="btn-primary">+ Nova reunião</Link>
        </div>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Stats header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {[
            { label: 'Membros', value: cell.members.length, color: '#667eea' },
            { label: 'Reuniões total', value: cell.events.length, color: '#9f7aea' },
            { label: 'Reuniões este mês', value: reunioesThisMonth.length, color: '#48bb78' },
            { label: 'Visitantes este mês', value: visitantesThisMonth, color: '#ed8936' },
          ].map(s => (
            <div key={s.label} className="card" style={{ borderLeft: `4px solid ${s.color}` }}>
              <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a2e' }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>

          {/* Reuniões */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '14px' }}>Reuniões</p>
              <span style={{ fontSize: '12px', color: '#a0aec0' }}>{cell.events.length} no total</span>
            </div>
            {cell.events.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#a0aec0', fontSize: '14px' }}>Nenhuma reunião registrada</p>
                <Link href={`/${slug}/celulas/${id}/nova-reuniao`} className="btn-primary" style={{ display: 'inline-block', marginTop: '12px', fontSize: '13px' }}>
                  Criar primeira reunião
                </Link>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Reunião</th>
                    <th>Data</th>
                    <th>Presentes</th>
                    <th>Visitantes</th>
                  </tr>
                </thead>
                <tbody>
                  {cell.events.map(ev => {
                    const presentes = ev.attendees.filter(a => a.present && a.memberId !== null).length
                    const visitantes = ev.attendees.filter(a => a.present && a.memberId === null).length
                    return (
                      <tr key={ev.id}>
                        <td style={{ fontWeight: '500' }}>{ev.title}</td>
                        <td style={{ color: '#718096', fontSize: '13px' }}>
                          {new Date(ev.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <span className="badge-green">{presentes} presente{presentes !== 1 ? 's' : ''}</span>
                        </td>
                        <td>
                          {visitantes > 0 ? (
                            <span className="badge-blue">{visitantes} visitante{visitantes !== 1 ? 's' : ''}</span>
                          ) : (
                            <span style={{ color: '#a0aec0', fontSize: '13px' }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Sidebar: info + membros */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', marginBottom: '14px' }}>Informações</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#718096' }}>Líder</span>
                  <span style={{ fontWeight: '500', color: '#1a1a2e' }}>{cell.leader.name.split(' ').slice(0, 2).join(' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#718096' }}>Dia</span>
                  <span className="badge-blue">{DIAS_FULL[cell.dayOfWeek]}</span>
                </div>
              </div>
            </div>

            <CelulaDetalheClient
              cellId={id}
              slug={slug}
              members={cell.members.map(m => m.member)}
              allMembers={allMembers}
              cellLeaderId={cell.leaderId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
