'use client'

import { useState } from 'react'

interface PrayerRequest {
  id: string
  request: string
  status: 'PENDING' | 'PRAYED'
  createdAt: string
  member: { name: string; group: string | null }
}

interface Props {
  initial: PrayerRequest[]
}

export default function OracoesClient({ initial }: Props) {
  const [pedidos, setPedidos] = useState(initial)
  const [filtro, setFiltro] = useState<'TODOS' | 'PENDING' | 'PRAYED'>('TODOS')
  const [carregando, setCarregando] = useState<string | null>(null)

  async function toggleStatus(id: string, status: 'PENDING' | 'PRAYED') {
    const novoStatus = status === 'PENDING' ? 'PRAYED' : 'PENDING'
    setCarregando(id)
    try {
      const res = await fetch(`/api/prayer-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) throw new Error()
      setPedidos(p => p.map(r => r.id === id ? { ...r, status: novoStatus } : r))
    } catch {
      alert('Erro ao atualizar. Tente novamente.')
    } finally {
      setCarregando(null)
    }
  }

  const filtrados = pedidos.filter(p => filtro === 'TODOS' || p.status === filtro)
  const pendentes = pedidos.filter(p => p.status === 'PENDING').length

  const tabs: { key: typeof filtro; label: string }[] = [
    { key: 'TODOS',   label: 'Todos' },
    { key: 'PENDING', label: 'Novos' },
    { key: 'PRAYED',  label: 'Orados' },
  ]

  return (
    <>
      {/* Abas de filtro */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFiltro(t.key)}
            style={{
              padding: '7px 18px', cursor: 'pointer',
              borderRadius: '20px', fontSize: '13px', fontWeight: '600',
              background: filtro === t.key ? 'var(--primary)' : 'white',
              color: filtro === t.key ? 'white' : '#64748b',
              border: filtro === t.key ? 'none' : '1.5px solid #e2e8f0',
            } as React.CSSProperties}
          >
            {t.label}
            {t.key === 'PENDING' && pendentes > 0 && (
              <span style={{
                marginLeft: '6px', background: '#dc2626', color: 'white',
                borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                padding: '1px 6px',
              }}>
                {pendentes}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🙏</div>
          <p style={{ fontSize: '14px' }}>
            {filtro === 'PENDING' ? 'Nenhum pedido novo.' : 'Nenhum pedido encontrado.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtrados.map(p => (
            <div
              key={p.id}
              style={{
                background: 'white', borderRadius: '12px', padding: '18px 20px',
                border: p.status === 'PENDING' ? '1.5px solid #e9d5ff' : '1px solid #edf2f7',
                opacity: p.status === 'PRAYED' ? 0.7 : 1,
              }}
            >
              {/* Cabeçalho do card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: '#ede9fe', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#7c3aed',
                      flexShrink: 0,
                    }}>
                      {p.member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                        {p.member.name}
                      </p>
                      {p.member.group && (
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{p.member.group}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
                    background: p.status === 'PRAYED' ? '#dcfce7' : '#ede9fe',
                    color: p.status === 'PRAYED' ? '#16a34a' : '#7c3aed',
                  }}>
                    {p.status === 'PRAYED' ? '✓ Orado' : '🙏 Novo'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Texto do pedido */}
              <p style={{
                margin: '0 0 14px', fontSize: '14px', color: '#374151',
                lineHeight: 1.7, whiteSpace: 'pre-wrap',
                background: '#faf5ff', borderRadius: '8px', padding: '12px 14px',
                borderLeft: '3px solid #c4b5fd',
              }}>
                {p.request}
              </p>

              {/* Ação */}
              <button
                onClick={() => toggleStatus(p.id, p.status)}
                disabled={carregando === p.id}
                style={{
                  padding: '8px 16px', cursor: 'pointer', borderRadius: '8px',
                  fontSize: '13px', fontWeight: '600',
                  background: p.status === 'PENDING' ? '#7c3aed' : 'white',
                  color: p.status === 'PENDING' ? 'white' : '#64748b',
                  border: p.status === 'PRAYED' ? '1.5px solid #e2e8f0' : 'none',
                  opacity: carregando === p.id ? 0.6 : 1,
                } as React.CSSProperties}
              >
                {carregando === p.id
                  ? 'Salvando...'
                  : p.status === 'PENDING'
                    ? '🙏 Marcar como orado'
                    : '↩ Marcar como pendente'}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
