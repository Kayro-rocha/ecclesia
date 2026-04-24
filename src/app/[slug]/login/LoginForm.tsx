'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  slug: string
  churchName: string
  primaryColor: string
  secondaryColor: string
  logoUrl: string | null
}

export default function LoginForm({ slug, churchName, primaryColor, secondaryColor, logoUrl }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, slug, redirect: false })
    if (res?.error) {
      setError('E-mail ou senha incorretos')
      setLoading(false)
      return
    }
    router.push(`/${slug}/dashboard`)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: `radial-gradient(ellipse at 30% 20%, ${primaryColor}55 0%, transparent 50%),
                   radial-gradient(ellipse at 70% 80%, ${secondaryColor}44 0%, transparent 50%),
                   linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Blobs decorativos */}
      <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: `${primaryColor}22`, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: `${secondaryColor}22`, filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '28px',
        padding: '40px 36px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>

        {/* Logo / Avatar */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {logoUrl ? (
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 14px', border: `3px solid ${primaryColor}`, boxShadow: `0 0 0 4px ${primaryColor}30` }}>
              <Image src={logoUrl} alt={churchName} width={80} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 14px',
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: '700', color: 'white',
              boxShadow: `0 0 0 4px ${primaryColor}30, 0 8px 24px ${primaryColor}40`,
            }}>
              {churchName.charAt(0)}
            </div>
          )}
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: 'white', letterSpacing: '-0.3px' }}>
            {churchName}
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
            Painel administrativo
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.55)', marginBottom: '8px', letterSpacing: '0.3px' }}>
              E-MAIL
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="pastor@igreja.com" required
              style={{
                width: '100%', padding: '13px 16px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px', fontSize: '15px', color: 'white', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = primaryColor}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.55)', marginBottom: '8px', letterSpacing: '0.3px' }}>
              SENHA
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{
                width: '100%', padding: '13px 16px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px', fontSize: '15px', color: 'white', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = primaryColor}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: '12px', marginTop: '4px',
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              color: 'white', fontSize: '15px', fontWeight: '600',
              cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
              boxShadow: `0 4px 20px ${primaryColor}50`,
              transition: 'opacity 0.2s, transform 0.1s',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <a href="/esqueci-senha" style={{
            display: 'block', textAlign: 'center', fontSize: '13px',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginTop: '4px',
          }}>
            Esqueci minha senha
          </a>
        </form>
      </div>
    </div>
  )
}
