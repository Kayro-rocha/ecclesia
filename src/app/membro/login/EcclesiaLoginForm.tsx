'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const EC = { primary: '#1E2A78', secondary: '#6C2BD9', light: '#2F4DFF', bg: '#0A0E2A' }
const LS_CPF = (slug: string) => `membro_cpf_${slug}`

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export default function EcclesiaLoginForm() {
  const router = useRouter()
  const [cpf, setCpf]         = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const saved = Object.keys(localStorage).find(k => k.startsWith('membro_cpf_'))
    if (saved) {
      const slug = saved.replace('membro_cpf_', '')
      router.replace(`/${slug}/membro/login`)
    } else {
      setChecking(false)
    }
  }, [router])

  if (checking) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const res = await fetch('/api/membro/cpf-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setErro(data.error || 'CPF não encontrado'); return }

    localStorage.setItem(LS_CPF(data.slug), cpf)
    router.push(`/${data.slug}/membro/login${data.firstAccess ? '?primeiroAcesso=1' : ''}`)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: EC.bg,
      backgroundImage: [
        'linear-gradient(rgba(47,77,255,0.07) 1px, transparent 1px)',
        'linear-gradient(90deg, rgba(47,77,255,0.07) 1px, transparent 1px)',
      ].join(', '),
      backgroundSize: '48px 48px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* blobs */}
      <div style={{ position: 'absolute', top: '-100px', left: '5%',  width: '440px', height: '440px', borderRadius: '50%', background: `${EC.primary}50`,   filter: 'blur(110px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', right: '5%', width: '380px', height: '380px', borderRadius: '50%', background: `${EC.secondary}45`, filter: 'blur(110px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', borderRadius: '50%', background: `${EC.light}20`, filter: 'blur(90px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1 }}>

        {/* Logo Ecclesia */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img
            src="/logo-ecclesia-claro.png"
            alt="Ecclesia"
            style={{ height: '200px', objectFit: 'contain', marginBottom: '5px', display: 'block', margin: '0 auto 6px' }}
          />
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.2px' }}>
            Digite seu CPF para identificar sua igreja
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.10)', borderRadius: '24px', padding: '28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          {erro && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
              <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>{erro}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                CPF
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={e => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                required
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px', padding: '13px 16px', fontSize: '16px', color: 'white',
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || cpf.replace(/\D/g, '').length < 11}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: loading || cpf.replace(/\D/g, '').length < 11
                  ? `${EC.secondary}60`
                  : `linear-gradient(135deg, ${EC.light}, ${EC.secondary})`,
                color: 'white', fontSize: '15px', fontWeight: '600',
                cursor: loading || cpf.replace(/\D/g, '').length < 11 ? 'not-allowed' : 'pointer',
                boxShadow: `0 4px 16px ${EC.secondary}45`,
              }}
            >
              {loading ? 'Verificando...' : 'Continuar →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.5px' }}>
          ecclesia.app
        </p>
      </div>
    </div>
  )
}
