'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, ExternalLink, ChevronDown, ChevronUp, Plus, Trash2, KeyRound, X, Calendar, TrendingUp } from 'lucide-react'
import { useModal } from '@/lib/useModal'

interface Filial {
  id: string
  name: string
  slug: string
  active: boolean
  _count: { members: number; tithes: number; events: number }
}

interface FilialStats {
  eventosMes: number
  dizimosMes: number
  lastActivity: string | null
}

interface FilialUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

function activityStatus(lastActivity: string | null): { label: string; color: string; bg: string } {
  if (!lastActivity) return { label: 'Sem atividade', color: '#a0aec0', bg: '#f7fafc' }
  const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 7)  return { label: 'Ativa', color: '#276749', bg: '#f0fff4' }
  if (days <= 30) return { label: `${days}d sem atividade`, color: '#c05621', bg: '#fffaf0' }
  return { label: `${days}d sem atividade`, color: '#c53030', bg: '#fff5f5' }
}

export default function FilialCard({ filial, index, sedeSlug, stats }: {
  filial: Filial
  index: number
  sedeSlug: string
  stats: FilialStats
}) {
  const { confirm, modalNode } = useModal()
  const [expanded, setExpanded] = useState(false)
  const [users, setUsers] = useState<FilialUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '' })
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [resetModal, setResetModal] = useState<FilialUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  async function loadUsers() {
    setLoadingUsers(true)
    const res = await fetch(`/api/filiais/${filial.id}/users`)
    if (res.ok) setUsers(await res.json())
    setLoadingUsers(false)
  }

  useEffect(() => {
    if (expanded) loadUsers()
  }, [expanded])

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)
    const res = await fetch(`/api/filiais/${filial.id}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    const data = await res.json()
    if (!res.ok) { setAddError(data.error || 'Erro'); setAddLoading(false); return }
    setAddForm({ name: '', email: '', password: '' })
    setShowAddForm(false)
    loadUsers()
    setAddLoading(false)
  }

  async function handleDelete(userId: string) {
    if (!await confirm('Remover este acesso da filial?', { title: 'Remover acesso', confirmText: 'Remover', variant: 'danger' })) return
    setDeleteLoading(userId)
    await fetch(`/api/filiais/${filial.id}/users?userId=${userId}`, { method: 'DELETE' })
    setUsers(u => u.filter(x => x.id !== userId))
    setDeleteLoading(null)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetModal) return
    setResetLoading(true)
    await fetch(`/api/filiais/${filial.id}/users?userId=${resetModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    setResetModal(null)
    setNewPassword('')
    setResetLoading(false)
  }

  const activity = activityStatus(stats.lastActivity)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header do card */}
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '42px', height: '42px', background: 'var(--primary-light)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', fontWeight: '700', fontSize: '16px', flexShrink: 0,
          }}>
            {index + 1}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>{filial.name}</p>
              <span style={{
                fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                background: activity.bg, color: activity.color,
              }}>
                {activity.label}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#a0aec0', margin: '2px 0 0', fontFamily: 'monospace' }}>{filial.slug}.ecclesiaa.com</p>
          </div>
        </div>

        {/* Mini-stats */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
          {[
            { label: 'membros', value: filial._count.members },
            { label: 'eventos/mês', value: stats.eventosMes },
            { label: 'dízimo/mês', value: `R$ ${stats.dizimosMes.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: '#a0aec0', margin: '2px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Link
            href={`/${filial.slug}/dashboard`}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '7px 12px' }}
          >
            <ExternalLink size={13} />
            Acessar
          </Link>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: '#718096', display: 'flex', alignItems: 'center' }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Painel expandido */}
      {expanded && (
        <div style={{ borderTop: '1px solid #edf2f7', background: '#fafbfc' }}>

          {/* Mini-dashboard */}
          <div style={{ padding: '20px', borderBottom: '1px solid #edf2f7' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={13} /> Resumo da filial
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { label: 'Membros', value: filial._count.members, icon: '👥' },
                { label: 'Eventos no mês', value: stats.eventosMes, icon: '📅' },
                { label: 'Dízimo no mês', value: `R$ ${stats.dizimosMes.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, icon: '💰' },
                { label: 'Última atividade', value: stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—', icon: '🕐' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: '10px', padding: '12px', border: '1px solid #edf2f7', textAlign: 'center' }}>
                  <p style={{ fontSize: '18px', margin: '0 0 2px' }}>{s.icon}</p>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 2px' }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: '#a0aec0', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gestores */}
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} /> Acessos da filial
              </span>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{ background: 'none', border: '1px solid var(--primary)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: 'var(--primary)', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={12} /> Adicionar acesso
                </button>
              )}
            </div>

            {showAddForm && (
              <form onSubmit={handleAddUser} style={{ background: 'white', border: '1px solid #edf2f7', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px' }}>Nome *</label>
                    <input value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome" required style={{ fontSize: '13px !important', padding: '7px 10px !important' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px' }}>E-mail *</label>
                    <input type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} placeholder="email@..." required style={{ fontSize: '13px !important', padding: '7px 10px !important' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px' }}>Senha *</label>
                    <input type="password" value={addForm.password} onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} placeholder="Mín. 6 caracteres" minLength={6} required style={{ fontSize: '13px !important', padding: '7px 10px !important' }} />
                  </div>
                </div>
                {addError && <p style={{ fontSize: '12px', color: '#c53030', margin: '0 0 8px' }}>{addError}</p>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => { setShowAddForm(false); setAddError('') }} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: '#718096' }}>Cancelar</button>
                  <button type="submit" disabled={addLoading} style={{ background: 'var(--primary)', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: 'white', opacity: addLoading ? 0.7 : 1 }}>
                    {addLoading ? 'Criando...' : 'Criar acesso'}
                  </button>
                </div>
              </form>
            )}

            {loadingUsers ? (
              <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0 }}>Carregando...</p>
            ) : users.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0 }}>Nenhum acesso cadastrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {users.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'white', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>{u.name}</p>
                      <p style={{ fontSize: '12px', color: '#a0aec0', margin: '1px 0 0' }}>{u.email}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => { setResetModal(u); setNewPassword('') }} title="Resetar senha"
                        style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#718096', display: 'flex', alignItems: 'center' }}>
                        <KeyRound size={13} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} disabled={deleteLoading === u.id} title="Remover acesso"
                        style={{ background: 'none', border: '1px solid #fed7d7', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#c53030', display: 'flex', alignItems: 'center', opacity: deleteLoading === u.id ? 0.5 : 1 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {modalNode}

      {/* Modal reset senha */}
      {resetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>Resetar senha</h3>
              <button onClick={() => setResetModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '13px', color: '#718096', margin: '0 0 16px' }}>
              Nova senha para <strong>{resetModal.name}</strong>
            </p>
            <form onSubmit={handleResetPassword}>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Nova senha (mín. 6 caracteres)" minLength={6} required style={{ marginBottom: '16px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setResetModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={resetLoading} className="btn-primary" style={{ flex: 1, opacity: resetLoading ? 0.7 : 1 }}>
                  {resetLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
