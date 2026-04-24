import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import MissaoActions from './MissaoActions'
import BeneficiarioActions from './BeneficiarioActions'

export const metadata = { title: 'Missões' }


interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ busca?: string; buscaBenef?: string; status?: string }>
}

export default async function MissoesPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { busca, buscaBenef, status } = await searchParams

  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const missoes = await prisma.mission.findMany({
    where: {
      churchId: church.id,
      ...(busca ? { title: { contains: busca } } : {}),
    },
    include: { items: { include: { donations: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const missoesFiltradas = status === 'concluida'
    ? missoes.filter(m => {
        const total = m.items.reduce((acc, i) => acc + i.quantity, 0)
        const comprometido = m.items.reduce((acc, i) => acc + i.committed, 0)
        return total > 0 && comprometido >= total
      })
    : status === 'andamento'
    ? missoes.filter(m => {
        const total = m.items.reduce((acc, i) => acc + i.quantity, 0)
        const comprometido = m.items.reduce((acc, i) => acc + i.committed, 0)
        return total === 0 || comprometido < total
      })
    : missoes

  const beneficiarios = await prisma.beneficiary.findMany({
    where: {
      churchId: church.id,
      ...(buscaBenef ? { name: { contains: buscaBenef } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/dashboard`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Painel</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Missões e ações sociais</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/${slug}/missoes/beneficiarios/novo`} className="btn-secondary">
            + Beneficiário
          </Link>
          <Link href={`/${slug}/missoes/nova`} className="btn-primary">
            + Nova campanha
          </Link>
        </div>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Campanhas */}
        <div>
          <p style={{ fontWeight: '600', fontSize: '14px', color: '#4a5568', marginBottom: '12px' }}>
            Campanhas de doação
          </p>

          {/* Filtro campanhas */}
          <form method="GET" style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input name="busca" defaultValue={busca} placeholder="Buscar campanha..."
              style={{ flex: 1, minWidth: '180px' }} />
            <select name="status" defaultValue={status || 'todas'}>
              <option value="todas">Todas</option>
              <option value="andamento">Em andamento</option>
              <option value="concluida">Concluídas</option>
            </select>
            {buscaBenef && <input type="hidden" name="buscaBenef" value={buscaBenef} />}
            <button type="submit" className="btn-primary">Filtrar</button>
          </form>

          {missoesFiltradas.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '8px' }}>Nenhuma campanha encontrada</p>
              <Link href={`/${slug}/missoes/nova`} style={{ color: 'var(--primary)', fontSize: '14px' }}>
                Criar primeira campanha
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {missoesFiltradas.map((m) => {
                const totalComprometidos = m.items.reduce((acc, i) => acc + i.committed, 0)
                const totalNecessario = m.items.reduce((acc, i) => acc + i.quantity, 0)
                const progresso = totalNecessario > 0
                  ? Math.round((totalComprometidos / totalNecessario) * 100) : 0

                return (
                  <div key={m.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <p style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '15px' }}>{m.title}</p>
                        <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '2px' }}>
                          Entrega: {new Date(m.deliveryDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={progresso >= 100 ? 'badge-green' : 'badge-yellow'}>
                        {progresso}% comprometido
                      </span>
                    </div>

                    <div style={{ width: '100%', background: '#edf2f7', borderRadius: '9999px', height: '6px', marginBottom: '12px' }}>
                      <div style={{
                        width: `${Math.min(progresso, 100)}%`, background: 'var(--primary)',
                        height: '6px', borderRadius: '9999px', transition: 'width 0.3s',
                      }} />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {m.items.map((item) => (
                        <div key={item.id} className="badge-gray">
                          {item.name} <span style={{ color: '#a0aec0' }}>{item.committed}/{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <MissaoActions slug={slug} missaoId={m.id} titulo={m.title} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Beneficiários */}
        <div>
          <p style={{ fontWeight: '600', fontSize: '14px', color: '#4a5568', marginBottom: '12px' }}>
            Beneficiários ({beneficiarios.length})
          </p>

          {/* Filtro beneficiários */}
          <form method="GET" style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input name="buscaBenef" defaultValue={buscaBenef} placeholder="Buscar beneficiário..."
              style={{ flex: 1, minWidth: '180px' }} />
            {busca && <input type="hidden" name="busca" value={busca} />}
            {status && <input type="hidden" name="status" value={status} />}
            <button type="submit" className="btn-primary">Filtrar</button>
          </form>

          {beneficiarios.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '8px' }}>Nenhum beneficiário encontrado</p>
              <Link href={`/${slug}/missoes/beneficiarios/novo`} style={{ color: 'var(--primary)', fontSize: '14px' }}>
                Cadastrar beneficiário
              </Link>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Família</th>
                    <th>Desde</th>
                    <th>Tempo</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiarios.map((b) => {
                    const mesesAtivo = Math.floor(
                      (Date.now() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
                    )
                    return (
                      <tr key={b.id}>
                        <td style={{ fontWeight: '500' }}>{b.name}</td>
                        <td>{b.familySize} pessoas</td>
                        <td>{new Date(b.startDate).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <span className={mesesAtivo >= 2 ? 'badge-red' : 'badge-green'}>
                            {mesesAtivo}m
                          </span>
                        </td>
                        <td>
                          <span className={b.active ? 'badge-green' : 'badge-gray'}>
                            {b.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          <BeneficiarioActions slug={slug} beneficiarioId={b.id} nome={b.name} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
