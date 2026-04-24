import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata = { title: 'Células' }


interface Props {
  params: Promise<{ slug: string }>
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function CelulasPage({ params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const now = new Date()
  const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1)

  const cells = await prisma.cell.findMany({
    where: { churchId: church.id, active: true },
    include: {
      leader: { select: { name: true } },
      _count: { select: { members: true } },
      events: {
        select: {
          id: true,
          date: true,
          attendees: {
            where: { memberId: null, present: true },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/dashboard`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Painel</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Células</span>
        </div>
        <Link href={`/${slug}/celulas/nova`} className="btn-primary">+ Nova célula</Link>
      </div>

      <div className="page-content">
        {cells.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px' }}>
              Nenhuma célula cadastrada
            </p>
            <p style={{ fontSize: '14px', color: '#a0aec0', marginBottom: '24px' }}>
              Crie a primeira célula e atribua um líder
            </p>
            <Link href={`/${slug}/celulas/nova`} className="btn-primary">Criar primeira célula</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {cells.map((cell) => {
              const reunioesThisMonth = cell.events.filter(e => new Date(e.date) >= mesInicio)
              const visitantesThisMonth = reunioesThisMonth.reduce((s, e) => s + e.attendees.length, 0)
              const totalReunioes = cell.events.length

              return (
                <div key={cell.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '16px', color: '#1a1a2e', marginBottom: '4px' }}>{cell.name}</p>
                      <p style={{ fontSize: '13px', color: '#718096' }}>Líder: {cell.leader.name.split(' ').slice(0, 2).join(' ')}</p>
                    </div>
                    <span className="badge-blue">{DIAS[cell.dayOfWeek]}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <p style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e' }}>{cell._count.members}</p>
                      <p style={{ fontSize: '11px', color: '#a0aec0' }}>membros</p>
                    </div>
                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <p style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e' }}>{totalReunioes}</p>
                      <p style={{ fontSize: '11px', color: '#a0aec0' }}>reuniões</p>
                    </div>
                    <div style={{ flex: 1, background: visitantesThisMonth > 0 ? '#f0fff4' : '#f8fafc', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <p style={{ fontSize: '20px', fontWeight: '700', color: visitantesThisMonth > 0 ? '#276749' : '#1a1a2e' }}>{visitantesThisMonth}</p>
                      <p style={{ fontSize: '11px', color: '#a0aec0' }}>visitantes/mês</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      href={`/${slug}/celulas/${cell.id}`}
                      className="btn-primary"
                      style={{ flex: 1, textAlign: 'center', fontSize: '13px', padding: '8px' }}
                    >
                      Ver célula
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
