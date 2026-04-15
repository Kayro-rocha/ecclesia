'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Step = 'cpf' | 'criar-senha' | 'senha'

export default function MembroLoginPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string

  const [step, setStep] = useState<Step>('cpf')
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  async function handleCpf(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const res = await fetch('/api/membro/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, cpf }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setErro(data.error || 'CPF não encontrado'); return }

    if (data.firstAccess) {
      setStep('criar-senha')
    } else {
      setStep('senha')
    }
  }

  async function handleCriarSenha(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (password.length < 6) { setErro('Senha deve ter pelo menos 6 caracteres'); return }
    if (password !== confirmPassword) { setErro('As senhas não coincidem'); return }
    setLoading(true)

    const res = await fetch('/api/membro/auth/senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, cpf, password }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setErro(data.error || 'Erro ao criar senha'); return }
    router.push(`/${slug}/membro/home`)
  }

  async function handleSenha(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const res = await fetch('/api/membro/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, cpf, password }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setErro(data.error || 'Senha incorreta'); return }
    router.push(`/${slug}/membro/home`)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Logo / Ícone */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px',
          }}>
            ⛪
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'white', margin: '0 0 6px' }}>
            {step === 'cpf' && 'Área do Membro'}
            {step === 'criar-senha' && 'Criar senha'}
            {step === 'senha' && 'Bem-vindo de volta'}
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {step === 'cpf' && 'Entre com seu CPF para acessar'}
            {step === 'criar-senha' && 'Primeiro acesso — defina sua senha'}
            {step === 'senha' && 'Digite sua senha para continuar'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '28px',
        }}>

          {/* Erro */}
          {erro && (
            <div style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
            }}>
              <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{erro}</p>
            </div>
          )}

          {/* Step: CPF */}
          {step === 'cpf' && (
            <form onSubmit={handleCpf} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  CPF
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cpf}
                  onChange={e => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  required
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading || cpf.replace(/\D/g, '').length < 11} style={btnStyle(loading)}>
                {loading ? 'Verificando...' : 'Continuar →'}
              </button>
            </form>
          )}

          {/* Step: Criar senha (primeiro acesso) */}
          {step === 'criar-senha' && (
            <form onSubmit={handleCriarSenha} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '10px 14px', background: 'rgba(74,222,128,0.1)', borderRadius: '10px', border: '1px solid rgba(74,222,128,0.2)' }}>
                <p style={{ color: '#4ade80', fontSize: '13px', margin: 0 }}>CPF: {cpf}</p>
              </div>
              <div>
                <label style={labelStyle}>Nova senha (mín. 6 caracteres)</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Confirmar senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? 'Criando conta...' : 'Criar senha e entrar'}
              </button>
              <button type="button" onClick={() => { setStep('cpf'); setErro('') }} style={backStyle}>
                ← Voltar
              </button>
            </form>
          )}

          {/* Step: Senha (acesso normal) */}
          {step === 'senha' && (
            <form onSubmit={handleSenha} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '10px 14px', background: 'rgba(74,222,128,0.1)', borderRadius: '10px', border: '1px solid rgba(74,222,128,0.2)' }}>
                <p style={{ color: '#4ade80', fontSize: '13px', margin: 0 }}>CPF: {cpf}</p>
              </div>
              <div>
                <label style={labelStyle}>Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoFocus
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <button type="button" onClick={() => { setStep('cpf'); setPassword(''); setErro('') }} style={backStyle}>
                ← Voltar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '12px', padding: '13px 16px', fontSize: '16px', color: 'white',
  outline: 'none', letterSpacing: '0.5px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px', color: 'rgba(255,255,255,0.6)',
  display: 'block', marginBottom: '8px', fontWeight: '500',
}

const btnStyle = (loading: boolean): React.CSSProperties => ({
  width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
  background: loading ? 'rgba(59,130,246,0.5)' : '#3b82f6', color: 'white',
  fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s',
})

const backStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
  fontSize: '13px', cursor: 'pointer', padding: '4px 0', textAlign: 'center',
}
