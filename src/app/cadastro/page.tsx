'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { isValidCpfCnpj } from '@/lib/cpf'

type Step = 'validando' | 'token-invalido' | 'igreja' | 'pastor' | 'sucesso'

const G = 'linear-gradient(135deg, #1E2A78 0%, #6C2BD9 100%)'
const G2 = 'linear-gradient(135deg, #2F4DFF 0%, #6C2BD9 100%)'
const BG = '#0A0E2A'

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px', padding: '12px 14px',
  fontSize: '16px', color: 'white', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: '600',
  color: 'rgba(255,255,255,0.55)', marginBottom: '6px', letterSpacing: '0.3px',
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh', background: BG,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        input:focus { border-color: rgba(108,43,217,0.6) !important; box-shadow: 0 0 0 3px rgba(108,43,217,0.15); }
        .cad-card { padding: 36px 32px !important; }
        @media (max-width: 480px) { .cad-card { padding: 24px 18px !important; border-radius: 18px !important; } }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(47,77,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(47,77,255,0.05) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-120px', left: '-60px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(30,42,120,0.45)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', right: '-60px', width: '360px', height: '360px', borderRadius: '50%', background: 'rgba(108,43,217,0.35)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="cad-card" style={{
      background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.10)', borderRadius: '24px',
      boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
    }}>
      {children}
    </div>
  )
}

function Logo() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
      <img
        src="/logo-ecclesia.png"
        alt="Ecclesia"
        style={{ height: '64px', objectFit: 'contain', filter: 'brightness(0) invert(1)', display: 'block' }}
      />
    </div>
  )
}

export default function CadastroPage() {
  return <Suspense><CadastroForm /></Suspense>
}

function CadastroForm() {
  const searchParams = useSearchParams()
  const tokenParam = searchParams.get('token')

  const [step, setStep] = useState<Step>(tokenParam ? 'validando' : 'token-invalido')
  const [tokenErro, setTokenErro] = useState('')
  const [tokenValue] = useState(tokenParam || '')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!tokenParam) { setTokenErro('Link inválido. Acesse seu e-mail para criar a conta.'); setStep('token-invalido'); return }
    fetch(`/api/onboarding/token?token=${tokenParam}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setForm(prev => ({ ...prev, email: data.email }))
          setStep('igreja')
        } else {
          setTokenErro(data.error || 'Link inválido ou expirado.')
          setStep('token-invalido')
        }
      })
  }, [tokenParam])

  const [form, setForm] = useState({
    churchName: '', slug: '', pastorName: '', email: '',
    password: '', phone: '', cpfCnpj: '', birthDate: '',
    incomeValue: '', postalCode: '',
  })

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'reserved'>('idle')
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [churchSlug, setChurchSlug] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'churchName' && !form.slug) {
      const auto = value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '').slice(0, 30)
      setForm(prev => ({ ...prev, slug: auto }))
      checkSlug(auto)
    }
    if (name === 'slug') {
      const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)
      setForm(prev => ({ ...prev, slug: clean }))
      checkSlug(clean)
    }
  }

  function checkSlug(slug: string) {
    if (!slug || slug.length < 3) { setSlugStatus('idle'); return }
    if (slugTimer.current) clearTimeout(slugTimer.current)
    setSlugStatus('checking')
    slugTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/onboarding?slug=${slug}`)
      const data = await res.json()
      if (data.available) setSlugStatus('available')
      else if (data.reserved) setSlugStatus('reserved')
      else setSlugStatus('taken')
    }, 500)
  }

  function nextStep() {
    setErro('')
    if (!form.churchName || !form.slug) { setErro('Preencha o nome e o subdomínio da igreja.'); return }
    if (slugStatus !== 'available') { setErro('Escolha um subdomínio válido e disponível.'); return }
    setStep('pastor')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    if (!form.pastorName || !form.email || !form.password || !form.phone || !form.cpfCnpj || !form.birthDate) {
      setErro('Preencha todos os campos obrigatórios.'); return
    }
    if (form.password.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    if (!isValidCpfCnpj(form.cpfCnpj)) { setErro('CPF ou CNPJ inválido. Verifique os dígitos.'); return }

    setLoading(true)
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, token: tokenValue }),
    })
    const data = await res.json()
    if (!res.ok) { setErro(data.error || 'Erro ao cadastrar. Tente novamente.'); setLoading(false); return }
    setChurchSlug(data.slug)
    setStep('sucesso')
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'ecclesiaa.com'

  // ── Validando ──
  if (step === 'validando') {
    return (
      <PageShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(108,43,217,0.3)', borderTopColor: '#6C2BD9', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Validando seu link...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </PageShell>
    )
  }

  // ── Token inválido ──
  if (step === 'token-invalido') {
    return (
      <PageShell>
        <Logo />
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: '700', color: 'white' }}>Link inválido</h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{tokenErro}</p>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
              Precisa de ajuda?{' '}
              <a href="mailto:ecclesiasas014@gmail.com" style={{ color: '#818cf8', textDecoration: 'none' }}>ecclesiasas014@gmail.com</a>
            </p>
          </div>
        </Card>
      </PageShell>
    )
  }

  // ── Sucesso ──
  if (step === 'sucesso') {
    const loginUrl = `https://${churchSlug}.${appDomain}/login`
    return (
      <PageShell>
        <Logo />
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '800', color: 'white' }}>Igreja cadastrada!</h2>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
              Seu sistema está pronto. Acesse com o link abaixo e configure sua igreja.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontFamily: 'monospace', fontSize: '13px', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all' }}>
              {loginUrl}
            </div>
            <a
              href={loginUrl}
              style={{ display: 'block', background: G2, color: 'white', padding: '13px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', textDecoration: 'none', boxShadow: '0 8px 24px rgba(108,43,217,0.4)' }}
            >
              Acessar minha conta →
            </a>
          </div>
        </Card>
      </PageShell>
    )
  }

  // ── Formulário (igreja / pastor) ──
  return (
    <PageShell>
      <Logo />

      {/* Subtítulo */}
      <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
        {step === 'igreja' ? 'Passo 1 de 2 — Dados da Igreja' : 'Passo 2 de 2 — Dados do Responsável'}
      </p>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
        <div style={{ flex: 1, height: '3px', borderRadius: '99px', background: G2 }} />
        <div style={{ flex: 1, height: '3px', borderRadius: '99px', background: step === 'pastor' ? G2 : 'rgba(255,255,255,0.12)' }} />
      </div>

      <Card>
        {step === 'igreja' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={labelStyle}>Nome da Igreja *</label>
              <input name="churchName" value={form.churchName} onChange={handleChange} style={inputStyle} placeholder="Igreja Batista Central" />
            </div>

            <div>
              <label style={labelStyle}>Subdomínio *</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', overflow: 'hidden' }}>
                <input
                  name="slug" value={form.slug} onChange={handleChange}
                  style={{ flex: 1, background: 'transparent', border: 'none', padding: '11px 14px', fontSize: '16px', color: 'white', outline: 'none' }}
                  placeholder="igrejabatista"
                />
                <span style={{ padding: '11px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.35)', borderLeft: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>
                  .{appDomain}
                </span>
              </div>
              {slugStatus === 'checking' && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '5px' }}>Verificando...</p>}
              {slugStatus === 'available' && <p style={{ fontSize: '12px', color: '#22c55e', marginTop: '5px' }}>✓ Disponível</p>}
              {slugStatus === 'taken' && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '5px' }}>✗ Já está em uso. Escolha outro.</p>}
              {slugStatus === 'reserved' && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '5px' }}>✗ Nome reservado. Escolha outro.</p>}
            </div>

            {erro && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5' }}>
                {erro}
              </div>
            )}

            <button
              type="button" onClick={nextStep}
              style={{ width: '100%', background: G2, color: 'white', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 24px rgba(108,43,217,0.35)', marginTop: '4px' }}
            >
              Continuar →
            </button>
          </div>
        )}

        {step === 'pastor' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Nome completo *</label>
              <input name="pastorName" value={form.pastorName} onChange={handleChange} style={inputStyle} placeholder="Pastor João Silva" />
            </div>
            <div>
              <label style={labelStyle}>E-mail *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} style={{ ...inputStyle, color: 'rgba(255,255,255,0.5)' }} readOnly />
            </div>
            <div>
              <label style={labelStyle}>Senha *</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} style={inputStyle} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp *</label>
              <input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} placeholder="(27) 99999-9999" />
            </div>
            <div>
              <label style={labelStyle}>CPF / CNPJ *</label>
              <input name="cpfCnpj" value={form.cpfCnpj} onChange={handleChange} style={inputStyle} placeholder="000.000.000-00" />
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Usado para identificação da sua Igreja</p>
            </div>
            <div>
              <label style={labelStyle}>Data de nascimento *</label>
              <input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Renda/faturamento mensal estimado (R$) *</label>
              <input name="incomeValue" type="number" min="0" value={form.incomeValue} onChange={handleChange} style={inputStyle} placeholder="0" />
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Estimativa de arrecadação mensal. Pode ser 0.</p>
            </div>
            <div>
              <label style={labelStyle}>CEP <span style={{ color: 'rgba(255,255,255,0.25)' }}>(opcional)</span></label>
              <input name="postalCode" value={form.postalCode} onChange={handleChange} style={inputStyle} placeholder="00000-000" />
            </div>

            {erro && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5' }}>
                {erro}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button" onClick={() => { setStep('igreja'); setErro('') }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                ← Voltar
              </button>
              <button
                type="submit" disabled={loading}
                style={{ flex: 2, background: loading ? 'rgba(108,43,217,0.5)' : G2, color: 'white', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 8px 24px rgba(108,43,217,0.35)' }}
              >
                {loading ? 'Criando conta...' : 'Criar conta →'}
              </button>
            </div>
          </form>
        )}
      </Card>

      <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '20px' }}>
        Dúvidas?{' '}
        <a href="mailto:ecclesiasas014@gmail.com" style={{ color: 'rgba(130,104,220,0.8)', textDecoration: 'none' }}>
          ecclesiasas014@gmail.com
        </a>
      </p>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        input:focus { border-color: rgba(108,43,217,0.6) !important; box-shadow: 0 0 0 3px rgba(108,43,217,0.15); }
      `}</style>
    </PageShell>
  )
}
