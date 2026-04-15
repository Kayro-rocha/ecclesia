'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ChurchItem {
  id: string; name: string; slug: string; plan: string; active: boolean; createdAt: string
  _count: { members: number }
}

interface Stats {
  totalChurches: number; activeChurches: number; inactiveChurches: number
  basicPlan: number; proPlan: number; newChurches30d: number
  mrr: number; growthChart: { label: string; count: number }[]
}

export default function AdminPlanosPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [churches, setChurches] = useState<ChurchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'BASIC' | 'PRO'>('PRO')

  useEffect(() => {
    async function load() {
      const [sRes, cRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/churches'),
      ])
      if (sRes.status === 401 || cRes.status === 401) { router.push('/admin/login'); return }
      const [sData, cData] = await Promise.all([sRes.json(), cRes.json()])
      setStats(sData)
      setChurches(Array.isArray(cData) ? cData : [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Carregando...</div>
  if (!stats) return null

  const mrr = stats.mrr
  const arr = mrr * 12
  const avgTicket = stats.activeChurches > 0 ? Math.round(mrr / stats.activeChurches) : 0
  const filteredChurches = churches.filter(c => c.plan === activeTab && c.active)

  const maxChart = Math.max(...stats.growthChart.map(g => g.count), 1)

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>Planos & Faturamento</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Visão financeira da plataforma</p>
      </div>

      {/* Métricas principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'MRR', value: `R$ ${mrr.toLocaleString('pt-BR')}`, sub: 'Receita mensal recorrente', color: '#4ade80' },
          { label: 'ARR', value: `R$ ${arr.toLocaleString('pt-BR')}`, sub: 'Projeção anual', color: '#a78bfa' },
          { label: 'Ticket médio', value: `R$ ${avgTicket}`, sub: `${stats.activeChurches} igrejas ativas`, color: '#f59e0b' },
          { label: 'Crescimento 30d', value: `+${stats.newChurches30d}`, sub: 'Novas igrejas', color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} className="admin-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px', fontWeight: '500' }}>{s.label}</p>
            <p style={{ fontSize: '26px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Breakdown de planos */}
        <div className="admin-card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: '0 0 20px' }}>Breakdown por plano</h2>
          {[
            { label: 'BASIC', count: stats.basicPlan, price: 97, color: '#3b82f6' },
            { label: 'PRO', count: stats.proPlan, price: 197, color: '#a78bfa' },
          ].map(p => {
            const revenue = p.count * p.price
            const pct = stats.activeChurches > 0 ? Math.round((p.count / stats.activeChurches) * 100) : 0
            return (
              <div key={p.label} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: '700' }}>{p.label}</span>
                    <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>R$ {p.price}/mês</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', color: p.color, fontWeight: '600' }}>R$ {revenue.toLocaleString('pt-BR')}/mês</span>
                    <span style={{ fontSize: '12px', color: '#475569', display: 'block' }}>{p.count} igrejas · {pct}%</span>
                  </div>
                </div>
                <div style={{ background: '#334155', borderRadius: '9999px', height: '8px' }}>
                  <div style={{ width: `${pct}%`, background: p.color, height: '8px', borderRadius: '9999px', transition: 'width 0.4s' }} />
                </div>
              </div>
            )
          })}

          <div style={{ marginTop: '16px', padding: '12px 16px', background: '#0f172a', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Total ativo</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#4ade80' }}>R$ {mrr.toLocaleString('pt-BR')}/mês</span>
            </div>
          </div>
        </div>

        {/* Gráfico de crescimento */}
        <div className="admin-card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: '0 0 20px' }}>Novos cadastros (últimos 6 meses)</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
            {stats.growthChart.map((g, i) => {
              const h = maxChart > 0 ? Math.max((g.count / maxChart) * 100, 4) : 4
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{g.count || ''}</span>
                  <div style={{ width: '100%', height: `${h}%`, background: '#3b82f6', borderRadius: '4px 4px 0 0', minHeight: '4px' }} />
                  <span style={{ fontSize: '10px', color: '#475569', whiteSpace: 'nowrap' }}>{g.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista de igrejas por plano */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
          {(['PRO', 'BASIC'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '14px 24px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                background: 'transparent',
                color: activeTab === tab ? 'white' : '#64748b',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              }}
            >
              {tab} ({tab === 'PRO' ? stats.proPlan : stats.basicPlan})
            </button>
          ))}
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Igreja</th>
              <th>Membros</th>
              <th>Fatura mensal</th>
              <th>Cadastro</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredChurches.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#475569', padding: '40px' }}>Nenhuma igreja neste plano</td></tr>
            ) : filteredChurches.map(c => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/igrejas/${c.id}`} style={{ color: 'white', textDecoration: 'none', fontWeight: '600' }}>{c.name}</Link>
                  <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0', fontFamily: 'monospace' }}>{c.slug}</p>
                </td>
                <td style={{ color: '#94a3b8' }}>{c._count.members}</td>
                <td style={{ color: '#4ade80', fontWeight: '600' }}>R$ {c.plan === 'PRO' ? '197' : '97'}</td>
                <td style={{ color: '#64748b', fontSize: '12px' }}>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                <td>
                  <Link href={`/admin/igrejas/${c.id}`} className="admin-btn admin-btn-ghost" style={{ fontSize: '12px', padding: '4px 10px' }}>Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
