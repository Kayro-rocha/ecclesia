import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

interface Props { params: Promise<{ slug: string }> }

export default async function MembroEventosPage({ params }: Props) {
  const { slug } = await params
  const session = await getMembroSession()
  if (!session) redirect(`/${slug}/membro/login`)

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { group: true },
  })

  const now = new Date()

  const [proximos, anteriores] = await Promise.all([
    prisma.event.findMany({
      where: {
        churchId: session.churchId,
        date: { gte: now },
        OR: [
          { targetGroup: null },
          { targetGroup: '' },
          ...(member?.group ? [{ targetGroup: member.group }] : []),
        ],
      },
      orderBy: { date: 'asc' },
    }),
    prisma.event.findMany({
      where: {
        churchId: session.churchId,
        date: { lt: now },
        OR: [
          { targetGroup: null },
          { targetGroup: '' },
          ...(member?.group ? [{ targetGroup: member.group }] : []),
        ],
      },
      orderBy: { date: 'desc' },
      take: 10,
    }),
  ])

  const total = proximos.length + anteriores.length

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Eventos</h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
          {proximos.length} próximo{proximos.length !== 1 ? 's' : ''} · {anteriores.length} anterior{anteriores.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {total === 0 ? (
        <div style={emptyBox}>
          <span style={{ fontSize: '40px' }}>🎉</span>
          <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Nenhum evento cadastrado.
          </p>
        </div>
      ) : (
        <>
          {/* Próximos */}
          {proximos.length > 0 && (
            <section>
              <p style={sectionLabel}>PRÓXIMOS ({proximos.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {proximos.map((e, i) => (
                  <EventoCard key={e.id} evento={e} destaque={i === 0} />
                ))}
              </div>
            </section>
          )}

          {/* Anteriores */}
          {anteriores.length > 0 && (
            <section>
              <p style={sectionLabel}>ANTERIORES</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {anteriores.map(e => (
                  <EventoCard key={e.id} evento={e} destaque={false} passado />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function EventoCard({
  evento,
  destaque,
  passado,
}: {
  evento: {
    id: string
    title: string
    description: string | null
    date: Date
    location: string | null
    targetGroup: string | null
    imageUrl: string | null
  }
  destaque: boolean
  passado?: boolean
}) {
  const date = new Date(evento.date)
  const isGeral = !evento.targetGroup

  const diaSemana = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  const dia       = date.toLocaleDateString('pt-BR', { day: '2-digit' })
  const mes       = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const hora      = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      border: `1px solid ${destaque ? '#bfdbfe' : '#f1f5f9'}`,
      overflow: 'hidden', opacity: passado ? 0.65 : 1,
    }}>
      {/* Imagem */}
      {evento.imageUrl && (
        <img
          src={evento.imageUrl}
          alt={evento.title}
          style={{ width: '100%', height: '160px', objectFit: 'cover' }}
        />
      )}

      <div style={{ display: 'flex', gap: '0' }}>
        {/* Bloco de data */}
        <div style={{
          minWidth: '64px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '16px 12px',
          background: destaque ? '#eff6ff' : '#f8fafc',
          borderRight: '1px solid #f1f5f9',
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>
            {diaSemana}
          </span>
          <span style={{ fontSize: '28px', fontWeight: '800', color: destaque ? '#3b82f6' : '#1e293b', lineHeight: 1.1 }}>
            {dia}
          </span>
          <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
            {mes}
          </span>
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, padding: '14px 16px' }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {destaque && !passado && (
              <span style={badgeStyle('#dbeafe', '#2563eb')}>EM BREVE</span>
            )}
            <span style={badgeStyle(isGeral ? '#f0fdf4' : '#faf5ff', isGeral ? '#16a34a' : '#9333ea')}>
              {isGeral ? '🌐 Todos' : `👥 ${evento.targetGroup}`}
            </span>
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
            {evento.title}
          </h2>

          {evento.description && (
            <p style={{
              margin: '0 0 8px', fontSize: '13px', color: '#64748b',
              lineHeight: 1.5, overflow: 'hidden',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {evento.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={infoTag}>🕐 {hora}</span>
            {evento.location && (
              <span style={infoTag}>📍 {evento.location}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  margin: '0 0 10px', fontSize: '11px', fontWeight: '700',
  color: '#94a3b8', letterSpacing: '0.5px',
}

const emptyBox: React.CSSProperties = {
  padding: '60px 20px', textAlign: 'center',
  background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9',
}

const infoTag: React.CSSProperties = {
  fontSize: '12px', color: '#64748b',
}

function badgeStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-block', fontSize: '10px', fontWeight: '700',
    padding: '2px 8px', borderRadius: '20px', background: bg, color,
  }
}
