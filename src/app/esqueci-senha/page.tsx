'use client'

import { useState } from 'react'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (res.ok) setEnviado(true)
    else setErro('Erro ao enviar. Tente novamente.')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: '800', color: 'white',
          }}>E</div>
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: 'white' }}>Ecclesia</h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Redefinição de senha</p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px', padding: '28px',
        }}>
          {enviado ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📧</div>
              <p style={{ color: 'white', fontWeight: '600', fontSize: '16px', margin: '0 0 8px' }}>Email enviado!</p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.5 }}>
                Se este email estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>Verifique também a caixa de spam.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                Digite o email da sua conta. Se estiver cadastrado, você receberá um link de redefinição válido por 15 minutos.
              </p>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="pastor@igreja.com" required autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px', padding: '13px 16px', fontSize: '15px', color: 'white', outline: 'none',
                  }}
                />
              </div>
              {erro && <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{erro}</p>}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', fontSize: '15px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Enviando...' : 'Enviar link →'}
              </button>
              <a href="javascript:history.back()" style={{
                color: 'rgba(255,255,255,0.35)', fontSize: '13px',
                textAlign: 'center', textDecoration: 'none', cursor: 'pointer',
              }}>← Voltar</a>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
