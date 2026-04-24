'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Lock } from 'lucide-react'

/**
 * Detecta sessão expirada de duas formas:
 * 1. Intercepta `window.fetch` — qualquer chamada a /api/membro/* que retorne 401
 * 2. Verifica /api/membro/me quando o app volta ao foco (visibilitychange)
 */
export default function SessionGuard() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string

  const [expirou, setExpirou] = useState(false)

  const handleExpired = useCallback(() => {
    setExpirou(true)
    // Redireciona após pequena pausa para o overlay ser visto
    setTimeout(() => {
      router.replace(`/${slug}/membro/login?expirado=1`)
    }, 1800)
  }, [router, slug])

  // ── 1. Intercepta fetch global ────────────────────────────────────────────
  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async function (...args) {
      const response = await originalFetch(...args)

      // Só age em endpoints da área de membro
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
      if (response.status === 401 && url.includes('/api/membro/')) {
        handleExpired()
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [handleExpired])

  // ── 2. Verifica ao voltar ao foco ─────────────────────────────────────────
  useEffect(() => {
    async function verificar() {
      if (document.visibilityState !== 'visible') return
      try {
        const res = await fetch('/api/membro/me')
        if (res.status === 401) handleExpired()
      } catch {
        // offline — ignora
      }
    }

    document.addEventListener('visibilitychange', verificar)
    return () => document.removeEventListener('visibilitychange', verificar)
  }, [handleExpired])

  if (!expirou) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(255,255,255,0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px',
      animation: 'fadeIn 0.2s ease',
    }}>
      <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }`}</style>

      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        background: '#fef3c7', display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginBottom: '20px', color: '#d97706',
      }}>
        <Lock size={36} />
      </div>

      <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: '#1e293b', textAlign: 'center' }}>
        Sessão expirada
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
        Por segurança, sua sessão foi encerrada.<br />Redirecionando para o login...
      </p>

      <div style={{
        display: 'flex', gap: '8px', alignItems: 'center',
        fontSize: '13px', color: '#94a3b8',
      }}>
        <span style={{
          display: 'inline-block', width: '16px', height: '16px',
          border: '2px solid #e2e8f0', borderTopColor: '#3b82f6',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        Aguarde...
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <button
        onClick={() => router.replace(`/${slug}/membro/login`)}
        style={{
          marginTop: '24px', padding: '12px 28px',
          background: '#3b82f6', color: 'white', border: 'none',
          borderRadius: '12px', fontSize: '14px', fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        Ir para o login agora
      </button>
    </div>
  )
}
