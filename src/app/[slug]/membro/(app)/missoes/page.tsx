import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

interface Props { params: Promise<{ slug: string }> }

export default async function MembroMissoesPage({ params }: Props) {
  const { slug } = await params
  const session = await getMembroSession()
  if (!session) redirect(`/${slug}/membro/login`)

  const now = new Date()

  const [ativas, encerradas] = await Promise.all([
    prisma.mission.findMany({
      where: { churchId: session.churchId, deliveryDate: { gte: now } },
      orderBy: { deliveryDate: 'asc' },
      include: {
        items: { include: { _count: { select: { donations: true } } } },
      },
    }),
    prisma.mission.findMany({
      where: { churchId: session.churchId, deliveryDate: { lt: now } },
      orderBy: { deliveryDate: 'desc' },
      take: 5,
      include: {
        items: { include: { _count: { select: { donations: true } } } },
      },
    }),
  ])

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Missões</h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
          {ativas.length} ativa{ativas.length !== 1 ? 's' : ''} · colabore com doações
        </p>
      </div>

      {ativas.length === 0 && encerradas.length === 0 ? (
        <div style={emptyBox}>
          <span style={{ fontSize: '40px' }}>🎁</span>
          <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Nenhuma missão cadastrada.
          </p>
        </div>
      ) : (
        <>
          {/* Ativas */}
          {ativas.length > 0 && (
            <section>
              <p style={sectionLabel}>ATIVAS ({ativas.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ativas.map(m => <MissaoCard key={m.id} missao={m} slug={slug} ativa />)}
              </div>
            </section>
          )}

          {/* Encerradas */}
          {encerradas.length > 0 && (
            <section>
              <p style={sectionLabel}>ENCERRADAS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {encerradas.map(m => <MissaoCard key={m.id} missao={m} slug={slug} ativa={false} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function MissaoCard({
  missao, slug, ativa,
}: {
  missao: {
    id: string
    title: string
    description: string | null
    deliveryDate: Date
    items: { quantity: number; committed: number; _count: { donations: number } }[]
  }
  slug: string
  ativa: boolean
}) {
  const totalQtd  = missao.items.reduce((s, i) => s + i.quantity, 0)
  const committed = missao.items.reduce((s, i) => s + i.committed, 0)
  const pct       = totalQtd > 0 ? Math.min(Math.round((committed / totalQtd) * 100), 100) : 0
  const faltam    = totalQtd - committed

  const entrega = new Date(missao.deliveryDate).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long',
  })

  const diasRestantes = Math.ceil(
    (new Date(missao.deliveryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const urgente = ativa && diasRestantes <= 7

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      border: `1px solid ${urgente ? '#fed7aa' : '#f1f5f9'}`,
      padding: '16px', opacity: ativa ? 1 : 0.65,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
            {missao.title}
          </h2>
          {missao.description && (
            <p style={{
              margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.4,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {missao.description}
            </p>
          )}
        </div>
        {urgente && (
          <span style={{
            marginLeft: '10px', flexShrink: 0,
            fontSize: '10px', fontWeight: '700', padding: '3px 8px',
            borderRadius: '20px', background: '#fff7ed', color: '#c2410c',
          }}>
            🔥 {diasRestantes}d
          </span>
        )}
      </div>

      {/* Progresso */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {committed} de {totalQtd} itens comprometidos
          </span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: pct === 100 ? '#16a34a' : '#3b82f6' }}>
            {pct}%
          </span>
        </div>
        <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '8px' }}>
          <div style={{
            height: '8px', borderRadius: '99px',
            width: `${pct}%`,
            background: pct === 100 ? '#22c55e' : '#3b82f6',
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Info linha */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <span style={infoTag}>📅 Entrega: {entrega}</span>
        {ativa && faltam > 0 && (
          <span style={infoTag}>📦 Faltam: {faltam} iten{faltam !== 1 ? 's' : ''}</span>
        )}
        {pct === 100 && (
          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>✓ Meta atingida!</span>
        )}
      </div>

      {/* Botão */}
      {ativa && pct < 100 && (
        <Link
          href={`/${slug}/missao/${missao.id}`}
          style={{
            display: 'block', textAlign: 'center', padding: '11px',
            borderRadius: '12px', background: '#3b82f6', color: 'white',
            textDecoration: 'none', fontSize: '14px', fontWeight: '600',
          }}
        >
          🎁 Quero colaborar
        </Link>
      )}
      {ativa && pct === 100 && (
        <div style={{
          textAlign: 'center', padding: '11px', borderRadius: '12px',
          background: '#f0fdf4', color: '#16a34a', fontSize: '14px', fontWeight: '600',
        }}>
          ✓ Meta atingida — obrigado!
        </div>
      )}
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
