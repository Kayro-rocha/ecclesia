'use client'

import { useState } from 'react'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface NotificarPendentesProps {
  slug: string
  pendingCount: number
  month: number
  year: number
}

export function NotificarPendentes({ slug, pendingCount, month, year }: NotificarPendentesProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent'>('idle')

  async function handleClick() {
    setState('loading')
    try {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title: `💰 Dízimo de ${MESES[month - 1]} pendente`,
          body: `${pendingCount} ${pendingCount === 1 ? 'membro ainda não pagou' : 'membros ainda não pagaram'} o dízimo de ${MESES[month - 1]}. Acesse o app para ver.`,
          url: '/dizimo',
        }),
      })
      setState('sent')
      setTimeout(() => setState('idle'), 4000)
    } catch {
      setState('idle')
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state !== 'idle'}
      style={{
        background: state === 'sent' ? '#f0fff4' : 'var(--primary-light)',
        color: state === 'sent' ? '#276749' : 'var(--primary)',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 14px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: state !== 'idle' ? 'default' : 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s',
      }}
    >
      {state === 'sent'
        ? '✓ Notificações enviadas'
        : state === 'loading'
        ? 'Enviando...'
        : `Notificar ${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`}
    </button>
  )
}
