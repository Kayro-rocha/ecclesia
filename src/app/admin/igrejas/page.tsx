'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useModal } from '@/lib/useModal'

interface Church {
  id: string; name: string; slug: string; plan: string; active: boolean
  createdAt: string; pixKey: string | null; whatsappInstance: string | null
  parentChurchId: string | null
  parent: { id: string; name: string; slug: string } | null
  filiais: { id: string; name: string; slug: string; active: boolean }[]
  _count: { members: number; events: number; tithes: number }
}

const PAGE_SIZE = 20

export default function AdminIgrejasPage() {
  const router = useRouter()
  const { confirm, alert: showAlert, modalNode } = useModal()
  const [churches, setChurches] = useState<Church[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('')
  const [status, setStatus] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', slug: '', plan: 'IGREJA' })
  const [creating, setCreating] = useState(false)

  // Seleção em lote
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  async function load(p = page) {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (plan) params.set('plan', plan)
    if (status) params.set('status', status)
    params.set('page', String(p))
    const res = await fetch(`/api/admin/churches?${params}`)
    if (res.status === 401) { router.push('/admin/login'); return }
    const data = await res.json()
    setChurches(data.churches ?? [])
    setTotal(data.total ?? 0)
    setTotalPages(data.totalPages ?? 1)
    setSelected(new Set())
    setLoading(false)
  }

  useEffect(() => { setPage(1); load(1) }, [search, plan, status])
  useEffect(() => { load(page) }, [page])

  async function handleCreate() {
    if (!newForm.name || !newForm.slug) return
    setCreating(true)
    const res = await fetch('/api/admin/churches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    })
    if (res.ok) { setShowNew(false); setNewForm({ name: '', slug: '', plan: 'IGREJA' }); load(page) }
    else { const d = await res.json(); await showAlert(d.error || 'Erro') }
    setCreating(false)
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/churches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    load(page)
  }

  async function bulkAction(active: boolean) {
    if (selected.size === 0) return
    const label = active ? 'reativar' : 'suspender'
    if (!await confirm(`${active ? 'Reativar' : 'Suspender'} ${selected.size} igreja(s)?`)) return
    setBulkLoading(true)
    await fetch('/api/admin/churches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected), active }),
    })
    setBulkLoading(false)
    load(page)
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === churches.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(churches.map(c => c.id)))
    }
  }

  // Agrupa: sedes REDE aparecem com suas filiais logo abaixo
  function groupedChurches(list: Church[]): { church: Church; isFilial: boolean }[] {
    const result: { church: Church; isFilial: boolean }[] = []
    const filialIds = new Set(list.filter(c => c.parentChurchId).map(c => c.id))
    for (const c of list) {
      if (filialIds.has(c.id)) continue // filiais serão inseridas após a sede
      result.push({ church: c, isFilial: false })
      if (c.plan === 'REDE' && c.filiais.length > 0) {
        const filiaisNaPagina = list.filter(f => f.parentChurchId === c.id)
        filiaisNaPagina.forEach(f => result.push({ church: f, isFilial: true }))
      }
    }
    // filiais cujas sedes não estão nesta página: adicionar ao final normalmente
    list.filter(c => c.parentChurchId && !result.find(r => r.church.id === c.id))
      .forEach(c => result.push({ church: c, isFilial: true }))
    return result
  }

  const allSelected = churches.length > 0 && selected.size === churches.length
  const someSelected = selected.size > 0 && !allSelected
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>Igrejas</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            {loading ? 'Carregando...' : `${total} encontradas`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              const params = new URLSearchParams()
              if (search) params.set('search', search)
              if (plan) params.set('plan', plan)
              if (status) params.set('status', status)
              params.set('format', 'csv')
              window.location.href = `/api/admin/churches?${params}`
            }}
            className="admin-btn admin-btn-ghost"
          >
            ↓ Exportar CSV
          </button>
          <button onClick={() => setShowNew(true)} className="admin-btn admin-btn-primary">+ Nova igreja</button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
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

      {/* Barra de ações em lote */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: '#1e3a5f', border: '1px solid #2563eb',
          borderRadius: '10px', padding: '10px 16px', marginBottom: '16px',
        }}>
          <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: '600' }}>
            {selected.size} {selected.size === 1 ? 'igreja selecionada' : 'igrejas selecionadas'}
          </span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              onClick={() => bulkAction(true)}
              disabled={bulkLoading}
              className="admin-btn admin-btn-success"
              style={{ fontSize: '12px', opacity: bulkLoading ? 0.6 : 1 }}
            >
              ✓ Reativar todas
            </button>
            <button
              onClick={() => bulkAction(false)}
              disabled={bulkLoading}
              className="admin-btn admin-btn-danger"
              style={{ fontSize: '12px', opacity: bulkLoading ? 0.6 : 1 }}
            >
              ✕ Suspender todas
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="admin-btn admin-btn-ghost"
              style={{ fontSize: '12px' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

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
                {newForm.slug && <p style={{ fontSize: '11px', color: '#475569', margin: '4px 0 0' }}>{newForm.slug}.ecclesiaa.com</p>}
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
                <th style={{ width: '40px', paddingLeft: '16px' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected }}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
                  />
                </th>
                <th>Igreja</th>
                <th>Plano / Tipo</th>
                <th>Rede</th>
                <th>Membros</th>
                <th>PIX</th>
                <th>WhatsApp</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {churches.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: '#475569', padding: '40px' }}>Nenhuma igreja encontrada</td></tr>
              ) : groupedChurches(churches).map(({ church: c, isFilial }) => (
                <tr key={c.id} style={{
                  background: selected.has(c.id)
                    ? 'rgba(37,99,235,0.08)'
                    : isFilial ? 'rgba(255,255,255,0.015)' : undefined,
                  borderLeft: isFilial ? '3px solid #334155' : '3px solid transparent',
                }}>
                  <td style={{ paddingLeft: '16px' }}>
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
                    />
                  </td>
                  <td>
                    <div style={{ paddingLeft: isFilial ? '20px' : '0' }}>
                      {isFilial && <span style={{ color: '#334155', marginRight: '6px', fontSize: '14px' }}>↳</span>}
                      <Link href={`/admin/igrejas/${c.id}`} style={{ color: isFilial ? '#94a3b8' : 'white', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>{c.name}</Link>
                      <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0', fontFamily: 'monospace' }}>{c.slug}</p>
                    </div>
                  </td>
                  <td>
                    {isFilial ? (
                      <span style={{ fontSize: '11px', background: '#1e293b', color: '#64748b', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #334155' }}>Filial</span>
                    ) : (
                      <span className={`admin-badge ${c.plan === 'REDE' ? 'badge-rede' : 'badge-igreja'}`}>{c.plan}</span>
                    )}
                  </td>
                  <td>
                    {isFilial && c.parent ? (
                      <Link href={`/admin/igrejas/${c.parent.id}`} style={{ fontSize: '12px', color: '#a78bfa', textDecoration: 'none', fontWeight: '500' }}>
                        {c.parent.name}
                      </Link>
                    ) : c.plan === 'REDE' && c.filiais.length > 0 ? (
                      <span style={{ fontSize: '12px', color: '#475569' }}>
                        {c.filiais.length} {c.filiais.length === 1 ? 'filial' : 'filiais'}
                      </span>
                    ) : (
                      <span style={{ color: '#334155', fontSize: '12px' }}>—</span>
                    )}
                  </td>
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {from}–{to} de {total} igrejas
          </p>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setPage(1)} disabled={page === 1} className="admin-btn admin-btn-ghost"
              style={{ fontSize: '12px', padding: '5px 10px', opacity: page === 1 ? 0.4 : 1 }}>«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="admin-btn admin-btn-ghost"
              style={{ fontSize: '12px', padding: '5px 10px', opacity: page === 1 ? 0.4 : 1 }}>‹ Anterior</button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) => p === '...' ? (
                <span key={`e-${i}`} style={{ color: '#475569', padding: '5px 8px', fontSize: '13px' }}>…</span>
              ) : (
                <button key={p} onClick={() => setPage(p as number)} className="admin-btn"
                  style={{ fontSize: '12px', padding: '5px 10px', background: page === p ? '#3b82f6' : 'transparent', border: `1px solid ${page === p ? '#3b82f6' : '#334155'}`, color: page === p ? 'white' : '#94a3b8' }}>
                  {p}
                </button>
              ))}

            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="admin-btn admin-btn-ghost"
              style={{ fontSize: '12px', padding: '5px 10px', opacity: page === totalPages ? 0.4 : 1 }}>Próxima ›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="admin-btn admin-btn-ghost"
              style={{ fontSize: '12px', padding: '5px 10px', opacity: page === totalPages ? 0.4 : 1 }}>»</button>
          </div>
        </div>
      )}
      {modalNode}
    </div>
  )
}
