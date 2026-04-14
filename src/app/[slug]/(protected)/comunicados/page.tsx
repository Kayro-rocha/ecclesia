import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ComunicadoActions from './ComunicadoActions'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ status?: string; busca?: string }>
}

export default async function ComunicadosPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { status, busca } = await searchParams

  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const comunicados = await prisma.announcement.findMany({
    where: {
      churchId: church.id,
      ...(busca ? { title: { contains: busca } } : {}),
      ...(status === 'enviado' ? { sentAt: { not: null } } : {}),
      ...(status === 'rascunho' ? { sentAt: null } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/dashboard`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Painel</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Comunicados</span>
        </div>
        <Link href={`/${slug}/comunicados/novo`} className="btn-primary">
          + Novo comunicado
        </Link>
      </div>

      <div className="page-content">
        {/* Filtros */}
        <form method="GET" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input name="busca" defaultValue={busca}
            placeholder="Buscar por título..."
            style={{ flex: 1, minWidth: '200px' }} />
          <select name="status" defaultValue={status || 'todos'}>
            <option value="todos">Todos</option>
            <option value="enviado">Enviados</option>
            <option value="rascunho">Rascunhos</option>
          </select>
          <button type="submit" className="btn-primary">Filtrar</button>
        </form>

        {comunicados.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '8px' }}>Nenhum comunicado encontrado</p>
            <Link href={`/${slug}/comunicados/novo`} style={{ color: 'var(--primary)', fontSize: '14px' }}>
              Criar primeiro comunicado
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {comunicados.map((c) => (
              <div key={c.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '15px' }}>{c.title}</p>
                    <p style={{ fontSize: '13px', color: '#718096', marginTop: '4px',
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const }}>
                      {c.body}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {c.sentAt ? (
                      <span className="badge-green">Enviado</span>
                    ) : (
                      <span className="badge-yellow">Rascunho</span>
                    )}
                    <p style={{ fontSize: '11px', color: '#cbd5e0', marginTop: '4px' }}>
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                {c.sentAt && (
                  <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '8px' }}>
                    Enviado para {c.recipientCount} membros · {new Date(c.sentAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
                <ComunicadoActions slug={slug} comunicadoId={c.id} foiEnviado={!!c.sentAt} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
