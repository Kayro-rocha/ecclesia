'use client'

import { useState } from 'react'
import { Gift, Calendar, Package, Check, Flame, Sparkles, ChevronRight } from 'lucide-react'
import BottomSheet from '../BottomSheet'

type MissionItem = {
  id: string
  name: string
  quantity: number
  committed: number
}

type Missao = {
  id: string
  title: string
  description: string | null
  deliveryDate: Date
  items: MissionItem[]
}

interface Props {
  ativas: Missao[]
  encerradas: Missao[]
  memberName: string
  memberPhone: string
}

export default function MissoesClient({ ativas, encerradas, memberName, memberPhone }: Props) {
  const [colaborando, setColaborando] = useState<Missao | null>(null)
  const [overrides, setOverrides] = useState<Record<string, MissionItem[]>>({})

  function getItems(m: Missao) {
    return overrides[m.id] ?? m.items
  }

  function handleSuccess(missionId: string, itemId: string, qty: number) {
    setOverrides(prev => {
      const base = prev[missionId] ?? (colaborando?.items ?? [])
      return {
        ...prev,
        [missionId]: base.map(i => i.id === itemId ? { ...i, committed: i.committed + qty } : i),
      }
    })
  }

  const total = ativas.length + encerradas.length

  return (
    <>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Missões</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            {ativas.length} ativa{ativas.length !== 1 ? 's' : ''} · colabore com doações
          </p>
        </div>

        {total === 0 ? (
          <div style={emptyBox}>
            <Gift size={40} color="#cbd5e1" />
            <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: '14px' }}>Nenhuma missão cadastrada.</p>
          </div>
        ) : (
          <>
            {ativas.length > 0 && (
              <section>
                <p style={sectionLabel}>ATIVAS ({ativas.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {ativas.map(m => (
                    <MissaoCard key={m.id} missao={m} items={getItems(m)} ativa onColaborar={() => setColaborando(m)} />
                  ))}
                </div>
              </section>
            )}
            {encerradas.length > 0 && (
              <section>
                <p style={sectionLabel}>ENCERRADAS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {encerradas.map(m => (
                    <MissaoCard key={m.id} missao={m} items={getItems(m)} ativa={false} onColaborar={() => {}} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {colaborando && (
        <ColaborarModal
          missao={colaborando}
          items={overrides[colaborando.id] ?? colaborando.items}
          memberName={memberName}
          memberPhone={memberPhone}
          onClose={() => setColaborando(null)}
          onSuccess={(itemId, qty) => handleSuccess(colaborando.id, itemId, qty)}
        />
      )}
    </>
  )
}

function MissaoCard({ missao, items, ativa, onColaborar }: {
  missao: Missao
  items: MissionItem[]
  ativa: boolean
  onColaborar: () => void
}) {
  const totalQtd  = items.reduce((s, i) => s + i.quantity, 0)
  const committed = items.reduce((s, i) => s + i.committed, 0)
  const pct       = totalQtd > 0 ? Math.min(Math.round((committed / totalQtd) * 100), 100) : 0
  const faltam    = totalQtd - committed

  const entrega = new Date(missao.deliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  const diasRestantes = Math.ceil((new Date(missao.deliveryDate).getTime() - Date.now()) / 86400000)
  const urgente = ativa && diasRestantes <= 7

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      border: `1px solid ${urgente ? '#fed7aa' : '#f1f5f9'}`,
      padding: '16px', opacity: ativa ? 1 : 0.65,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{missao.title}</h2>
          {missao.description && (
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.4,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {missao.description}
            </p>
          )}
        </div>
        {urgente && (
          <span style={{ marginLeft: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700',
            padding: '3px 8px', borderRadius: '20px', background: '#fff7ed', color: '#c2410c' }}>
            <Flame size={10} /> {diasRestantes}d
          </span>
        )}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{committed} de {totalQtd} itens comprometidos</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: pct === 100 ? '#16a34a' : '#3b82f6' }}>{pct}%</span>
        </div>
        <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '8px' }}>
          <div style={{ height: '8px', borderRadius: '99px', width: `${pct}%`,
            background: pct === 100 ? '#22c55e' : '#3b82f6', transition: 'width 0.4s' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
          <Calendar size={12} color="#94a3b8" /> Entrega: {entrega}
        </span>
        {ativa && faltam > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
            <Package size={12} color="#94a3b8" /> Faltam: {faltam} iten{faltam !== 1 ? 's' : ''}
          </span>
        )}
        {pct === 100 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
            <Check size={12} /> Meta atingida!
          </span>
        )}
      </div>

      {ativa && pct < 100 && (
        <button
          onClick={onColaborar}
          style={{
            width: '100%', padding: '11px', border: 'none', borderRadius: '12px',
            background: '#3b82f6', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <Gift size={16} /> Quero colaborar
        </button>
      )}
      {ativa && pct === 100 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: '12px',
          background: '#f0fdf4', color: '#16a34a', fontSize: '14px', fontWeight: '600' }}>
          <Check size={16} /> Meta atingida — obrigado!
        </div>
      )}
    </div>
  )
}

function ColaborarModal({ missao, items, memberName, memberPhone, onClose, onSuccess }: {
  missao: Missao
  items: MissionItem[]
  memberName: string
  memberPhone: string
  onClose: () => void
  onSuccess: (itemId: string, qty: number) => void
}) {
  const disponíveis = items.filter(i => i.committed < i.quantity)
  const [selectedItem, setSelectedItem] = useState<string>(disponíveis[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const [name, setName] = useState(memberName)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState<{ item: string; qty: number } | null>(null)

  const item = disponíveis.find(i => i.id === selectedItem)
  const maxQty = item ? item.quantity - item.committed : 1

  async function confirmar() {
    if (!selectedItem || !name.trim()) return
    setSalvando(true)
    const res = await fetch(`/api/missions/${missao.id}/donate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionItemId: selectedItem, donorName: name, donorPhone: memberPhone, quantity: qty }),
    })
    const data = await res.json()
    if (res.ok) {
      onSuccess(selectedItem, data.quantity ?? qty)
      setSucesso({ item: item?.name ?? '', qty: data.quantity ?? qty })
    }
    setSalvando(false)
  }

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 8px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gift size={20} color="#3b82f6" /> Colaborar com a missão
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>{missao.title}</p>

        {sucesso ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <Sparkles size={52} color="#16a34a" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#16a34a' }}>
              Obrigado pela colaboração!
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              Você comprometeu <strong>{sucesso.qty}x {sucesso.item}</strong>.<br />
              Aguardamos você na entrega!
            </p>
          </div>
        ) : disponíveis.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '32px 0', color: '#16a34a', fontSize: '15px', fontWeight: '600' }}>
            <Check size={20} /> Todos os itens já foram comprometidos!
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '10px' }}>
                Qual item você vai trazer?
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {disponíveis.map(i => {
                  const falta = i.quantity - i.committed
                  const sel = selectedItem === i.id
                  return (
                    <button
                      key={i.id}
                      onClick={() => { setSelectedItem(i.id); setQty(1) }}
                      style={{
                        textAlign: 'left', padding: '12px 14px', border: 'none',
                        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
                        background: sel ? '#eff6ff' : '#f8fafc',
                        outline: sel ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{i.name}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>faltam {falta}</span>
                      </div>
                      {sel && <Check size={16} color="#3b82f6" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {item && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '10px' }}>
                  Quantidade
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b' }}
                  >−</button>
                  <span style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', minWidth: '32px', textAlign: 'center' }}>{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                    style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b' }}
                  >+</button>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>máx. {maxQty}</span>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Seu nome</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box', color: '#1e293b', background: 'white' }}
              />
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '12px 20px 28px', flexShrink: 0, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!sucesso && disponíveis.length > 0 && (
          <button
            onClick={confirmar}
            disabled={salvando || !selectedItem || !name.trim()}
            style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: '12px',
              background: '#3b82f6', color: 'white', fontSize: '15px', fontWeight: '600',
              cursor: salvando || !selectedItem || !name.trim() ? 'not-allowed' : 'pointer',
              opacity: salvando || !selectedItem || !name.trim() ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <Gift size={16} />
            {salvando ? 'Confirmando...' : `Confirmar — ${qty}x ${item?.name ?? ''}`}
          </button>
        )}
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '14px', border: 'none', background: '#f1f5f9', borderRadius: '12px', fontSize: '15px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
        >
          {sucesso ? 'Fechar' : 'Cancelar'}
        </button>
      </div>
    </BottomSheet>
  )
}

const sectionLabel: React.CSSProperties = {
  margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px',
}
const emptyBox: React.CSSProperties = {
  padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
}
