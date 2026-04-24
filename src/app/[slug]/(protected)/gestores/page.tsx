'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const MODULES = [
  { key: 'membros',      label: 'Membros' },
  { key: 'celulas',      label: 'Células' },
  { key: 'dizimo',       label: 'Dízimo' },
  { key: 'financeiro',   label: 'Financeiro' },
  { key: 'escalas',      label: 'Escalas' },
  { key: 'frequencia',   label: 'Frequência' },
  { key: 'visitantes',   label: 'Visitantes' },
  { key: 'comunicados',  label: 'Comunicados' },
  { key: 'missoes',      label: 'Missões' },
  { key: 'eventos',      label: 'Eventos' },
  { key: 'oracoes',      label: 'Orações' },
]

interface Gestor {
  id: string
  name: string
  email: string
  permissions: string[]
  createdAt: string
}

export default function GestoresPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [gestores, setGestores] = useState<Gestor[]>([])
  const [members, setMembers] = useState<{ id: string; name: string; email: string | null }[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editingGestor, setEditingGestor] = useState<Gestor | null>(null)

  // Form
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchGestores = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/gestores?slug=${slug}`)
    const data = await res.json()
    setGestores(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [slug])

  const fetchMembers = useCallback(async () => {
    const res = await fetch(`/api/members?slug=${slug}`)
    const data = await res.json()
    setMembers(Array.isArray(data) ? data : [])
  }, [slug])

  useEffect(() => {
    fetchGestores()
    fetchMembers()
  }, [fetchGestores, fetchMembers])

  function openCreate() {
    setEditingGestor(null)
    setSelectedMemberId('')
    setName('')
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setSelectedModules([])
    setError('')
    setShowModal(true)
  }

  function openEdit(g: Gestor) {
    setEditingGestor(g)
    setSelectedMemberId('')
    setName(g.name)
    setEmail(g.email)
    setPassword('')
    setShowPassword(false)
    setSelectedModules([...g.permissions])
    setError('')
    setShowModal(true)
  }

  function onMemberSelect(memberId: string) {
    setSelectedMemberId(memberId)
    const m = members.find((m) => m.id === memberId)
    if (m) {
      setName(m.name)
      setEmail(m.email || '')
    }
  }

  function toggleModule(key: string) {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  function selectAll() { setSelectedModules(MODULES.map((m) => m.key)) }
  function clearAll() { setSelectedModules([]) }

  async function save() {
    setError('')
    if (!name || !email) { setError('Nome e e-mail são obrigatórios.'); return }
    if (!editingGestor && !password) { setError('Defina uma senha de acesso.'); return }
    if (selectedModules.length === 0) { setError('Selecione pelo menos um módulo.'); return }

    setSaving(true)
    try {
      if (editingGestor) {
        const res = await fetch(`/api/gestores/${editingGestor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, permissions: selectedModules, password: password || undefined }),
        })
        if (!res.ok) { const d = await res.json(); setError(d.error || 'Erro ao salvar'); setSaving(false); return }
      } else {
        const res = await fetch('/api/gestores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, name, email, password, permissions: selectedModules }),
        })
        if (!res.ok) { const d = await res.json(); setError(d.error || 'Erro ao salvar'); setSaving(false); return }
      }
      setShowModal(false)
      fetchGestores()
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string, gestorName: string) {
    if (!confirm(`Remover acesso de "${gestorName}"?`)) return
    await fetch(`/api/gestores/${id}?slug=${slug}`, { method: 'DELETE' })
    fetchGestores()
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/dashboard`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Painel</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Gestores</span>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Adicionar gestor</button>
      </div>

      <div className="page-content">
        <p style={{ color: '#718096', fontSize: '13px', marginBottom: '24px' }}>
          Gestores têm acesso ao painel com os módulos que você definir. Eles não podem criar outros gestores nem acessar configurações.
        </p>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ color: '#a0aec0' }}>Carregando...</p>
          </div>
        ) : gestores.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '8px' }}>Nenhum gestor cadastrado</p>
            <p style={{ color: '#cbd5e0', fontSize: '13px' }}>
              Adicione gestores para delegar o gerenciamento de módulos específicos
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gestores.map((g) => (
              <div key={g.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--primary-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', fontWeight: '700', fontSize: '16px', flexShrink: 0,
                }}>
                  {g.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px', fontSize: '14px' }}>{g.name}</p>
                  <p style={{ color: '#a0aec0', fontSize: '12px', margin: '0 0 8px' }}>{g.email}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {g.permissions.map((p) => (
                      <span key={p} className="badge-blue" style={{ fontSize: '11px' }}>
                        {MODULES.find((m) => m.key === p)?.label || p}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(g)}
                    style={{ background: 'none', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#718096', fontSize: '13px', padding: '6px 14px', borderRadius: '8px' }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remove(g.id, g.name)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fc8181', fontSize: '13px' }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{ background: 'white', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '640px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <p style={{ fontWeight: '700', fontSize: '16px', color: '#1a1a2e', margin: 0 }}>
                {editingGestor ? 'Editar gestor' : 'Novo gestor'}
              </p>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: '22px', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!editingGestor && (
                <div>
                  <label>Preencher a partir de um membro (opcional)</label>
                  <select value={selectedMemberId} onChange={(e) => onMemberSelect(e.target.value)}>
                    <option value="">— Selecione um membro —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}{m.email ? ` — ${m.email}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label>Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do gestor"
                  disabled={!!editingGestor}
                  style={editingGestor ? { background: '#f7fafc !important', color: '#a0aec0 !important' } : {}}
                />
              </div>

              <div>
                <label>E-mail de acesso</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  disabled={!!editingGestor}
                />
              </div>

              <div>
                <label>{editingGestor ? 'Nova senha (deixe em branco para manter)' : 'Senha de acesso'}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingGestor ? 'Nova senha (opcional)' : 'Mínimo 6 caracteres'}
                    style={{ paddingRight: '44px !important' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0',
                      fontSize: '12px', padding: 0, lineHeight: 1,
                    }}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              {/* Módulos */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ margin: 0 }}>Módulos que este gestor pode acessar</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={selectAll}
                      style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Todos
                    </button>
                    <span style={{ color: '#cbd5e0' }}>·</span>
                    <button
                      type="button"
                      onClick={clearAll}
                      style={{ fontSize: '12px', color: '#a0aec0', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Nenhum
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {MODULES.map((m) => {
                    const active = selectedModules.includes(m.key)
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => toggleModule(m.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '7px 14px', borderRadius: '20px', cursor: 'pointer',
                          border: `1.5px solid ${active ? 'var(--primary)' : '#e2e8f0'}`,
                          background: active ? 'var(--primary)' : 'white',
                          color: active ? 'white' : '#4a5568',
                          fontSize: '13px', fontWeight: active ? '600' : '400',
                          transition: 'all 0.15s', whiteSpace: 'nowrap',
                        }}
                      >
                        {active && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {m.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && (
                <p style={{ color: '#e53e3e', fontSize: '13px', margin: 0 }}>{error}</p>
              )}

              <button
                className="btn-primary"
                onClick={save}
                disabled={saving}
                style={{ marginTop: '4px' }}
              >
                {saving ? 'Salvando...' : editingGestor ? 'Salvar alterações' : 'Criar gestor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
