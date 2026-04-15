'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Donor { id: string; donorName: string; quantity: number }
interface Item {
  id: string
  name: string
  quantity: number
  committed: number
  donations: Donor[]
}
interface Mission {
  id: string
  title: string
  description: string | null
  deliveryDate: string
  church: { name: string; slug: string }
  items: Item[]
}

type Step = 'list' | 'form' | 'done'

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid #e2e8f0',
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '14px',
  color: '#1a1a2e',
  background: 'white',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '500',
  color: '#4a5568',
  display: 'block',
  marginBottom: '6px',
}

export default function MissaoPublicaPage() {
  const params = useParams()
  const id = params?.id as string

  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('list')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', quantity: 1 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [donatedQty, setDonatedQty] = useState(1)

  async function load() {
    const res = await fetch(`/api/missions/${id}/public`)
    const data = await res.json()
    setMission(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  function handleSelectItem(item: Item) {
    if (item.committed >= item.quantity) return
    setSelectedItem(item)
    setForm({ name: '', phone: '', quantity: 1 })
    setError('')
    setStep('form')
  }

  async function handleDonate() {
    if (!form.name.trim() || !selectedItem) return
    setSaving(true)
    setError('')
    const res = await fetch(`/api/missions/${id}/donate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        missionItemId: selectedItem.id,
        donorName: form.name,
        donorPhone: form.phone,
        quantity: form.quantity,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setDonatedQty(data.quantity)
      setStep('done')
    } else {
      const data = await res.json()
      setError(data.error || 'Erro ao registrar doação')
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#718096', fontSize: '14px' }}>Carregando...</p>
    </div>
  )

  if (!mission) return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#718096', fontSize: '14px' }}>Campanha não encontrada.</p>
    </div>
  )

  const totalComprometido = mission.items.reduce((a, i) => a + i.committed, 0)
  const totalNecessario = mission.items.reduce((a, i) => a + i.quantity, 0)
  const progresso = totalNecessario > 0 ? Math.round((totalComprometido / totalNecessario) * 100) : 0
  const entrega = new Date(mission.deliveryDate)
  const disponivel = selectedItem ? selectedItem.quantity - selectedItem.committed : 0

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: '24px 16px' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #edf2f7', padding: '24px' }}>
          <div style={{ fontSize: '28px', textAlign: 'center', marginBottom: '12px' }}>🤝</div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 6px', textAlign: 'center' }}>
            {mission.title}
          </h1>
          <p style={{ fontSize: '13px', color: '#718096', textAlign: 'center', margin: '0 0 16px' }}>
            {mission.church.name} · Entrega: {entrega.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
          </p>
          {mission.description && (
            <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.6, margin: '0 0 16px', textAlign: 'center' }}>
              {mission.description}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#718096' }}>Progresso geral</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: progresso >= 100 ? '#38a169' : '#d69e2e' }}>
              {progresso}%
            </span>
          </div>
          <div style={{ background: '#edf2f7', borderRadius: '9999px', height: '8px' }}>
            <div style={{ width: `${Math.min(progresso, 100)}%`, background: progresso >= 100 ? '#48bb78' : '#667eea', height: '8px', borderRadius: '9999px', transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Lista de itens */}
        {step === 'list' && (
          <>
            <p style={{ fontSize: '13px', color: '#718096', textAlign: 'center', margin: 0 }}>
              Toque em um item para registrar sua doação
            </p>
            {mission.items.map(item => {
              const completo = item.committed >= item.quantity
              const faltam = item.quantity - item.committed
              const itemPct = item.quantity > 0 ? Math.round((item.committed / item.quantity) * 100) : 0
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  style={{
                    background: completo ? '#f0fff4' : 'white',
                    borderRadius: '12px',
                    border: `1.5px solid ${completo ? '#9ae6b4' : '#edf2f7'}`,
                    padding: '16px',
                    cursor: completo ? 'default' : 'pointer',
                    transition: 'border-color 0.15s, transform 0.1s',
                  }}
                  onMouseEnter={e => { if (!completo) { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                  onMouseLeave={e => { if (!completo) { e.currentTarget.style.borderColor = '#edf2f7'; e.currentTarget.style.transform = 'none' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '15px' }}>{item.name}</span>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', display: 'inline-block',
                        background: completo ? '#c6f6d5' : '#ebf8ff',
                        color: completo ? '#276749' : '#2b6cb0',
                      }}>
                        {completo ? '✓ Completo' : `${item.committed} / ${item.quantity}`}
                      </span>
                      {!completo && (
                        <p style={{ fontSize: '11px', color: '#e53e3e', margin: '4px 0 0', fontWeight: '500' }}>
                          faltam {faltam}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ background: '#edf2f7', borderRadius: '9999px', height: '4px', marginBottom: '10px' }}>
                    <div style={{ width: `${Math.min(itemPct, 100)}%`, background: completo ? '#48bb78' : '#667eea', height: '4px', borderRadius: '9999px' }} />
                  </div>

                  {item.donations.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: completo ? 0 : '8px' }}>
                      {item.donations.map(d => (
                        <span key={d.id} style={{ fontSize: '11px', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '2px 10px', color: '#4a5568' }}>
                          {d.donorName}{d.quantity > 1 ? ` (×${d.quantity})` : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  {!completo && (
                    <p style={{ fontSize: '12px', color: '#667eea', margin: 0, fontWeight: '600' }}>
                      Toque para contribuir →
                    </p>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* Formulário de doação */}
        {step === 'form' && selectedItem && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #edf2f7', padding: '24px' }}>
            <button
              onClick={() => setStep('list')}
              style={{ background: 'none', border: 'none', color: '#718096', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              ← Voltar
            </button>

            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 4px' }}>
              {selectedItem.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '13px', color: '#718096' }}>
                Comprometido: <strong style={{ color: '#1a1a2e' }}>{selectedItem.committed}/{selectedItem.quantity}</strong>
              </span>
              <span style={{ fontSize: '12px', background: '#fff5f5', color: '#e53e3e', fontWeight: '600', padding: '2px 8px', borderRadius: '12px' }}>
                {disponivel} disponível{disponivel !== 1 ? 'is' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Seu nome *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Como você se chama"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Telefone (opcional)</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="Para contato se necessário"
                  type="tel"
                  style={inputStyle}
                />
              </div>

              {/* Seletor de quantidade */}
              <div>
                <label style={labelStyle}>Quantidade que você vai doar</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '20px', color: '#4a5568', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    −
                  </button>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a2e' }}>{form.quantity}</span>
                    <p style={{ fontSize: '11px', color: '#a0aec0', margin: '2px 0 0' }}>de {disponivel} disponível{disponivel !== 1 ? 'is' : ''}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, quantity: Math.min(disponivel, p.quantity + 1) }))}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '20px', color: '#4a5568', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    +
                  </button>
                </div>
                {/* Botão "Doar tudo" se tiver mais de 1 disponível */}
                {disponivel > 1 && form.quantity < disponivel && (
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, quantity: disponivel }))}
                    style={{ marginTop: '8px', background: 'none', border: 'none', color: '#667eea', fontSize: '12px', cursor: 'pointer', padding: 0, fontWeight: '500' }}
                  >
                    Quero doar todos os {disponivel} →
                  </button>
                )}
              </div>

              {error && <p style={{ fontSize: '13px', color: '#e53e3e', margin: 0 }}>{error}</p>}

              <button
                onClick={handleDonate}
                disabled={saving || !form.name.trim()}
                style={{
                  background: '#667eea', color: 'white', border: 'none', borderRadius: '8px',
                  padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                  opacity: (saving || !form.name.trim()) ? 0.5 : 1,
                  marginTop: '4px',
                }}
              >
                {saving ? 'Registrando...' : `Confirmar ${form.quantity > 1 ? `${form.quantity} doações` : 'doação'}`}
              </button>
            </div>
          </div>
        )}

        {/* Concluído */}
        {step === 'done' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #c6f6d5', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🙌</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#276749', margin: '0 0 8px' }}>
              Obrigado, {form.name}!
            </h2>
            <p style={{ fontSize: '14px', color: '#718096', margin: '0 0 20px', lineHeight: 1.6 }}>
              Sua doação de <strong style={{ color: '#1a1a2e' }}>{donatedQty}× {selectedItem?.name}</strong> foi registrada. Que Deus abençoe!
            </p>
            <button
              onClick={() => { load(); setStep('list') }}
              style={{ background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Ver outros itens
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
