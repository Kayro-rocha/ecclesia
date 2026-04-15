'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Attendee = {
  id: string; name: string; phone: string | null
  confirmed: boolean; present: boolean
  member: { name: string; group: string | null } | null
}
type Event = {
  id: string; title: string; description: string | null
  date: string; location: string | null; targetGroup: string | null
  attendees: Attendee[]
}

export default function EventoPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const id = params?.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [notifyResult, setNotifyResult] = useState<string | null>(null)

  const appDomain = typeof window !== 'undefined'
    ? window.location.hostname.split('.').slice(1).join('.')
    : 'marketcontroll.com'
  const eventLink = typeof window !== 'undefined'
    ? `${window.location.protocol}//${slug}.${appDomain}/evento/${id}`
    : ''

  async function load() {
    const res = await fetch(`/api/events/${id}`)
    const data = await res.json()
    setEvent(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function togglePresent(attendeeId: string, present: boolean) {
    await fetch(`/api/events/${id}/attend`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendeeId, present }),
    })
    load()
  }

  async function handleDelete() {
    if (!confirm(`Apagar o evento "${event?.title}"? Isso remove todas as confirmações.`)) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    router.push(`/${slug}/eventos`)
  }

  function copyLink() {
    navigator.clipboard.writeText(eventLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleNotify() {
    if (!confirm('Enviar notificação push para todos os membros que aceitaram receber alertas?')) return
    setNotifying(true)
    setNotifyResult(null)
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        title: event?.title,
        body: `📅 ${new Date(event!.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} · ${event?.location || ''}`,
        url: eventLink,
      }),
    })
    const data = await res.json()
    setNotifyResult(data.sent === 0 ? 'Nenhum membro inscrito ainda.' : `Notificação enviada para ${data.sent} membro(s)!`)
    setNotifying(false)
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: '#a0aec0' }}>Carregando...</p></div>
  if (!event) return null

  const confirmados = event.attendees.filter(a => a.confirmed)
  const presentes = event.attendees.filter(a => a.present)
  const dataEvento = new Date(event.date)
  const passado = dataEvento < new Date()

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/eventos`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Eventos</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>{event.title}</span>
        </div>
        <button onClick={handleDelete} style={{ background: 'none', border: '1.5px solid #fed7d7', color: '#e53e3e', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
          Apagar evento
        </button>
      </div>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* Painel esquerdo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Detalhes</h2>
            <div style={{ fontSize: '14px', color: '#718096' }}>
              <div>📅 {dataEvento.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
              <div style={{ marginTop: '4px' }}>🕐 {dataEvento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              {event.location && <div style={{ marginTop: '4px' }}>📍 {event.location}</div>}
              {event.targetGroup && <div style={{ marginTop: '4px' }}>👥 {event.targetGroup}</div>}
            </div>
            {event.description && (
              <p style={{ fontSize: '13px', color: '#4a5568', margin: 0, lineHeight: 1.6 }}>{event.description}</p>
            )}
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Link de confirmação</h2>
            <p style={{ fontSize: '12px', color: '#718096', margin: 0 }}>Compartilhe com os membros para que confirmem presença</p>
            <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#4a5568', wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {eventLink}
            </div>
            <button onClick={copyLink} className="btn-primary" style={{ fontSize: '13px' }}>
              {copied ? '✓ Copiado!' : 'Copiar link'}
            </button>
            <button
              onClick={handleNotify}
              disabled={notifying}
              style={{ width: '100%', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: notifying ? 0.7 : 1 }}
            >
              {notifying ? 'Enviando...' : '🔔 Notificar membros'}
            </button>
            {notifyResult && (
              <p style={{ fontSize: '12px', color: '#718096', margin: 0, textAlign: 'center' }}>{notifyResult}</p>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a2e' }}>{confirmados.length}</div>
                <div style={{ fontSize: '12px', color: '#718096' }}>Confirmados</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#48bb78' }}>{presentes.length}</div>
                <div style={{ fontSize: '12px', color: '#718096' }}>Presentes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de confirmados */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #edf2f7' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>
              {passado ? 'Marcar presença real' : 'Confirmações'}
            </h2>
            {passado && <p style={{ fontSize: '12px', color: '#718096', margin: '4px 0 0' }}>Clique para marcar quem realmente apareceu</p>}
          </div>

          {confirmados.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#a0aec0', fontSize: '14px' }}>
              Nenhuma confirmação ainda. Compartilhe o link do evento.
            </div>
          ) : (
            <div>
              {confirmados.map(a => (
                <div
                  key={a.id}
                  onClick={() => passado && togglePresent(a.id, !a.present)}
                  style={{
                    padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px',
                    borderBottom: '1px solid #f7fafc',
                    cursor: passado ? 'pointer' : 'default',
                    background: a.present ? '#f0fff4' : 'white',
                  }}
                >
                  {passado && (
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
                      background: a.present ? '#48bb78' : 'white',
                      border: `2px solid ${a.present ? '#48bb78' : '#e2e8f0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {a.present && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>{a.name}</div>
                    {a.member?.group && <div style={{ fontSize: '12px', color: '#a0aec0' }}>{a.member.group}</div>}
                  </div>
                  {!passado && <span className="badge-green" style={{ fontSize: '11px' }}>✓ Confirmado</span>}
                  {passado && a.present && <span className="badge-green" style={{ fontSize: '11px' }}>Presente</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
