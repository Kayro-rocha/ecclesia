'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body style={{ fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '48px', margin: '0 0 16px' }}>😔</p>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px' }}>Algo deu errado</h2>
          <p style={{ fontSize: '14px', color: '#718096', margin: '0 0 24px' }}>Nosso time já foi notificado. Tente novamente.</p>
          <button
            onClick={reset}
            style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#6c2bd9', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
