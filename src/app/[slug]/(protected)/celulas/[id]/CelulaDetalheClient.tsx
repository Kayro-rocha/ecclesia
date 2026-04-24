'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Member { id: string; name: string; phone?: string | null; group?: string | null }

interface Props {
  cellId: string
  slug: string
  members: Member[]
  allMembers: Member[]
  cellLeaderId: string
}

export default function CelulaDetalheClient({ cellId, slug, members, allMembers, cellLeaderId }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const currentIds = new Set(members.map(m => m.id))
  const available = allMembers.filter(m =>
    !currentIds.has(m.id) && m.name.toLowerCase().includes(search.toLowerCase())
  )

  async function addMember(memberId: string) {
    setLoading(memberId)
    await fetch(`/api/cells/${cellId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    setLoading(null)
    setAdding(false)
    setSearch('')
    router.refresh()
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remover este membro da célula?')) return
    setLoading(memberId)
    await fetch(`/api/cells/${cellId}/members?memberId=${memberId}`, { method: 'DELETE' })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase' }}>
          Membros ({members.length})
        </p>
        <button
          onClick={() => setAdding(p => !p)}
          style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
        >
          {adding ? 'Cancelar' : '+ Adicionar'}
        </button>
      </div>

      {adding && (
        <div style={{ marginBottom: '12px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar membro..." />
          <div style={{ maxHeight: '180px', overflowY: 'auto', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {available.slice(0, 20).map(m => (
              <button
                key={m.id}
                onClick={() => addMember(m.id)}
                disabled={loading === m.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px',
                  border: 'none', borderRadius: '6px', background: '#f8fafc',
                  cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#1a1a2e',
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--primary)', fontWeight: '600', flexShrink: 0 }}>
                  {m.name.charAt(0)}
                </div>
                {loading === m.id ? 'Adicionando...' : m.name.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
            {available.length === 0 && (
              <p style={{ fontSize: '13px', color: '#a0aec0', padding: '8px', textAlign: 'center' }}>Nenhum membro disponível</p>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {members.map(m => {
          const isLeader = m.id === cellLeaderId
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--primary)', fontWeight: '600', flexShrink: 0 }}>
                {m.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.name.split(' ').slice(0, 2).join(' ')}
                  {isLeader && <span style={{ marginLeft: '6px', fontSize: '10px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '10px' }}>líder</span>}
                </p>
                {m.group && <p style={{ fontSize: '11px', color: '#a0aec0' }}>{m.group}</p>}
              </div>
              {!isLeader && (
                <button
                  onClick={() => removeMember(m.id)}
                  disabled={loading === m.id}
                  style={{ fontSize: '16px', color: '#cbd5e0', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}
                  title="Remover"
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
        {members.length === 0 && (
          <p style={{ fontSize: '13px', color: '#a0aec0', textAlign: 'center', padding: '12px 0' }}>
            Nenhum membro na célula
          </p>
        )}
      </div>
    </div>
  )
}
