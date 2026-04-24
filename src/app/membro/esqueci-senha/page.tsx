'use client'

import { useState } from 'react'

function formatCpf(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export default function MembroEsqueciSenhaPage() {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [semEmail, setSemEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/membro/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.noEmail) { setSemEmail(true); return }
    setEnviado(true)
  }

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.10)', borderRadius: '20px', padding: '28px',
  }

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', color: 'white' }}>E</div>
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: 'white' }}>Ecclesia</h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Recuperar acesso</p>
        </div>
        <div style={card}>
          {enviado ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📧</div>
              <p style={{ color: 'white', fontWeight: '600', fontSize: '16px', margin: '0 0 8px' }}>Email enviado!</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>Se este CPF tiver um email cadastrado, você receberá o link em instantes. Verifique o spam.</p>
            </div>
          ) : semEmail ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📞</div>
              <p style={{ color: 'white', fontWeight: '600', fontSize: '16px', margin: '0 0 8px' }}>Sem email cadastrado</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>Seu cadastro não tem email. Entre em contato com a secretaria da sua igreja para resetar sua senha.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>Digite seu CPF para receber o link de redefinição no email cadastrado.</p>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>CPF</label>
                <input
                  type="text" inputMode="numeric" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00" required autoFocus
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '13px 16px', fontSize: '16px', color: 'white', outline: 'none' }}
                />
              </div>
              <button type="submit" disabled={loading || cpf.replace(/\D/g, '').length < 11} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Verificando...' : 'Enviar link →'}
              </button>
              <a href="/membro/login" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', textAlign: 'center', textDecoration: 'none' }}>← Voltar</a>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
