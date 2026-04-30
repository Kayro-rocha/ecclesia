import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Building2, CheckCircle2, DollarSign, Users } from 'lucide-react'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'MASTER') redirect('/admin/login')

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Apenas sedes (sem parentChurchId) para métricas financeiras
  const SEDE = { parentChurchId: null }

  const [
    totalChurches, totalFiliais,
    activeSedesCount, inactiveSedesCount,
    igrejaPlan, redePlan,
    newSedesCount,
    totalMembers, totalUsers,
    recentChurches,
  ] = await Promise.all([
    prisma.church.count({ where: SEDE }),
    prisma.church.count({ where: { parentChurchId: { not: null } } }),
    prisma.church.count({ where: { ...SEDE, active: true } }),
    prisma.church.count({ where: { ...SEDE, active: false } }),
    prisma.church.count({ where: { ...SEDE, plan: 'IGREJA', active: true } }),
    prisma.church.count({ where: { ...SEDE, plan: 'REDE', active: true } }),
    prisma.church.count({ where: { ...SEDE, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.member.count({ where: { active: true } }),
    prisma.user.count(),
    prisma.church.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        _count: { select: { members: true } },
        parent: { select: { name: true, slug: true } },
      },
    }),
  ])

  const mrr = igrejaPlan * 79.9 + redePlan * 199.9
  const totalDisplay = totalChurches + totalFiliais

  const stats = [
    {
      label: 'Total de igrejas',
      value: totalDisplay,
      sub: totalFiliais > 0 ? `${newSedesCount} novas · ${totalFiliais} filial inclusa` : `${newSedesCount} nos últimos 30 dias`,
      color: '#3b82f6',
      icon: <Building2 size={22} color="#3b82f6" />,
    },
    {
      label: 'Ativas',
      value: activeSedesCount,
      sub: `${inactiveSedesCount} inativas · filiais não contam`,
      color: '#4ade80',
      icon: <CheckCircle2 size={22} color="#4ade80" />,
    },
    {
      label: 'MRR estimado',
      value: `R$ ${mrr.toLocaleString('pt-BR')}`,
      sub: `${igrejaPlan} Igreja · ${redePlan} Rede`,
      color: '#f59e0b',
      icon: <DollarSign size={22} color="#f59e0b" />,
    },
    {
      label: 'Total de membros',
      value: totalMembers.toLocaleString('pt-BR'),
      sub: `${totalUsers} usuários admin`,
      color: '#a78bfa',
      icon: <Users size={22} color="#a78bfa" />,
    },
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
              <span style={{ opacity: 0.9 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Planos + Financeiro */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div className="admin-card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: '0 0 4px' }}>Distribuição de planos</h2>
          <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 20px' }}>Apenas sedes · filiais incluídas no plano REDE</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'IGREJA', count: igrejaPlan, color: '#3b82f6', price: 79.9 },
              { label: 'REDE', count: redePlan, color: '#a78bfa', price: 199.9 },
            ].map(p => {
              const pct = activeSedesCount > 0 ? Math.round((p.count / activeSedesCount) * 100) : 0
              return (
                <div key={p.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>{p.label}</span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {p.count} {p.count === 1 ? 'sede' : 'sedes'} · R$ {(p.count * p.price).toLocaleString('pt-BR')}/mês
                    </span>
                  </div>
                  <div style={{ background: '#334155', borderRadius: '9999px', height: '6px' }}>
                    <div style={{ width: `${pct}%`, background: p.color, height: '6px', borderRadius: '9999px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              )
            })}
            {totalFiliais > 0 && (
              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#475569' }}>Filiais (incluídas no REDE)</span>
                  <span style={{ fontSize: '12px', color: '#475569' }}>{totalFiliais} · R$ 0/mês</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: '0 0 4px' }}>Resumo financeiro</h2>
          <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 20px' }}>Baseado em sedes ativas</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'MRR (estimado)', value: `R$ ${mrr.toLocaleString('pt-BR')}`, color: '#4ade80' },
              { label: 'ARR (estimado)', value: `R$ ${(mrr * 12).toLocaleString('pt-BR')}`, color: '#a78bfa' },
              { label: 'Ticket médio', value: activeSedesCount > 0 ? `R$ ${Math.round(mrr / activeSedesCount)}` : 'R$ 0', color: '#f59e0b' },
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
              <th>Plano / Tipo</th>
              <th>Membros</th>
              <th>Status</th>
              <th>Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {recentChurches.map(c => {
              const isFilial = !!c.parentChurchId
              return (
                <tr key={c.id}>
                  <td>
                    <div>
                      <Link href={`/admin/igrejas/${c.id}`} style={{ color: '#e2e8f0', textDecoration: 'none', fontWeight: '500' }}>
                        {c.name}
                      </Link>
                      {isFilial && c.parent && (
                        <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0' }}>
                          Filial de {c.parent.name}
                        </p>
                      )}
                    </div>
                  </td>
                  <td style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>{c.slug}</td>
                  <td>
                    {isFilial ? (
                      <span style={{ fontSize: '11px', background: '#1e293b', color: '#64748b', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #334155' }}>
                        Filial · inclusa
                      </span>
                    ) : (
                      <span className={`admin-badge ${c.plan === 'REDE' ? 'badge-rede' : 'badge-igreja'}`}>{c.plan}</span>
                    )}
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
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
