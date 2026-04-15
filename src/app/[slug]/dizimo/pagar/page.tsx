'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

export default function PagarDizimoPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params?.slug as string
  const mes = searchParams.get('mes') || ''
  const ano = searchParams.get('ano') || ''

  const [info, setInfo] = useState<{ name: string; pixKey: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/tithes/pix-info?slug=${slug}`)
      .then(r => r.json())
      .then(data => { setInfo(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  function copyPix() {
    if (!info?.pixKey) return
    navigator.clipboard.writeText(info.pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const mesLabel = mes ? meses[parseInt(mes) - 1] : ''

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#718096', fontSize: '14px' }}>Carregando...</p>
    </div>
  )

  if (!info) return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
        <p style={{ color: '#718096', fontSize: '14px' }}>Chave PIX não configurada. Fale com o seu pastor.</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #edf2f7', padding: '28px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💰</div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 6px' }}>
            Dízimo {mesLabel && ano ? `— ${mesLabel} ${ano}` : ''}
          </h1>
          <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>{info.name}</p>
        </div>

        {/* PIX Key */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #edf2f7', padding: '24px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>
            Chave PIX
          </p>
          <div style={{ background: '#f7fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
            <p style={{ fontSize: '15px', color: '#1a1a2e', fontWeight: '600', margin: 0, wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {info.pixKey}
            </p>
          </div>
          <button
            onClick={copyPix}
            style={{
              width: '100%', background: copied ? '#38a169' : '#667eea',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '14px', fontSize: '15px', fontWeight: '600',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            {copied ? '✓ Chave copiada!' : 'Copiar chave PIX'}
          </button>
        </div>

        {/* Instruções */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #edf2f7', padding: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', margin: '0 0 12px' }}>Como pagar:</p>
          <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Abra o app do seu banco',
              'Vá em Pix → Pagar / Transferir',
              'Cole a chave PIX acima',
              'Confirme o nome da igreja e pague',
            ].map((step, i) => (
              <li key={i} style={{ fontSize: '13px', color: '#718096', lineHeight: 1.5 }}>{step}</li>
            ))}
          </ol>
        </div>

        <p style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center', margin: 0 }}>
          Em caso de dúvida, fale com seu pastor.
        </p>
      </div>
    </div>
  )
}
