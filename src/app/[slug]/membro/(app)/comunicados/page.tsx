import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'

interface Props { params: Promise<{ slug: string }> }

export default async function MembroComunicadosPage({ params }: Props) {
  const { slug } = await params
  const session = await getMembroSession()
  if (!session) redirect(`/${slug}/membro/login`)

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { group: true },
  })

  // Busca comunicados gerais + os do grupo do membro
  const comunicados = await prisma.announcement.findMany({
    where: {
      churchId: session.churchId,
      OR: [
        { targetGroup: null },
        { targetGroup: '' },
        ...(member?.group ? [{ targetGroup: member.group }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Comunicados</h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
          {comunicados.length} aviso{comunicados.length !== 1 ? 's' : ''}
          {member?.group ? ` · ${member.group} + Todos` : ''}
        </p>
      </div>

      {comunicados.length === 0 ? (
        <div style={emptyBox}>
          <span style={{ fontSize: '40px' }}>📢</span>
          <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Nenhum comunicado por enquanto.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comunicados.map((c, i) => {
            const isGeral = !c.targetGroup
            const dataStr = new Date(c.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })
            const isNew = i === 0

            return (
              <div key={c.id} style={{
                background: 'white', borderRadius: '16px',
                border: `1px solid ${isNew ? '#bfdbfe' : '#f1f5f9'}`,
                overflow: 'hidden',
              }}>
                {/* Imagem */}
                {c.imageUrl && (
                  <img
                    src={c.imageUrl}
                    alt={c.title}
                    style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                  />
                )}

                <div style={{ padding: '16px' }}>
                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {isNew && (
                      <span style={badge('#eff6ff', '#3b82f6')}>NOVO</span>
                    )}
                    <span style={badge(isGeral ? '#f0fdf4' : '#faf5ff', isGeral ? '#16a34a' : '#9333ea')}>
                      {isGeral ? '🌐 Todos' : `👥 ${c.targetGroup}`}
                    </span>
                  </div>

                  {/* Título */}
                  <h2 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                    {c.title}
                  </h2>

                  {/* Corpo */}
                  <p style={{
                    margin: '0 0 12px', fontSize: '14px', color: '#475569',
                    lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  }}>
                    {c.body}
                  </p>

                  {/* Data */}
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                    📅 {dataStr}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const emptyBox: React.CSSProperties = {
  padding: '60px 20px', textAlign: 'center',
  background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9',
}

function badge(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-block', fontSize: '10px', fontWeight: '700',
    padding: '2px 8px', borderRadius: '20px',
    background: bg, color, letterSpacing: '0.3px',
  }
}
