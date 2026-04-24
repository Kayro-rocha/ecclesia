'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

interface Member { id: string; name: string }

interface Props {
  cellId: string
  slug: string
  cell: { name: string; leaderId: string; dayOfWeek: number }
  allMembers: Member[]
}

export default function CelulaActions({ cellId, slug, cell, allMembers }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: cell.name,
    leaderId: cell.leaderId,
    dayOfWeek: String(cell.dayOfWeek),
  })

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/cells/${cellId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, leaderId: form.leaderId, dayOfWeek: form.dayOfWeek }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/cells/${cellId}`, { method: 'DELETE' })
    router.push(`/${slug}/celulas`)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setEditing(true)}
          style={{
            padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: '8px',
            background: 'white', color: '#374151', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}
        >
          Editar
        </button>
        <button
          onClick={() => { if (confirm('Excluir esta célula? Esta ação não pode ser desfeita.')) handleDelete() }}
          disabled={deleting}
          style={{
            padding: '8px 14px', border: 'none', borderRadius: '8px',
            background: '#fee2e2', color: '#dc2626', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}
        >
          {deleting ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>

      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '24px',
            width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1a1a2e' }}>Editar célula</h2>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: '#a0aec0', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Nome</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Líder</label>
                <select
                  value={form.leaderId}
                  onChange={e => setForm(p => ({ ...p, leaderId: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  {allMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Dia da semana</label>
                <select
                  value={form.dayOfWeek}
                  onChange={e => setForm(p => ({ ...p, dayOfWeek: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  {DIAS.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  style={{ flex: 1, padding: '11px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', color: '#64748b', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '8px', background: '#3b82f6', color: 'white', fontSize: '14px', fontWeight: '600', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
