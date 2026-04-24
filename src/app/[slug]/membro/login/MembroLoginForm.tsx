'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Step = 'senha' | 'criar-senha'
const LS_CPF = (slug: string) => `membro_cpf_${slug}`

interface Props {
  slug: string
  churchName: string
  primaryColor: string
  secondaryColor: string
  logoUrl: string | null
}

export default function MembroLoginForm({ slug, churchName, primaryColor, secondaryColor, logoUrl }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionExpirou  = searchParams.get('expirado') === '1'
  const firstAccessParam = searchParams.get('primeiroAcesso') === '1'

  const [step, setStep]                       = useState<Step>(firstAccessParam ? 'criar-senha' : 'senha')
  const [cpf, setCpf]                         = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]                 = useState(false)
  const [erro, setErro]                       = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(LS_CPF(slug))
    if (!saved) {
      // CPF não identificado — volta para identificação global
      router.replace('/membro/login')
      return
    }
    if (sessionExpirou) {
      // sessão expirou: limpa e pede CPF novamente
      localStorage.removeItem(LS_CPF(slug))
      router.replace('/membro/login')
      return
    }
    setCpf(saved)
  }, [slug, sessionExpirou, router])

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

  function trocarCpf() {
    localStorage.removeItem(LS_CPF(slug))
    router.push('/membro/login')
  }

  if (!cpf) return null

  return (
    <div style={{
      minHeight: '100dvh',
      background: `radial-gradient(ellipse at 30% 20%, ${primaryColor}55 0%, transparent 50%),
                   radial-gradient(ellipse at 70% 80%, ${secondaryColor}44 0%, transparent 50%),
                   linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: `${primaryColor}22`, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: `${secondaryColor}22`, filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1 }}>

        {/* Identidade da igreja */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {logoUrl ? (
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 14px', border: `3px solid ${primaryColor}`, boxShadow: `0 0 0 4px ${primaryColor}30` }}>
              <img src={logoUrl} alt={churchName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 14px',
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '30px', fontWeight: '700', color: 'white',
              boxShadow: `0 0 0 4px ${primaryColor}30, 0 8px 24px ${primaryColor}40`,
            }}>
              {churchName.charAt(0)}
            </div>
          )}
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: 'white' }}>
            {churchName}
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            {step === 'criar-senha' ? 'Primeiro acesso — defina sua senha' : 'Bem-vindo de volta'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          {erro && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
              <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{erro}</p>
            </div>
          )}

          {/* Badge do CPF identificado */}
          <div style={{ padding: '10px 14px', background: 'rgba(74,222,128,0.1)', borderRadius: '10px', border: '1px solid rgba(74,222,128,0.2)', marginBottom: '16px' }}>
            <p style={{ color: '#4ade80', fontSize: '13px', margin: 0 }}>CPF: {cpf}</p>
          </div>

          {step === 'criar-senha' && (
            <form onSubmit={handleCriarSenha} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nova senha (mín. 6 caracteres)</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirmar senha</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(primaryColor, loading)}>
                {loading ? 'Criando conta...' : 'Criar senha e entrar'}
              </button>
              <button type="button" onClick={trocarCpf} style={backStyle}>← Trocar CPF</button>
            </form>
          )}

          {step === 'senha' && (
            <form onSubmit={handleSenha} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoFocus style={inputStyle} />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(primaryColor, loading)}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <button type="button" onClick={trocarCpf} style={backStyle}>
                Não sou eu — trocar CPF
              </button>
              <a href="/membro/esqueci-senha" style={{ ...backStyle, display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                Esqueci minha senha
              </a>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' }}>
          Powered by Ecclesia
        </p>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '12px', padding: '13px 16px', fontSize: '16px', color: 'white',
  outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontSize: '12px', color: 'rgba(255,255,255,0.6)',
  display: 'block', marginBottom: '8px', fontWeight: '500',
}
const btnStyle = (color: string, loading: boolean): React.CSSProperties => ({
  width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
  background: loading ? `${color}80` : color, color: 'white',
  fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
  boxShadow: `0 4px 16px ${color}40`,
})
const backStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
  fontSize: '13px', cursor: 'pointer', padding: '4px 0', textAlign: 'center', width: '100%',
}
