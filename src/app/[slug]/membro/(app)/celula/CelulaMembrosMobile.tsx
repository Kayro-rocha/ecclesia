'use client'

import { useState, useCallback } from 'react'
import { useModal } from '@/lib/useModal'

interface Membro { id: string; name: string; phone?: string | null }

interface Props {
  membrosIniciais: Membro[]
  slug: string
}

export default function CelulaMembrosMobile({ membrosIniciais, slug }: Props) {
  const { confirm, modalNode } = useModal()
  const [membros, setMembros] = useState<Membro[]>(membrosIniciais)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [available, setAvailable] = useState<Membro[]>([])
  const [loadingAdd, setLoadingAdd] = useState<string | null>(null)
  const [loadingRemove, setLoadingRemove] = useState<string | null>(null)

  const openAdd = useCallback(async () => {
    setAdding(true)
    setSearch('')
    const res = await fetch('/api/membro/celula/members')
    const data = await res.json()
    setAvailable(data.available ?? [])
  }, [])

  const filtrados = available.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  async function adicionar(membro: Membro) {
    setLoadingAdd(membro.id)
    const res = await fetch('/api/membro/celula/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: membro.id }),
    })
    if (res.ok) {
      setMembros(prev => [...prev, membro].sort((a, b) => a.name.localeCompare(b.name)))
      setAvailable(prev => prev.filter(m => m.id !== membro.id))
    }
    setLoadingAdd(null)
  }

  async function remover(membro: Membro) {
    if (!await confirm(`Remover ${membro.name.split(' ')[0]} da célula?`)) return
    setLoadingRemove(membro.id)
    const res = await fetch(`/api/membro/celula/members?memberId=${membro.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMembros(prev => prev.filter(m => m.id !== membro.id))
      setAvailable(prev => [...prev, membro].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setLoadingRemove(null)
  }

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Membros ({membros.length})
        </p>
        <button
          onClick={adding ? () => setAdding(false) : openAdd}
          style={{ fontSize: '13px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
        >
          {adding ? 'Fechar' : '+ Adicionar'}
        </button>
      </div>

      {/* Painel de busca */}
      {adding && (
        <div style={{ marginBottom: '12px', background: '#f8fafc', borderRadius: '12px', padding: '12px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar membro da igreja..."
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px',
              borderRadius: '10px', border: '1.5px solid #e2e8f0',
              fontSize: '14px', outline: 'none', fontFamily: 'inherit',
            }}
            autoFocus
          />
          <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filtrados.length === 0 && (
              <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
                {search ? 'Nenhum resultado' : 'Todos os membros já estão na célula'}
              </p>
            )}
            {filtrados.map(m => (
              <button
                key={m.id}
                onClick={() => adicionar(m)}
                disabled={loadingAdd === m.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 8px', border: 'none', borderRadius: '10px',
                  background: loadingAdd === m.id ? '#eff6ff' : 'white',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#eff6ff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '13px', fontWeight: '700',
                  color: '#3b82f6', flexShrink: 0,
                }}>
                  {m.name.charAt(0)}
                </div>
                <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                  {loadingAdd === m.id ? 'Adicionando...' : m.name.split(' ').slice(0, 2).join(' ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista atual */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {membros.length === 0 && !adding && (
          <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
            Nenhum membro na célula ainda
          </p>
        )}
        {membros.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '700', color: '#3b82f6', flexShrink: 0,
            }}>
              {m.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                {m.name.split(' ').slice(0, 2).join(' ')}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {m.phone && (
                <a
                  href={`https://wa.me/55${m.phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ width: '32px', height: '32px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
              <button
                onClick={() => remover(m)}
                disabled={loadingRemove === m.id}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                  background: '#fee2e2', color: '#dc2626', cursor: 'pointer',
                  fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: loadingRemove === m.id ? 0.5 : 1,
                }}
                title="Remover da célula"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      {modalNode}
    </div>
  )
}
