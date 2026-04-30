'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface EventItem { id: string; label: string; claimedBy: string | null; claimedByName?: string | null }
interface Attendee { memberId: string | null; confirmed: boolean; contributionItem: string | null }
interface Meeting {
  id: string; title: string; description: string | null; date: string
  imageUrl: string | null; listMode: string
  items: EventItem[]
  attendees: Attendee[]
  myAttendee: Attendee | null
}

export default function CelulaReuniaoParticipantePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const id = params?.id as string

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [going, setGoing] = useState<boolean | null>(null)
  const [freeItem, setFreeItem] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [memberId, setMemberId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [meetingRes, meRes] = await Promise.all([
      fetch(`/api/membro/celula/reuniao/${id}`),
      fetch('/api/membro/me'),
    ])
    const mData = await meRes.json()
    setMemberId(mData.id ?? null)
    const data = await meetingRes.json()
    if (data.id) {
      setMeeting(data)
      setGoing(data.myAttendee?.confirmed ?? null)
      setFreeItem(data.myAttendee?.contributionItem ?? '')
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function saveRSVP(goingVal: boolean) {
    setSaving(true)
    setGoing(goingVal)
    await fetch('/api/membro/celula/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: id, going: goingVal, contributionItem: freeItem || null }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function saveFreeItem() {
    if (!freeItem.trim()) return
    setSaving(true)
    await fetch('/api/membro/celula/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: id, going: going ?? true, contributionItem: freeItem.trim() }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function claimItem(itemId: string, alreadyMine: boolean) {
    setClaimingId(itemId)
    if (alreadyMine) {
      await fetch(`/api/membro/celula/item?itemId=${itemId}`, { method: 'DELETE' })
    } else {
      await fetch('/api/membro/celula/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })
    }
    setClaimingId(null)
    load()
  }

  if (!meeting) {
    return (
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>←</button>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Carregando...</p>
      </div>
    )
  }

  const isPast = new Date(meeting.date) < new Date()
  const dateStr = new Date(meeting.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const timeStr = new Date(meeting.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b', padding: '4px' }}>←</button>
        <div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{meeting.title}</p>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>{dateStr} · {timeStr}</p>
        </div>
      </div>

      {meeting.imageUrl && (
        <img src={meeting.imageUrl} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '16px', display: 'block' }} />
      )}

      {meeting.description && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>SOBRE A REUNIÃO</p>
          <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{meeting.description}</p>
        </div>
      )}

      {/* RSVP */}
      {!isPast && (
        <div style={{
          borderRadius: '16px', padding: '16px', border: '1.5px solid',
          borderColor: going === true ? '#86efac' : going === false ? '#fca5a5' : '#e2e8f0',
          background: going === true ? '#f0fdf4' : going === false ? '#fff5f5' : 'white',
        }}>
          {going === null ? (
            <>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '12px' }}>VOCÊ VAI?</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => saveRSVP(true)} disabled={saving}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', background: '#f0fdf4', color: '#166534', border: '1.5px solid #86efac' }}>
                  ✓ Vou
                </button>
                <button onClick={() => saveRSVP(false)} disabled={saving}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', background: '#f8fafc', color: '#94a3b8', border: '1.5px solid #e2e8f0' }}>
                  ✕ Não vou
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{going ? '✅' : '❌'}</span>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: going ? '#166534' : '#991b1b', margin: 0 }}>
                    {going ? 'Confirmado!' : 'Não vou'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Presença registrada</p>
                </div>
              </div>
              <button onClick={() => setGoing(null)} disabled={saving}
                style={{ fontSize: '12px', color: '#94a3b8', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}>
                Mudar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista livre */}
      {meeting.listMode === 'free' && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '12px' }}>O QUE VOCÊ VAI LEVAR?</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={freeItem}
              onChange={e => setFreeItem(e.target.value)}
              placeholder="Ex: Bolo de chocolate, Guaraná..."
              style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '15px', outline: 'none' }}
            />
            <button onClick={saveFreeItem} disabled={saving || !freeItem.trim()}
              style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              {saving ? '...' : 'Salvar'}
            </button>
          </div>

          {/* O que os outros vão levar */}
          {meeting.attendees.filter(a => a.contributionItem).length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>O que os outros vão levar:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {meeting.attendees.filter(a => a.contributionItem).map((a, i) => (
                  <span key={i} style={{ fontSize: '13px', background: '#f1f5f9', color: '#475569', padding: '5px 10px', borderRadius: '20px' }}>
                    {a.contributionItem}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista predefinida */}
      {meeting.listMode === 'predefined' && meeting.items.length > 0 && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '12px' }}>ITENS PARA LEVAR</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {meeting.items.map(item => {
              const isMine = item.claimedBy === memberId
              const isTaken = !!item.claimedBy && !isMine
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px', borderRadius: '12px',
                  background: isMine ? '#eff6ff' : isTaken ? '#f8fafc' : 'white',
                  border: `1.5px solid ${isMine ? '#93c5fd' : '#e2e8f0'}`,
                  opacity: isTaken ? 0.7 : 1,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: isTaken ? '#94a3b8' : '#1e293b' }}>{item.label}</p>
                    {isTaken && <p style={{ fontSize: '11px', color: '#94a3b8' }}>Já escolhido</p>}
                    {isMine && <p style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600' }}>Você vai levar</p>}
                  </div>
                  {!isTaken && (
                    <button
                      onClick={() => claimItem(item.id, isMine)}
                      disabled={claimingId === item.id}
                      style={{
                        padding: '8px 14px', borderRadius: '10px', fontWeight: '600', fontSize: '13px',
                        border: 'none', cursor: 'pointer',
                        background: isMine ? '#fee2e2' : '#3b82f6',
                        color: isMine ? '#dc2626' : 'white',
                      }}>
                      {claimingId === item.id ? '...' : isMine ? 'Desistir' : 'Vou levar'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
