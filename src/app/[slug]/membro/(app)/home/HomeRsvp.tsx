'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  eventId: string
  memberId: string
  memberName: string
  memberPhone: string
  initialRsvp: boolean | null
  slug: string
}

export default function HomeRsvp({ eventId, memberId, memberName, memberPhone, initialRsvp, slug }: Props) {
  const [rsvp, setRsvp] = useState<boolean | null>(initialRsvp)
  const [salvando, setSalvando] = useState(false)

  async function confirmar(confirmed: boolean) {
    if (salvando) return
    setSalvando(true)
    await fetch(`/api/events/${eventId}/attend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, name: memberName, phone: memberPhone, confirmed }),
    })
    setRsvp(confirmed)
    setSalvando(false)
  }

  if (rsvp === true) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          flex: 1, padding: '8px 12px', borderRadius: '10px', textAlign: 'center',
          background: '#dcfce7', fontSize: '13px', fontWeight: '600', color: '#16a34a',
        }}>
          ✓ Presença confirmada
        </div>
        <button
          onClick={() => confirmar(false)}
          style={{ padding: '8px 10px', borderRadius: '10px', border: '1.5px solid #fecaca', background: 'white', fontSize: '12px', color: '#dc2626', cursor: 'pointer', fontWeight: '500' }}
        >
          Cancelar
        </button>
      </div>
    )
  }

  if (rsvp === false) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          flex: 1, padding: '8px 12px', borderRadius: '10px', textAlign: 'center',
          background: '#fee2e2', fontSize: '13px', fontWeight: '600', color: '#dc2626',
        }}>
          ✕ Não vou
        </div>
        <button
          onClick={() => confirmar(true)}
          style={{ padding: '8px 10px', borderRadius: '10px', border: '1.5px solid #bbf7d0', background: 'white', fontSize: '12px', color: '#16a34a', cursor: 'pointer', fontWeight: '500' }}
        >
          Vou sim!
        </button>
      </div>
    )
  }

  // Sem resposta ainda
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      <button
        disabled={salvando}
        onClick={() => confirmar(true)}
        style={{
          padding: '9px', border: 'none', borderRadius: '10px', cursor: 'pointer',
          background: '#3b82f6', color: 'white', fontSize: '12px', fontWeight: '600',
        }}
      >
        ✓ Vou comparecer
      </button>
      <button
        disabled={salvando}
        onClick={() => confirmar(false)}
        style={{
          padding: '9px', border: '1.5px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer',
          background: 'white', color: '#64748b', fontSize: '12px', fontWeight: '500',
        }}
      >
        ✕ Não vou
      </button>
    </div>
  )
}
