'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CellMember { id: string; name: string }
interface Attendee { memberId: string; name: string; present: boolean }
interface Visitor { id: string; name: string | null; phone: string | null }

interface Props {
  slug: string
  event: { id: string; title: string; date: string; imageUrl: string | null; description: string | null }
  cellMembers: CellMember[]
  existingAttendees: Attendee[]
  visitors: Visitor[]
}

export default function ReuniaoClient({ slug, event, cellMembers, existingAttendees, visitors: initialVisitors }: Props) {
  const router = useRouter()
  const existingMap = new Map(existingAttendees.map(a => [a.memberId, a.present]))

  const [attendance, setAttendance] = useState<Map<string, boolean>>(() => {
    const m = new Map<string, boolean>()
    cellMembers.forEach(cm => m.set(cm.id, existingMap.get(cm.id) ?? false))
    return m
  })
  const [visitors, setVisitors] = useState<Visitor[]>(initialVisitors)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [visitorName, setVisitorName] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')
  const [addingVisitor, setAddingVisitor] = useState(false)
  const [addingVisitorLoading, setAddingVisitorLoading] = useState(false)

  function togglePresence(memberId: string) {
    setAttendance(prev => {
      const next = new Map(prev)
      next.set(memberId, !next.get(memberId))
      return next
    })
    setSaved(false)
  }

  async function saveAttendance() {
    setSaving(true)
    const attendees = cellMembers.map(m => ({
      memberId: m.id,
      name: m.name,
      present: attendance.get(m.id) ?? false,
    }))
    await fetch(`/api/membro/celula/${event.id}/presenca`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendees }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function addVisitor() {
    if (!visitorName.trim()) return
    setAddingVisitorLoading(true)
    const res = await fetch(`/api/membro/celula/${event.id}/visitante`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: visitorName.trim(), phone: visitorPhone.trim() || null }),
    })
    if (res.ok) {
      const data = await res.json()
      setVisitors(prev => [...prev, { id: data.id, name: visitorName.trim(), phone: visitorPhone.trim() || null }])
      setVisitorName('')
      setVisitorPhone('')
      setAddingVisitor(false)
    }
    setAddingVisitorLoading(false)
  }

  async function removeVisitor(id: string) {
    await fetch(`/api/membro/celula/${event.id}/visitante?attendeeId=${id}`, { method: 'DELETE' })
    setVisitors(prev => prev.filter(v => v.id !== id))
  }

  const presentCount = Array.from(attendance.values()).filter(Boolean).length

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b', padding: '4px' }}>←</button>
        <div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{event.title}</p>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            {new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
      </div>

      {event.imageUrl && (
        <img src={event.imageUrl} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '16px', display: 'block' }} />
      )}

      {/* Presença */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Presença</p>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>{presentCount} de {cellMembers.length} presentes</p>
          </div>
          <button
            onClick={saveAttendance}
            disabled={saving}
            style={{
              background: saved ? '#dcfce7' : '#3b82f6',
              color: saved ? '#166534' : 'white',
              border: 'none', borderRadius: '10px',
              padding: '8px 16px', fontSize: '13px', fontWeight: '600',
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saved ? '✓ Salvo' : saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {cellMembers.map(m => {
            const present = attendance.get(m.id) ?? false
            return (
              <button
                key={m.id}
                onClick={() => togglePresence(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px', borderRadius: '10px', border: 'none',
                  background: present ? '#f0fdf4' : '#f8fafc',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: present ? '#16a34a' : '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: present ? 'white' : '#94a3b8', fontSize: '14px', fontWeight: '700',
                }}>
                  {present ? '✓' : m.name.charAt(0)}
                </div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: present ? '#166534' : '#475569' }}>
                  {m.name.split(' ').slice(0, 2).join(' ')}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Visitantes */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Visitantes</p>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>{visitors.length} nesta reunião</p>
          </div>
          <button
            onClick={() => setAddingVisitor(p => !p)}
            style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            {addingVisitor ? 'Cancelar' : '+ Adicionar'}
          </button>
        </div>

        {addingVisitor && (
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              value={visitorName}
              onChange={e => setVisitorName(e.target.value)}
              placeholder="Nome do visitante *"
              style={{ padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', color: '#1e293b', background: 'white' }}
            />
            <input
              value={visitorPhone}
              onChange={e => setVisitorPhone(e.target.value)}
              placeholder="Telefone (opcional)"
              type="tel"
              style={{ padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', color: '#1e293b', background: 'white' }}
            />
            <button
              onClick={addVisitor}
              disabled={!visitorName.trim() || addingVisitorLoading}
              style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              {addingVisitorLoading ? 'Salvando...' : 'Registrar visitante'}
            </button>
          </div>
        )}

        {visitors.length === 0 && !addingVisitor ? (
          <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
            Nenhum visitante nesta reunião
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {visitors.map(v => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#3b82f6', flexShrink: 0 }}>
                  {v.name?.charAt(0) ?? '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{v.name}</p>
                  {v.phone && <p style={{ fontSize: '12px', color: '#94a3b8' }}>{v.phone}</p>}
                </div>
                <button onClick={() => removeVisitor(v.id)}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '18px', cursor: 'pointer', padding: '0 4px' }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
