'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function MembroRedefinirSenhaPage() {
  return <Suspense><RedefinirForm /></Suspense>
}

function RedefinirForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (!token) setErro('Link inválido.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (password.length < 6) { setErro('Mínimo 6 caracteres'); return }
    if (password !== confirm) { setErro('As senhas não coincidem'); return }
    setLoading(true)
    const res = await fetch('/api/membro/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setErro(data.error || 'Erro ao redefinir'); return }
    setSucesso(true)
    setTimeout(() => router.push(`/${data.slug}/membro/login`), 2500)
  }

  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '13px 16px', fontSize: '15px', color: 'white', outline: 'none' }

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', color: 'white' }}>E</div>
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: 'white' }}>Ecclesia</h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Criar nova senha</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px', padding: '28px' }}>
          {sucesso ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <p style={{ color: 'white', fontWeight: '600', fontSize: '16px', margin: '0 0 8px' }}>Senha atualizada!</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>Redirecionando para o login...</p>
            </div>
          ) : erro && !token ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#fca5a5', fontSize: '14px', margin: '0 0 16px' }}>{erro}</p>
              <a href="/membro/esqueci-senha" style={{ color: '#a5b4fc', fontSize: '13px' }}>Solicitar novo link →</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nova senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required autoFocus style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>Confirmar senha</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required style={inputStyle} />
              </div>
              {erro && <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{erro}</p>}
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
