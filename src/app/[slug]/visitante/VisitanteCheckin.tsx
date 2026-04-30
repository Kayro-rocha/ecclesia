'use client'

import { useState, useRef } from 'react'

type Step = 'name' | 'confirm' | 'form' | 'done'

interface Church {
  name: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
}

interface Props {
  slug: string
  church: Church
}

const HOW_FOUND_OPTIONS = [
  { value: 'convite', label: 'Convite de um membro' },
  { value: 'redes_sociais', label: 'Redes sociais' },
  { value: 'passou_na_frente', label: 'Passei na frente' },
  { value: 'familia', label: 'Família' },
  { value: 'outro', label: 'Outro' },
]

export default function VisitanteCheckin({ slug, church }: Props) {
  const [step, setStep] = useState<Step>('name')
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [foundToken, setFoundToken] = useState('')
  const [phoneTail, setPhoneTail] = useState('')
  const [resultName, setResultName] = useState('')
  const [formError, setFormError] = useState('')

  const [form, setForm] = useState({
    phone: '',
    invitedBy: '',
    howFound: '',
    wantsHomeVisit: false,
  })

  const nameRef = useRef<HTMLInputElement>(null)

  const primary = church.primaryColor || '#2563eb'
  const secondary = church.secondaryColor || '#1e40af'

  // ── Step 1: busca por nome ─────────────────────
  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name.trim().length < 3) return
    setLoading(true)

    const res = await fetch(`/api/visitors/lookup?slug=${slug}&name=${encodeURIComponent(name.trim())}`)
    const data = await res.json()
    setLoading(false)

    if (data.found) {
      setFoundToken(data.token)
      setPhoneTail(data.phoneTail)
      setStep('confirm')
    } else {
      setStep('form')
    }
  }

  // ── Step 2: confirmação visitante retornando ───
  async function handleConfirmYes() {
    setLoading(true)
    const res = await fetch('/api/visitors/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, token: foundToken }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      setResultName(data.name)
      setStep('done')
    }
  }

  // ── Step 2: não sou eu → vai para form ────────
  function handleConfirmNo() {
    setFoundToken('')
    setPhoneTail('')
    setStep('form')
  }

  // ── Step 3: cadastro novo visitante ───────────
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.phone.trim()) return
    setLoading(true)
    setFormError('')

    const res = await fetch('/api/visitors/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, name: name.trim(), ...form }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.status === 409) {
      setFormError('Esse número já está cadastrado nesta igreja. Volte à etapa anterior e confirme seu nome.')
      return
    }
    if (data.ok) {
      setResultName(data.name)
      setStep('done')
    }
  }

  // ── Layout compartilhado ──────────────────────
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#f8f9fb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 16px 40px',
    }}>
      {/* Header da igreja */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: `linear-gradient(135deg, ${primary}, ${secondary})`,
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', fontWeight: '700', color: 'white', flexShrink: 0,
          overflow: 'hidden',
        }}>
          {church.logoUrl
            ? <img src={church.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : church.name.charAt(0)}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white' }}>{church.name}</p>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Registro de visitante</p>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* ── STEP: nome ─────────────────────────── */}
        {step === 'name' && (
          <form onSubmit={handleNameSubmit} style={{ background: 'white', borderRadius: '16px', padding: '28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '22px', margin: '0 0 6px', fontWeight: '700', color: '#1a1a2e' }}>Seja bem-vindo(a)! 👋</p>
              <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>Como você se chama?</p>
            </div>
            <input
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome completo"
              required
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '14px 16px', fontSize: '16px',
                border: '1.5px solid #e2e8f0', borderRadius: '12px',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button type="submit" disabled={loading || name.trim().length < 3}
              style={{
                padding: '14px', borderRadius: '12px', border: 'none',
                background: name.trim().length < 3 ? '#e2e8f0' : primary,
                color: name.trim().length < 3 ? '#a0aec0' : 'white',
                fontSize: '16px', fontWeight: '600', cursor: name.trim().length < 3 ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}>
              {loading ? 'Buscando...' : 'Continuar →'}
            </button>
          </form>
        )}

        {/* ── STEP: confirmar visitante retornando ── */}
        {step === 'confirm' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>😊</div>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px' }}>
                Olá, {name.split(' ')[0]}!
              </p>
              <p style={{ fontSize: '14px', color: '#718096', margin: 0, lineHeight: '1.5' }}>
                Encontramos um cadastro com esse nome.<br />
                O seu número termina em <strong style={{ color: '#1a1a2e' }}>**{phoneTail}</strong>?
              </p>
            </div>
            <button onClick={handleConfirmYes} disabled={loading}
              style={{
                padding: '14px', borderRadius: '12px', border: 'none',
                background: primary, color: 'white',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              }}>
              {loading ? 'Registrando...' : 'Sim, sou eu! ✓'}
            </button>
            <button onClick={handleConfirmNo}
              style={{
                padding: '12px', borderRadius: '12px',
                border: '1.5px solid #e2e8f0', background: 'white',
                fontSize: '14px', color: '#718096', cursor: 'pointer',
              }}>
              Não, esse não é meu número
            </button>
          </div>
        )}

        {/* ── STEP: formulário novo visitante ──────── */}
        {step === 'form' && (
          <form onSubmit={handleFormSubmit} style={{ background: 'white', borderRadius: '16px', padding: '28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 4px' }}>
                Prazer em conhecer você! 🙏
              </p>
              <p style={{ fontSize: '13px', color: '#718096', margin: 0 }}>Preencha os dados para finalizarmos</p>
            </div>

            <div>
              <p style={{ fontSize: '13px', color: '#4a5568', margin: '0 0 4px', fontWeight: '500' }}>Nome</p>
              <div style={{ padding: '12px 14px', background: '#f8f9fb', borderRadius: '10px', fontSize: '14px', color: '#1a1a2e', border: '1.5px solid #e2e8f0' }}>
                {name}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#4a5568', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                WhatsApp *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                required
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: '15px', border: '1.5px solid #e2e8f0', borderRadius: '10px', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#4a5568', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Quem te convidou? (opcional)
              </label>
              <input
                value={form.invitedBy}
                onChange={e => setForm(p => ({ ...p, invitedBy: e.target.value }))}
                placeholder="Nome do membro"
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: '15px', border: '1.5px solid #e2e8f0', borderRadius: '10px', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#4a5568', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Como conheceu a igreja?
              </label>
              <select
                value={form.howFound}
                onChange={e => setForm(p => ({ ...p, howFound: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: '15px', border: '1.5px solid #e2e8f0', borderRadius: '10px', outline: 'none', background: 'white', fontFamily: 'inherit' }}
              >
                <option value="">Selecionar</option>
                {HOW_FOUND_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.wantsHomeVisit}
                onChange={e => setForm(p => ({ ...p, wantsHomeVisit: e.target.checked }))}
                style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ fontSize: '14px', color: '#4a5568' }}>Gostaria de receber uma visita em casa</span>
            </label>

            {formError && (
              <p style={{ fontSize: '13px', color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '10px 14px', margin: 0 }}>
                {formError}
              </p>
            )}

            <button type="submit" disabled={loading || !form.phone.trim()}
              style={{
                marginTop: '4px', padding: '14px', borderRadius: '12px', border: 'none',
                background: !form.phone.trim() ? '#e2e8f0' : primary,
                color: !form.phone.trim() ? '#a0aec0' : 'white',
                fontSize: '16px', fontWeight: '600',
                cursor: !form.phone.trim() ? 'not-allowed' : 'pointer',
              }}>
              {loading ? 'Salvando...' : 'Finalizar cadastro'}
            </button>
          </form>
        )}

        {/* ── STEP: sucesso ─────────────────────────── */}
        {step === 'done' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '40px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '60px' }}>🙏</div>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>
              {resultName.split(' ')[0]}, que alegria!
            </p>
            <p style={{ fontSize: '15px', color: '#718096', margin: 0, lineHeight: '1.6' }}>
              Sua presença foi registrada.<br />
              Deus tem algo especial para você hoje!
            </p>
            <div style={{ marginTop: '8px', padding: '14px 20px', background: '#f0fff4', borderRadius: '12px', border: '1px solid #c6f6d5', width: '100%', boxSizing: 'border-box' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#276749', fontWeight: '500' }}>
                ✓ Presença registrada em {church.name}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
