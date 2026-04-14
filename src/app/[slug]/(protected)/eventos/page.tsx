import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

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
        {eventos.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</div>
            <p style={{ color: '#718096', fontSize: '14px', margin: '0 0 20px' }}>
              Nenhum evento criado ainda.<br />Crie retiros, células, encontros e muito mais.
            </p>
            <Link href={`/${slug}/eventos/novo`} className="btn-primary">Criar primeiro evento</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {eventos.map(evento => {
              const passado = new Date(evento.date) < new Date()
              const dataFormatada = new Date(evento.date).toLocaleDateString('pt-BR', {
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
              })
              const link = `https://${slug}.${appDomain}/evento/${evento.id}`
              return (
                <div key={evento.id} className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '12px', flexShrink: 0,
                    background: passado ? '#f7fafc' : 'var(--primary-light)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: passado ? '#a0aec0' : 'var(--primary)', lineHeight: 1 }}>
                      {new Date(evento.date).getDate()}
                    </div>
                    <div style={{ fontSize: '10px', color: passado ? '#a0aec0' : 'var(--primary)', textTransform: 'uppercase' }}>
                      {new Date(evento.date).toLocaleDateString('pt-BR', { month: 'short' })}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a2e' }}>{evento.title}</span>
                      {passado
                        ? <span className="badge-gray">Encerrado</span>
                        : <span className="badge-green">Próximo</span>
                      }
                      {evento.targetGroup && <span className="badge-blue">{evento.targetGroup}</span>}
                    </div>
                    <div style={{ fontSize: '13px', color: '#718096' }}>{dataFormatada}</div>
                    {evento.location && <div style={{ fontSize: '13px', color: '#a0aec0' }}>📍 {evento.location}</div>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e' }}>
                      {evento._count.attendees}
                    </span>
                    <span style={{ fontSize: '11px', color: '#a0aec0' }}>confirmados</span>
                    <Link href={`/${slug}/eventos/${evento.id}`} className="btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }}>
                      Gerenciar
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
