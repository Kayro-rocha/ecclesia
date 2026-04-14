'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Member {
  id: string
  name: string
  group: string | null
}

interface Group {
  id: string
  name: string
}

interface Item {
  memberId: string
  memberName: string
  role: string
}

export default function EditarEscalaPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const id = params?.id as string

  const [membros, setMembros] = useState<Member[]>([])
  const [grupos, setGrupos] = useState<Group[]>([])
  const [filtroMembros, setFiltroMembros] = useState('todos')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [foiEnviada, setFoiEnviada] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', department: '' })
  const [items, setItems] = useState<Item[]>([])
  const [novoItem, setNovoItem] = useState({ memberId: '', role: '' })

  useEffect(() => {
    Promise.all([
      fetch(`/api/members?slug=${slug}`).then(r => r.json()),
      fetch(`/api/groups?slug=${slug}`).then(r => r.json()),
      fetch(`/api/schedules/${id}`).then(r => r.json()),
    ]).then(([membrosData, gruposData, escala]) => {
      setMembros(membrosData)
      setGrupos(gruposData)
      setFoiEnviada(escala.sentViaWhatsapp)

      const dateLocal = new Date(escala.date)
      const pad = (n: number) => String(n).padStart(2, '0')
      const dateStr = `${dateLocal.getFullYear()}-${pad(dateLocal.getMonth() + 1)}-${pad(dateLocal.getDate())}T${pad(dateLocal.getHours())}:${pad(dateLocal.getMinutes())}`

      setForm({ title: escala.title, date: dateStr, department: escala.department })
      setFiltroMembros(escala.department || 'todos')
      setItems(escala.items.map((i: { memberId: string; member: { name: string }; role: string }) => ({
        memberId: i.memberId,
        memberName: i.member.name,
        role: i.role,
      })))
      setLoadingData(false)
    })
  }, [slug, id])

  const membrosFiltrados = filtroMembros === 'todos'
    ? membros
    : membros.filter(m => m.group === filtroMembros)

  function onDepartmentChange(name: string) {
    setForm(p => ({ ...p, department: name }))
    setFiltroMembros(name || 'todos')
    setNovoItem({ memberId: '', role: '' })
  }

  function onMembroSelect(memberId: string) {
    const membro = membros.find(m => m.id === memberId)
    setNovoItem(p => ({ ...p, memberId, role: membro?.group || '' }))
  }

  function adicionarItem() {
    if (!novoItem.memberId || !novoItem.role) return
    if (items.some(i => i.memberId === novoItem.memberId)) return alert('Membro já adicionado')
    const membro = membros.find(m => m.id === novoItem.memberId)
    if (!membro) return
    setItems(prev => [...prev, { memberId: novoItem.memberId, memberName: membro.name, role: novoItem.role }])
    setNovoItem({ memberId: '', role: '' })
  }

  function removerItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return alert('Adicione pelo menos um voluntário')
    setLoading(true)

    const res = await fetch(`/api/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items }),
    })

    if (res.ok) router.push(`/${slug}/escalas`)
    else setLoading(false)
  }

  if (loadingData) {
    return (
      <div>
        <div className="page-header">
          <span style={{ color: '#a0aec0', fontSize: '14px' }}>Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/escalas`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Escalas</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Editar escala</span>
          {foiEnviada && (
            <span style={{ fontSize: '12px', background: '#fffff0', color: '#744210', padding: '3px 10px', borderRadius: '20px', marginLeft: '4px' }}>
              ⚠ Já enviada via WhatsApp
            </span>
          )}
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label>Título *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Culto domingo 19h" required />
            </div>
            <div>
              <label>Data *</label>
              <input type="datetime-local" value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
            </div>
            <div>
              <label>Departamento *</label>
              <select value={form.department} onChange={e => onDepartmentChange(e.target.value)} required>
                <option value="">Selecionar departamento</option>
                {grupos.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e' }}>Voluntários</p>
              {form.department && (
                <button
                  type="button"
                  onClick={() => setFiltroMembros(prev => prev === 'todos' ? form.department : 'todos')}
                  style={{
                    fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer',
                    color: filtroMembros === 'todos' ? '#667eea' : '#a0aec0',
                  }}
                >
                  {filtroMembros === 'todos' ? '✓ Ver todos' : `Filtrar: ${form.department}`}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <select value={novoItem.memberId} onChange={e => onMembroSelect(e.target.value)} style={{ flex: 1 }}>
                <option value="">Selecionar membro</option>
                {membrosFiltrados.map(m => (
                  <option key={m.id} value={m.id}>{m.name}{m.group ? ` (${m.group})` : ''}</option>
                ))}
              </select>
              <input
                value={novoItem.role}
                onChange={e => setNovoItem(p => ({ ...p, role: e.target.value }))}
                placeholder="Função"
                style={{ width: '140px' }}
              />
              <button type="button" onClick={adicionarItem} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                + Adicionar
              </button>
            </div>

            {items.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#a0aec0', textAlign: 'center', padding: '16px 0' }}>
                Nenhum voluntário adicionado
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#f8f9fb', borderRadius: '8px', padding: '10px 14px',
                  }}>
                    <div>
                      <span style={{ fontSize: '14px', color: '#1a1a2e' }}>{item.memberName}</span>
                      <span style={{ fontSize: '12px', color: '#a0aec0', marginLeft: '8px' }}>· {item.role}</span>
                    </div>
                    <button type="button" onClick={() => removerItem(idx)}
                      style={{ fontSize: '12px', color: '#fc8181', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href={`/${slug}/escalas`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Cancelar
            </Link>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, textAlign: 'center' }}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
