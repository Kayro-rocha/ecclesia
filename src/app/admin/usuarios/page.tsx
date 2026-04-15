'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string; name: string; email: string; role: string; createdAt: string
  church: { id: string; name: string; slug: string } | null
}

const ROLE_LABELS: Record<string, string> = {
  MASTER: 'Master', PASTOR: 'Pastor', ADMIN: 'Admin', LEADER: 'Líder',
}

const ROLE_COLORS: Record<string, string> = {
  MASTER: '#f59e0b', PASTOR: '#a78bfa', ADMIN: '#3b82f6', LEADER: '#4ade80',
}

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState('')

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/users?${params}`)
    if (res.status === 401) { router.push('/admin/login'); return }
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  async function handleResetPassword() {
    if (!resetTarget || !newPassword || newPassword.length < 6) return
    setResetting(true)
    setResetMsg('')
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resetTarget.id, action: 'reset-password', newPassword }),
    })
    if (res.ok) {
      setResetMsg('Senha redefinida com sucesso!')
      setNewPassword('')
      setTimeout(() => { setResetTarget(null); setResetMsg('') }, 1500)
    } else {
      const d = await res.json()
      setResetMsg(d.error || 'Erro ao redefinir')
    }
    setResetting(false)
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>Usuários</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{users.length} encontrados</p>
        </div>
      </div>

      {/* Filtro */}
      <div style={{ marginBottom: '20px' }}>
        <input
          className="admin-input"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '320px' }}
        />
      </div>

      {/* Modal reset senha */}
      {resetTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '28px', width: '380px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: '0 0 6px' }}>Redefinir senha</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>{resetTarget.name} · {resetTarget.email}</p>
            {resetMsg && (
              <div style={{ background: resetMsg.includes('sucesso') ? '#052e16' : '#450a0a', border: `1px solid ${resetMsg.includes('sucesso') ? '#166534' : '#991b1b'}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ color: resetMsg.includes('sucesso') ? '#4ade80' : '#fca5a5', fontSize: '13px', margin: 0 }}>{resetMsg}</p>
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Nova senha (mín. 6 caracteres)</label>
              <input
                className="admin-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="••••••••"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setResetTarget(null); setNewPassword(''); setResetMsg('') }} className="admin-btn admin-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
              <button
                onClick={handleResetPassword}
                disabled={resetting || newPassword.length < 6}
                className="admin-btn admin-btn-primary"
                style={{ flex: 1, opacity: resetting || newPassword.length < 6 ? 0.6 : 1 }}
              >
                {resetting ? 'Salvando...' : 'Redefinir'}
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
                <th>Usuário</th>
                <th>Função</th>
                <th>Igreja</th>
                <th>Cadastro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div>
                      <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '14px', color: '#e2e8f0' }}>{u.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>{u.email}</p>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
                      borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                      background: `${ROLE_COLORS[u.role]}22`, color: ROLE_COLORS[u.role],
                    }}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td>
                    {u.church ? (
                      <Link href={`/admin/igrejas/${u.church.id}`} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}>
                        {u.church.name}
                        <span style={{ display: 'block', fontSize: '11px', color: '#475569', fontFamily: 'monospace' }}>{u.church.slug}</span>
                      </Link>
                    ) : (
                      <span style={{ color: '#475569', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <button
                      onClick={() => { setResetTarget(u); setNewPassword(''); setResetMsg('') }}
                      className="admin-btn admin-btn-ghost"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                    >
                      Redefinir senha
                    </button>
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
