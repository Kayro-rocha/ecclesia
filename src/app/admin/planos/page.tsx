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
  igrejaPlan: number; redePlan: number; newChurches30d: number
  mrr: number; growthChart: { label: string; count: number }[]
}

interface MrrPoint {
  label: string; month: number; year: number
  mrr: number; activeChurches: number; igrejaPlan: number; redePlan: number
  newChurches: number; churnedChurches: number
}

export default function AdminPlanosPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [churches, setChurches] = useState<ChurchItem[]>([])
  const [mrrHistory, setMrrHistory] = useState<MrrPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'IGREJA' | 'REDE'>('IGREJA')
  const [mrrView, setMrrView] = useState<'mrr' | 'clientes' | 'churn'>('mrr')

  useEffect(() => {
    async function load() {
      const [sRes, cRes, mRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/churches'),
        fetch('/api/admin/mrr'),
      ])
      if (sRes.status === 401) { router.push('/admin/login'); return }
      const [sData, cData, mData] = await Promise.all([sRes.json(), cRes.json(), mRes.json()])
      setStats(sData)
      setChurches(cData.churches ?? [])
      setMrrHistory(Array.isArray(mData) ? mData : [])
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

  // Calcula variação MRR mês a mês
  const lastTwo = mrrHistory.slice(-2)
  const mrrDelta = lastTwo.length === 2 ? lastTwo[1].mrr - lastTwo[0].mrr : 0
  const mrrDeltaPct = lastTwo.length === 2 && lastTwo[0].mrr > 0
    ? ((mrrDelta / lastTwo[0].mrr) * 100).toFixed(1)
    : null

  // Dados do gráfico conforme view selecionada
  const chartData = mrrHistory.map(p => ({
    label: p.label,
    value: mrrView === 'mrr' ? p.mrr : mrrView === 'clientes' ? p.activeChurches : p.churnedChurches,
  }))
  const maxChart = Math.max(...chartData.map(d => d.value), 1)

  const chartColor = mrrView === 'mrr' ? '#4ade80' : mrrView === 'clientes' ? '#3b82f6' : '#f87171'

  // Total de churn no histórico
  const totalChurned = mrrHistory.reduce((s, p) => s + p.churnedChurches, 0)
  const churnRate = stats.activeChurches > 0 ? ((totalChurned / (stats.activeChurches + totalChurned)) * 100).toFixed(1) : '0'

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>Planos & Faturamento</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Visão financeira da plataforma</p>
      </div>

      {/* Métricas principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          {
            label: 'MRR', color: '#4ade80',
            value: `R$ ${mrr.toLocaleString('pt-BR')}`,
            sub: mrrDeltaPct
              ? `${mrrDelta >= 0 ? '▲' : '▼'} ${Math.abs(Number(mrrDeltaPct))}% vs mês anterior`
              : 'Receita mensal recorrente',
            subColor: mrrDelta >= 0 ? '#4ade80' : '#f87171',
          },
          { label: 'ARR', value: `R$ ${arr.toLocaleString('pt-BR')}`, sub: 'Projeção anual', color: '#a78bfa', subColor: undefined },
          { label: 'Ticket médio', value: `R$ ${avgTicket}`, sub: `${stats.activeChurches} igrejas ativas`, color: '#f59e0b', subColor: undefined },
          { label: 'Churn total', value: `${totalChurned}`, sub: `~${churnRate}% da base`, color: '#f87171', subColor: undefined },
        ].map(s => (
          <div key={s.label} className="admin-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px', fontWeight: '500' }}>{s.label}</p>
            <p style={{ fontSize: '26px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: s.subColor ?? '#475569', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfico histórico MRR */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: 0 }}>Histórico — últimos 12 meses</h2>
          <div style={{ display: 'flex', gap: '4px' }}>
            {([
              { key: 'mrr', label: 'MRR (R$)' },
              { key: 'clientes', label: 'Clientes' },
              { key: 'churn', label: 'Churn' },
            ] as const).map(v => (
              <button
                key={v.key}
                onClick={() => setMrrView(v.key)}
                className="admin-btn"
                style={{
                  fontSize: '11px', padding: '4px 12px',
                  background: mrrView === v.key ? chartColor : 'transparent',
                  border: `1px solid ${mrrView === v.key ? chartColor : '#334155'}`,
                  color: mrrView === v.key ? '#0f172a' : '#64748b',
                  fontWeight: mrrView === v.key ? '700' : '400',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px' }}>
          {chartData.map((d, i) => {
            const h = maxChart > 0 ? Math.max((d.value / maxChart) * 100, 2) : 2
            const isCurrent = i === chartData.length - 1
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '10px', color: '#64748b' }}>
                  {mrrView === 'mrr' && d.value > 0 ? `R$${(d.value / 1000).toFixed(1)}k` : d.value || ''}
                </span>
                <div
                  title={mrrView === 'mrr' ? `R$ ${d.value.toLocaleString('pt-BR')}` : String(d.value)}
                  style={{
                    width: '100%', height: `${h}%`, minHeight: '3px', borderRadius: '4px 4px 0 0',
                    background: isCurrent ? chartColor : `${chartColor}80`,
                    border: isCurrent ? `1px solid ${chartColor}` : 'none',
                    transition: 'height 0.3s',
                  }}
                />
                <span style={{ fontSize: '9px', color: isCurrent ? '#94a3b8' : '#475569', whiteSpace: 'nowrap' }}>{d.label}</span>
              </div>
            )
          })}
        </div>

        {/* Tabela resumo embaixo do gráfico */}
        <div style={{ marginTop: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                {['Mês', 'MRR', 'Clientes', 'Igreja', 'Rede', 'Novos', 'Churn'].map(h => (
                  <th key={h} style={{ textAlign: 'right', color: '#475569', fontWeight: '500', padding: '6px 8px', borderBottom: '1px solid #1e293b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mrrHistory.slice().reverse().map((p, i) => {
                const prev = mrrHistory[mrrHistory.length - 2 - i]
                const delta = prev ? p.mrr - prev.mrr : 0
                const isCurrent = i === 0
                return (
                  <tr key={`${p.year}-${p.month}`} style={{ background: isCurrent ? 'rgba(74,222,128,0.04)' : undefined }}>
                    <td style={{ color: isCurrent ? '#e2e8f0' : '#64748b', padding: '6px 8px', textAlign: 'right', fontWeight: isCurrent ? '600' : '400' }}>{p.label}</td>
                    <td style={{ color: '#4ade80', padding: '6px 8px', textAlign: 'right' }}>
                      R$ {p.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      {delta !== 0 && <span style={{ marginLeft: '4px', fontSize: '10px', color: delta > 0 ? '#4ade80' : '#f87171' }}>({delta > 0 ? '+' : ''}{delta.toLocaleString('pt-BR', { minimumFractionDigits: 0 })})</span>}
                    </td>
                    <td style={{ color: '#94a3b8', padding: '6px 8px', textAlign: 'right' }}>{p.activeChurches}</td>
                    <td style={{ color: '#60a5fa', padding: '6px 8px', textAlign: 'right' }}>{p.igrejaPlan}</td>
                    <td style={{ color: '#a78bfa', padding: '6px 8px', textAlign: 'right' }}>{p.redePlan}</td>
                    <td style={{ color: '#4ade80', padding: '6px 8px', textAlign: 'right' }}>+{p.newChurches}</td>
                    <td style={{ color: p.churnedChurches > 0 ? '#f87171' : '#334155', padding: '6px 8px', textAlign: 'right' }}>{p.churnedChurches > 0 ? `-${p.churnedChurches}` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Breakdown de planos */}
        <div className="admin-card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: '0 0 20px' }}>Breakdown por plano</h2>
          {[
            { label: 'IGREJA', count: stats.igrejaPlan, price: 79.9, color: '#3b82f6' },
            { label: 'REDE', count: stats.redePlan, price: 199.9, color: '#a78bfa' },
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

        {/* Crescimento de cadastros */}
        <div className="admin-card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: '0 0 20px' }}>Novos cadastros (últimos 6 meses)</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
            {mrrHistory.slice(-6).map((p, i) => {
              const maxNew = Math.max(...mrrHistory.slice(-6).map(x => x.newChurches), 1)
              const h = Math.max((p.newChurches / maxNew) * 100, 4)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{p.newChurches || ''}</span>
                  <div style={{ width: '100%', height: `${h}%`, background: '#3b82f6', borderRadius: '4px 4px 0 0', minHeight: '4px' }} />
                  <span style={{ fontSize: '10px', color: '#475569', whiteSpace: 'nowrap' }}>{p.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lista de igrejas por plano */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
          {(['IGREJA', 'REDE'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '14px 24px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', background: 'transparent', color: activeTab === tab ? 'white' : '#64748b', borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent' }}>
              {tab} ({tab === 'REDE' ? stats.redePlan : stats.igrejaPlan})
            </button>
          ))}
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Igreja</th><th>Membros</th><th>Fatura mensal</th><th>Cadastro</th><th></th>
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
                <td style={{ color: '#4ade80', fontWeight: '600' }}>R$ {c.plan === 'REDE' ? '199,90' : '79,90'}</td>
                <td style={{ color: '#64748b', fontSize: '12px' }}>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                <td><Link href={`/admin/igrejas/${c.id}`} className="admin-btn admin-btn-ghost" style={{ fontSize: '12px', padding: '4px 10px' }}>Ver</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
