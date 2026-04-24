import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') redirect('/admin/login')

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalChurches, activeChurches, inactiveChurches,
    igrejaPlan, redePlan, newChurches30d,
    totalMembers, totalUsers,
    recentChurches,
  ] = await Promise.all([
    prisma.church.count(),
    prisma.church.count({ where: { active: true } }),
    prisma.church.count({ where: { active: false } }),
    prisma.church.count({ where: { plan: 'IGREJA', active: true } }),
    prisma.church.count({ where: { plan: 'REDE', active: true } }),
    prisma.church.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.member.count({ where: { active: true } }),
    prisma.user.count(),
    prisma.church.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { _count: { select: { members: true } } },
    }),
  ])

  const mrr = igrejaPlan * 79.9 + redePlan * 199.9

  const stats = [
    { label: 'Total de igrejas', value: totalChurches, sub: `${newChurches30d} nos últimos 30 dias`, color: '#3b82f6', icon: '⛪' },
    { label: 'Ativas', value: activeChurches, sub: `${inactiveChurches} inativas`, color: '#4ade80', icon: '✅' },
    { label: 'MRR estimado', value: `R$ ${mrr.toLocaleString('pt-BR')}`, sub: `${igrejaPlan} Igreja · ${redePlan} Rede`, color: '#f59e0b', icon: '💰' },
    { label: 'Total de membros', value: totalMembers.toLocaleString('pt-BR'), sub: `${totalUsers} usuários admin`, color: '#a78bfa', icon: '👥' },
  ]

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>Dashboard</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {stats.map(s => (
          <div key={s.label} className="admin-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px', fontWeight: '500' }}>{s.label}</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'white', margin: '0 0 6px' }}>{s.value}</p>
                <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>{s.sub}</p>
              </div>
              <span style={{ fontSize: '24px' }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Planos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div className="admin-card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: '0 0 20px' }}>Distribuição de planos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'IGREJA', count: igrejaPlan, color: '#3b82f6', price: 79.9 },
              { label: 'REDE', count: redePlan, color: '#a78bfa', price: 199.9 },
            ].map(p => {
              const pct = totalChurches > 0 ? Math.round((p.count / activeChurches) * 100) : 0
              return (
                <div key={p.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>{p.label}</span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{p.count} igrejas · R$ {(p.count * p.price).toLocaleString('pt-BR')}/mês</span>
                  </div>
                  <div style={{ background: '#334155', borderRadius: '9999px', height: '6px' }}>
                    <div style={{ width: `${pct}%`, background: p.color, height: '6px', borderRadius: '9999px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="admin-card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: '0 0 20px' }}>Resumo financeiro</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'MRR (estimado)', value: `R$ ${mrr.toLocaleString('pt-BR')}`, color: '#4ade80' },
              { label: 'ARR (estimado)', value: `R$ ${(mrr * 12).toLocaleString('pt-BR')}`, color: '#a78bfa' },
              { label: 'Ticket médio', value: activeChurches > 0 ? `R$ ${Math.round(mrr / activeChurches)}` : 'R$ 0', color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#0f172a', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.label}</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimas igrejas */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: 0 }}>Últimas igrejas cadastradas</h2>
          <Link href="/admin/igrejas" style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none' }}>Ver todas →</Link>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Igreja</th>
              <th>Slug</th>
              <th>Plano</th>
              <th>Membros</th>
              <th>Status</th>
              <th>Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {recentChurches.map(c => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/igrejas/${c.id}`} style={{ color: '#e2e8f0', textDecoration: 'none', fontWeight: '500' }}>
                    {c.name}
                  </Link>
                </td>
                <td style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>{c.slug}</td>
                <td>
                  <span className={`admin-badge ${c.plan === 'REDE' ? 'badge-rede' : 'badge-igreja'}`}>{c.plan}</span>
                </td>
                <td style={{ color: '#94a3b8' }}>{c._count.members}</td>
                <td>
                  <span className={`admin-badge ${c.active ? 'badge-active' : 'badge-inactive'}`}>
                    {c.active ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td style={{ color: '#64748b', fontSize: '13px' }}>
                  {c.createdAt.toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
