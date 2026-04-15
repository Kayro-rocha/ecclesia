'use client'

import { useEffect, useState } from 'react'

interface Props {
  slug: string
  memberId: string
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

async function subscribeAndSend(slug: string, memberId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  const reg = await navigator.serviceWorker.ready

  const existing = await reg.pushManager.getSubscription()
  const sub = existing ?? await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
  })

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, subscription: sub.toJSON(), memberId }),
  })
}

export default function PushActivar({ slug, memberId }: Props) {
  const [permissao, setPermissao] = useState<NotificationPermission | null>(null)
  const [ativando, setAtivando] = useState(false)
  const [dispensado, setDispensado] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) return

    const perm = Notification.permission
    setPermissao(perm)

    // Já concedido → registra silenciosamente vinculando ao membro
    if (perm === 'granted') {
      subscribeAndSend(slug, memberId).catch(() => {})
    }
  }, [slug, memberId])

  async function ativar() {
    setAtivando(true)
    try {
      const perm = await Notification.requestPermission()
      setPermissao(perm)
      if (perm === 'granted') {
        await subscribeAndSend(slug, memberId)
      }
    } catch {
      // silencioso
    } finally {
      setAtivando(false)
      setDispensado(true)
    }
  }

  // Não exibe nada se: não suportado, já concedido/negado, ou dispensado
  if (!permissao || permissao !== 'default' || dispensado) return null

  return (
    <div style={{
      margin: '12px 16px 0',
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '14px',
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <span style={{ fontSize: '22px', flexShrink: 0 }}>🔔</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: '#1e40af' }}>
          Ativar notificações
        </p>
        <p style={{ margin: 0, fontSize: '11px', color: '#3b82f6' }}>
          Receba avisos e escalas em tempo real
        </p>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button
          onClick={() => setDispensado(true)}
          style={{
            padding: '6px 10px', borderRadius: '8px', border: '1px solid #bfdbfe',
            background: 'white', color: '#64748b', fontSize: '12px', cursor: 'pointer',
          }}
        >
          Agora não
        </button>
        <button
          onClick={ativar}
          disabled={ativando}
          style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none',
            background: '#3b82f6', color: 'white', fontSize: '12px', fontWeight: '600',
            cursor: ativando ? 'not-allowed' : 'pointer',
          }}
        >
          {ativando ? '...' : 'Ativar'}
        </button>
      </div>
    </div>
  )
}
