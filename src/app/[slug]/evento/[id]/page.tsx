'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Member = { id: string; name: string; phone: string }
type Event = {
  id: string; title: string; description: string | null
  date: string; location: string | null; imageUrl: string | null
  attendees: { memberId: string | null; phone: string | null; confirmed: boolean }[]
}

export default function EventoPublicoPage() {
  const params = useParams()
  const slug = params?.slug as string
  const id = params?.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [step, setStep] = useState<'loading' | 'identify' | 'confirm' | 'done'>('loading')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Member | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pushStatus, setPushStatus] = useState<'idle' | 'subscribed' | 'denied' | 'loading'>('idle')

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/${id}`).then(r => r.json()),
      fetch(`/api/members?slug=${slug}`).then(r => r.json()),
    ]).then(([ev, mb]) => {
      setEvent(ev)
      setMembers(Array.isArray(mb) ? mb : [])
      setStep('identify')
    })
  }, [id, slug])

  async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setPushStatus('loading')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, subscription: sub.toJSON() }),
      })
      setPushStatus('subscribed')
    } catch {
      setPushStatus('denied')
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const output = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
    return output
  }

  const membersFiltrados = search.length >= 2
    ? members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    : []

  function selectMember(m: Member) {
    setSelected(m)
    // Verifica se já confirmou
    const existing = event?.attendees.find(a => a.memberId === m.id)
    setConfirmed(existing?.confirmed ?? false)
    setStep('confirm')
  }

  async function handleConfirm(newConfirmed: boolean) {
    setSaving(true)
    await fetch(`/api/events/${id}/attend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        selected
          ? { memberId: selected.id, name: selected.name, phone: selected.phone, confirmed: newConfirmed }
          : { name: guestName, phone: guestPhone, confirmed: newConfirmed }
      ),
    })
    setConfirmed(newConfirmed)
    setSaving(false)
    setStep('done')
  }

  if (step === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#a0aec0' }}>Carregando...</p>
      </div>
    )
  }

  if (!event) return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#a0aec0' }}>Evento não encontrado.</p>
    </div>
  )

  const dataEvento = new Date(event.date)

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #edf2f7', padding: '32px', width: '100%', maxWidth: '440px' }}>

        {/* Header do evento */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px', display: 'block' }} />
          ) : (
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎉</div>
          )}
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px' }}>{event.title}</h1>
          <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>
            📅 {dataEvento.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            {' · '}
            🕐 {dataEvento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {event.location && <p style={{ fontSize: '13px', color: '#a0aec0', margin: '4px 0 0' }}>📍 {event.location}</p>}
          {event.description && (
            <p style={{ fontSize: '14px', color: '#4a5568', margin: '16px 0 0', lineHeight: 1.6, textAlign: 'left', background: '#f7fafc', borderRadius: '8px', padding: '12px' }}>
              {event.description}
            </p>
          )}
        </div>

        {/* Step: identificar */}
        {step === 'identify' && (
          <div>
            <p style={{ fontSize: '14px', color: '#718096', textAlign: 'center', marginBottom: '16px' }}>
              Quem é você? Busque seu nome para confirmar presença.
            </p>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Digite seu nome..."
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box' }}
            />
            {membersFiltrados.length > 0 && (
              <div style={{ marginTop: '8px', border: '1px solid #edf2f7', borderRadius: '8px', overflow: 'hidden' }}>
                {membersFiltrados.slice(0, 6).map(m => (
                  <div
                    key={m.id}
                    onClick={() => selectMember(m)}
                    style={{ padding: '10px 14px', fontSize: '14px', color: '#1a1a2e', cursor: 'pointer', borderBottom: '1px solid #f7fafc' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f7fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    {m.name}
                  </div>
                ))}
              </div>
            )}
            {search.length >= 2 && membersFiltrados.length === 0 && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontSize: '13px', color: '#a0aec0', textAlign: 'center', marginBottom: '12px' }}>
                  Não encontrou? Informe seus dados:
                </p>
                <input
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="Nome completo"
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }}
                />
                <input
                  value={guestPhone}
                  onChange={e => setGuestPhone(e.target.value)}
                  placeholder="WhatsApp"
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
                />
                {guestName && (
                  <button
                    onClick={() => setStep('confirm')}
                    style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Continuar
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step: confirmar */}
        {step === 'confirm' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: '#1a1a2e', marginBottom: '24px' }}>
              Olá, <strong>{selected?.name || guestName}</strong>! Você vai participar?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleConfirm(false)}
                disabled={saving}
                style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1.5px solid #fed7d7', background: 'white', color: '#e53e3e', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
              >
                ✗ Não vou
              </button>
              <button
                onClick={() => handleConfirm(true)}
                disabled={saving}
                style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', background: '#48bb78', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
              >
                ✓ Vou!
              </button>
            </div>
          </div>
        )}

        {/* Step: concluído */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{confirmed ? '🎉' : '😢'}</div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px' }}>
              {confirmed ? 'Presença confirmada!' : 'Tudo bem!'}
            </h2>
            <p style={{ fontSize: '14px', color: '#718096', margin: '0 0 20px' }}>
              {confirmed
                ? `Te vemos em ${dataEvento.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}! 🙌`
                : 'Você pode confirmar depois se mudar de ideia.'}
            </p>

            {/* Botão de push notification */}
            {'serviceWorker' in navigator && 'PushManager' in window && pushStatus !== 'subscribed' && pushStatus !== 'denied' && (
              <button
                onClick={subscribeToPush}
                disabled={pushStatus === 'loading'}
                style={{
                  width: '100%', background: '#7c3aed', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', marginBottom: '12px', opacity: pushStatus === 'loading' ? 0.7 : 1,
                }}
              >
                {pushStatus === 'loading' ? 'Ativando...' : '🔔 Receber notificações da igreja'}
              </button>
            )}
            {pushStatus === 'subscribed' && (
              <p style={{ fontSize: '13px', color: '#48bb78', marginBottom: '12px' }}>✓ Notificações ativadas!</p>
            )}
            {pushStatus === 'denied' && (
              <p style={{ fontSize: '13px', color: '#a0aec0', marginBottom: '12px' }}>Permissão negada pelo navegador.</p>
            )}

            {!confirmed && (
              <button
                onClick={() => { setConfirmed(false); setStep('confirm') }}
                style={{ background: 'none', border: 'none', color: '#4299e1', fontSize: '14px', cursor: 'pointer' }}
              >
                Mudei de ideia — quero confirmar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
