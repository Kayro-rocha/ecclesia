'use client'

import { useState } from 'react'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface Props {
  slug: string
  month: number
  year: number
  pendingCount: number
}

export default function ReenviarTodosPendentes({ slug, month, year, pendingCount }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null)

  async function handleClick() {
    if (!confirm(`Enviar notificação push para os ${pendingCount} membros com dízimo pendente de ${MESES[month - 1]}?`)) return
    setState('loading')
    try {
      const res = await fetch('/api/tithes/bulk-remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, month, year }),
      })
      const data = await res.json()
      setResult({ sent: data.sent ?? 0, total: data.total ?? pendingCount })
      setState('done')
      setTimeout(() => { setState('idle'); setResult(null) }, 6000)
    } catch {
      setState('idle')
    }
  }

  if (state === 'done' && result !== null) {
    return (
      <span style={{
        fontSize: '13px', color: '#276749',
        background: '#f0fff4', padding: '8px 14px',
        borderRadius: '8px', fontWeight: '500',
      }}>
        ✓ {result.sent} de {result.total} notificações enviadas
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      style={{
        background: '#fffaf0',
        color: '#744210',
        border: '1.5px solid #fbd38d',
        borderRadius: '8px',
        padding: '8px 14px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: state === 'loading' ? 'default' : 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {state === 'loading'
        ? 'Enviando...'
        : `📲 Notificar ${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`}
    </button>
  )
}
