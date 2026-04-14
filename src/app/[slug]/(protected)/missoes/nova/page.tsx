'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Item {
  name: string
  quantity: number
}

export default function NovaMissaoPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', deliveryDate: '' })
  const [items, setItems] = useState<Item[]>([])
  const [novoItem, setNovoItem] = useState({ name: '', quantity: '1' })

  function adicionarItem() {
    if (!novoItem.name) return
    setItems(prev => [...prev, { name: novoItem.name, quantity: parseInt(novoItem.quantity) || 1 }])
    setNovoItem({ name: '', quantity: '1' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return alert('Adicione pelo menos um item')
    setLoading(true)

    const res = await fetch(`/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items, slug }),
    })

    if (res.ok) router.push(`/${slug}/missoes`)
    else setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/missoes`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Missões</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Nova campanha</span>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label>Nome da campanha *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Cesta básica — família Silva" required />
            </div>
            <div>
              <label>Descrição</label>
              <textarea value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="Detalhes da campanha..."
                style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label>Data de entrega *</label>
              <input type="date" value={form.deliveryDate}
                onChange={e => setForm(p => ({ ...p, deliveryDate: e.target.value }))} required />
            </div>
          </div>

          <div className="card">
            <p style={{ fontWeight: '600', fontSize: '14px', color: '#4a5568', marginBottom: '12px' }}>Itens necessários</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input value={novoItem.name}
                onChange={e => setNovoItem(p => ({ ...p, name: e.target.value }))}
                placeholder="Item (ex: Arroz 5kg)"
                style={{ flex: 1 }} />
              <input type="number" value={novoItem.quantity} min="1"
                onChange={e => setNovoItem(p => ({ ...p, quantity: e.target.value }))}
                style={{ width: '80px', textAlign: 'center' }} />
              <button type="button" onClick={adicionarItem} className="btn-primary" style={{ padding: '8px 16px' }}>+</button>
            </div>

            {items.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#a0aec0', textAlign: 'center', padding: '16px 0' }}>Nenhum item adicionado</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fb', borderRadius: '8px', padding: '8px 12px' }}>
                    <span style={{ fontSize: '14px', color: '#1a1a2e' }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#a0aec0' }}>Qtd: {item.quantity}</span>
                      <button type="button" onClick={() => setItems(p => p.filter((_, i) => i !== idx))}
                        style={{ fontSize: '12px', color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href={`/${slug}/missoes`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Cancelar
            </Link>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
              {loading ? 'Salvando...' : 'Criar campanha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
