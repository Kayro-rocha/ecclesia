'use client'

import { useState } from 'react'

export default function CopiarPix({ pixKey }: { pixKey: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(pixKey)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div style={{
      background: '#f0fdf4', border: '1px solid #bbf7d0',
      borderRadius: '14px', padding: '16px',
    }}>
      <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: '#16a34a' }}>
        CHAVE PIX DA IGREJA
      </p>
      <p style={{
        margin: '0 0 12px', fontSize: '15px', fontWeight: '600',
        color: '#1e293b', wordBreak: 'break-all', fontFamily: 'monospace',
      }}>
        {pixKey}
      </p>
      <button
        onClick={copiar}
        style={{
          width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
          background: copiado ? '#16a34a' : '#22c55e', color: 'white',
          fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {copiado ? '✓ Chave copiada!' : '📋 Copiar chave PIX'}
      </button>
    </div>
  )
}
