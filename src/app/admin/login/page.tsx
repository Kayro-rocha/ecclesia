'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (res?.ok) {
      window.location.href = '/admin/dashboard'
    } else {
      setError('Email ou senha inválidos')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚙️</div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>Admin</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>MarketControll · Painel interno</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: '#1e293b', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ background: '#450a0a', border: '1px solid #991b1b', borderRadius: '8px', padding: '10px 14px' }}>
              <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{error}</p>
            </div>
          )}
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
