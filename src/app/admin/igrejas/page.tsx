'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Church {
  id: string; name: string; slug: string; plan: string; active: boolean
  createdAt: string; pixKey: string | null; whatsappInstance: string | null
  _count: { members: number; events: number; tithes: number }
}

export default function AdminIgrejasPage() {
  const router = useRouter()
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('')
  const [status, setStatus] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', slug: '', plan: 'IGREJA' })
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (plan) params.set('plan', plan)
    if (status) params.set('status', status)
    const res = await fetch(`/api/admin/churches?${params}`)
    if (res.status === 401) { router.push('/admin/login'); return }
    const data = await res.json()
    setChurches(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [search, plan, status])

  async function handleCreate() {
    if (!newForm.name || !newForm.slug) return
    setCreating(true)
    const res = await fetch('/api/admin/churches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    })
    if (res.ok) { setShowNew(false); setNewForm({ name: '', slug: '', plan: 'IGREJA' }); load() }
    else { const d = await res.json(); alert(d.error || 'Erro') }
    setCreating(false)
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/churches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    load()
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>Igrejas</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{churches.length} encontradas</p>
        </div>
        <button onClick={() => setShowNew(true)} className="admin-btn admin-btn-primary">+ Nova igreja</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          className="admin-input"
          placeholder="Buscar por nome ou slug..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select className="admin-input" value={plan} onChange={e => setPlan(e.target.value)}>
          <option value="">Todos os planos</option>
          <option value="IGREJA">Igreja</option>
          <option value="REDE">Rede</option>
        </select>
        <select className="admin-input" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="active">Ativas</option>
          <option value="inactive">Inativas</option>
        </select>
      </div>

      {/* Modal nova igreja */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '28px', width: '400px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: '0 0 20px' }}>Nova igreja</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Nome *</label>
                <input className="admin-input" value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Slug * (subdomínio)</label>
                <input className="admin-input" value={newForm.slug} onChange={e => setNewForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s/g, '-') }))} style={{ width: '100%', boxSizing: 'border-box' }} />
                {newForm.slug && <p style={{ fontSize: '11px', color: '#475569', margin: '4px 0 0' }}>{newForm.slug}.ecclesia.app</p>}
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Plano</label>
                <select className="admin-input" value={newForm.plan} onChange={e => setNewForm(p => ({ ...p, plan: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box' }}>
                  <option value="IGREJA">Igreja — R$ 79,90/mês</option>
                  <option value="REDE">Rede — R$ 199,90/mês</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowNew(false)} className="admin-btn admin-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleCreate} disabled={creating || !newForm.name || !newForm.slug} className="admin-btn admin-btn-primary" style={{ flex: 1, opacity: creating ? 0.7 : 1 }}>
                {creating ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Carregando...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Igreja</th>
                <th>Plano</th>
                <th>Membros</th>
                <th>PIX</th>
                <th>WhatsApp</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {churches.map(c => (
                <tr key={c.id}>
                  <td>
                    <div>
                      <Link href={`/admin/igrejas/${c.id}`} style={{ color: 'white', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>{c.name}</Link>
                      <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0', fontFamily: 'monospace' }}>{c.slug}</p>
                    </div>
                  </td>
                  <td><span className={`admin-badge ${c.plan === 'REDE' ? 'badge-rede' : 'badge-igreja'}`}>{c.plan}</span></td>
                  <td style={{ color: '#94a3b8' }}>{c._count.members}</td>
                  <td>{c.pixKey ? <span style={{ color: '#4ade80', fontSize: '12px' }}>✓</span> : <span style={{ color: '#475569', fontSize: '12px' }}>—</span>}</td>
                  <td>{c.whatsappInstance ? <span style={{ color: '#4ade80', fontSize: '12px' }}>✓</span> : <span style={{ color: '#475569', fontSize: '12px' }}>—</span>}</td>
                  <td><span className={`admin-badge ${c.active ? 'badge-active' : 'badge-inactive'}`}>{c.active ? 'Ativa' : 'Inativa'}</span></td>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link href={`/${c.slug}/dashboard`} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-success" style={{ fontSize: '12px', padding: '4px 10px' }}>Gerenciar</Link>
                      <Link href={`/admin/igrejas/${c.id}`} className="admin-btn admin-btn-ghost" style={{ fontSize: '12px', padding: '4px 10px' }}>Ver</Link>
                      <button onClick={() => toggleActive(c.id, c.active)} className={`admin-btn ${c.active ? 'admin-btn-danger' : 'admin-btn-ghost'}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                        {c.active ? 'Suspender' : 'Reativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
