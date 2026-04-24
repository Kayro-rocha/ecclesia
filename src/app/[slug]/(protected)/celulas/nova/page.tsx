'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

interface Member { id: string; name: string; group?: string }

export default function NovaCelulaPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', leaderId: '', dayOfWeek: '2' })
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  useEffect(() => {
    fetch(`/api/members?slug=${slug}`)
      .then(r => r.json())
      .then(data => setMembers(Array.isArray(data) ? data : []))
  }, [slug])

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggleMember(id: string) {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.leaderId) return
    setLoading(true)
    const res = await fetch('/api/cells', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug, memberIds: selectedMembers }),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/${slug}/celulas/${data.id}`)
    } else {
      setLoading(false)
    }
  }

  const leader = members.find(m => m.id === form.leaderId)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/celulas`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Células</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Nova célula</span>
        </div>
      </div>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontWeight: '600', color: '#1a1a2e', marginBottom: '4px' }}>Informações da célula</p>
            <div>
              <label>Nome da célula *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Ex: Célula Jovens, Célula Norte..." />
            </div>
            <div>
              <label>Líder responsável *</label>
              <select value={form.leaderId} onChange={e => setForm(p => ({ ...p, leaderId: e.target.value }))} required>
                <option value="">Selecione o líder</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Dia da semana *</label>
              <select value={form.dayOfWeek} onChange={e => setForm(p => ({ ...p, dayOfWeek: e.target.value }))}>
                {DIAS_SEMANA.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontWeight: '600', color: '#1a1a2e' }}>
              Membros da célula{' '}
              {selectedMembers.length > 0 && (
                <span style={{ fontSize: '13px', fontWeight: '400', color: '#718096' }}>
                  — {selectedMembers.length} selecionado{selectedMembers.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar membro..."
            />
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredMembers.map(m => {
                const selected = selectedMembers.includes(m.id)
                const isLeader = m.id === form.leaderId
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => !isLeader && toggleMember(m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '8px', border: 'none',
                      background: selected || isLeader ? 'var(--primary-light)' : '#f8fafc',
                      cursor: isLeader ? 'default' : 'pointer', textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: selected || isLeader ? 'var(--primary)' : '#e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: selected || isLeader ? 'white' : '#718096',
                      fontSize: '12px', fontWeight: '600',
                    }}>
                      {selected || isLeader ? '✓' : m.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>
                        {m.name}
                        {isLeader && <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--primary)' }}>líder</span>}
                      </p>
                      {m.group && <p style={{ fontSize: '11px', color: '#a0aec0' }}>{m.group}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href={`/${slug}/celulas`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>Cancelar</Link>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
              {loading ? 'Criando...' : 'Criar célula'}
            </button>
          </div>
        </form>

        {/* Preview */}
        <div className="card">
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', marginBottom: '16px' }}>Prévia</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>{form.name || 'Nome da célula'}</p>
              <p style={{ fontSize: '13px', color: '#718096', marginTop: '2px' }}>
                {DIAS_SEMANA[parseInt(form.dayOfWeek)]}s
              </p>
            </div>
            {leader && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: '600', fontSize: '13px' }}>
                  {leader.name.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{leader.name.split(' ').slice(0, 2).join(' ')}</p>
                  <p style={{ fontSize: '11px', color: '#a0aec0' }}>Líder</p>
                </div>
              </div>
            )}
            <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '10px' }}>
              <p style={{ fontSize: '12px', color: '#a0aec0' }}>{selectedMembers.length} membro{selectedMembers.length !== 1 ? 's' : ''} selecionado{selectedMembers.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
