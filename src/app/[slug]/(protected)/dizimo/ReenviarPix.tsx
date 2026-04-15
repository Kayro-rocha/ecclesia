'use client'

import { useState } from 'react'

interface Props {
  slug: string
  mes: number
  ano: number
  memberName: string
}

export default function ReenviarPix({ slug, mes, ano, memberName }: Props) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReenviar() {
    setLoading(true)
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

    const appUrl = window.location.protocol + '//' + window.location.host
    const pagarUrl = `${appUrl}/dizimo/pagar?mes=${mes}&ano=${ano}`

    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        title: `💰 Lembrete — Dízimo de ${meses[mes - 1]}`,
        body: `${memberName}, seu dízimo de ${meses[mes - 1]} ${ano} ainda está pendente. Toque para pagar via PIX.`,
        url: pagarUrl,
      }),
    })

    setSent(true)
    setLoading(false)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <button
      onClick={handleReenviar}
      disabled={loading || sent}
      style={{
        fontSize: '13px',
        color: sent ? '#38a169' : 'var(--primary)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        fontWeight: '500',
      }}
    >
      {sent ? '✓ Enviado' : loading ? 'Enviando...' : 'Reenviar PIX'}
    </button>
  )
}
