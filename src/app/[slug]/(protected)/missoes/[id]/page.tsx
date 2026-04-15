'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Donor {
  id: string
  donorName: string
  donorPhone: string
  createdAt: string
}

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
  items: Item[]
}

export default function MissaoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mission, setMission] = useState<Mission | null>(null)
  const [form, setForm] = useState({ title: '', description: '', deliveryDate: '' })
  const [items, setItems] = useState<Array<{ id?: string; name: string; quantity: number; committed: number; donations: Donor[] }>>([])
  const [novoItem, setNovoItem] = useState({ name: '', quantity: '1' })
  const [copied, setCopied] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [notifyResult, setNotifyResult] = useState<string | null>(null)

  const missionLink = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host.replace(/^[^.]+\./, `${slug}.`).replace('localhost:3000', `${slug}.localhost:3000`)}/missao/${id}`
    : ''

  function getPublicLink() {
    if (typeof window === 'undefined') return ''
    const host = window.location.host
    const proto = window.location.protocol
    // multi-tenant: troca slug no subdomínio ou usa path
    if (host.includes('.')) {
      const parts = host.split('.')
      parts[0] = slug
      return `${proto}//${parts.join('.')}/missao/${id}`
    }
    return `${proto}//${host}/${slug}/missao/${id}`
  }

  function copyLink() {
    navigator.clipboard.writeText(getPublicLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleNotify() {
    if (!mission) return
    if (!confirm('Enviar notificação push para todos os membros sobre esta campanha?')) return
    setNotifying(true)
    setNotifyResult(null)
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        title: `🤝 ${mission.title}`,
        body: mission.description || 'Precisamos da sua ajuda! Veja os itens necessários.',
        url: getPublicLink(),
      }),
    })
    const data = await res.json()
    setNotifyResult(data.sent === 0 ? 'Nenhum membro com notificações ativas ainda.' : `Notificação enviada para ${data.sent} membro(s)!`)
    setNotifying(false)
  }

  useEffect(() => {
    fetch(`/api/missions/${id}`)
      .then(r => r.json())
      .then(data => {
        setMission(data)
        setForm({
          title: data.title,
          description: data.description || '',
          deliveryDate: data.deliveryDate.split('T')[0],
        })
        setItems(data.items)
        setLoading(false)
      })
  }, [id])

  function adicionarItem() {
    if (!novoItem.name) return
    setItems(prev => [...prev, { name: novoItem.name, quantity: parseInt(novoItem.quantity) || 1, committed: 0, donations: [] }])
    setNovoItem({ name: '', quantity: '1' })
  }

  async function handleSave() {
    setSalvando(true)
    const res = await fetch(`/api/missions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items }),
    })
    if (res.ok) {
      const data = await res.json()
      setMission(data)
      setItems(data.items)
      setEditando(false)
    }
    setSalvando(false)
  }

  async function handleDelete() {
    if (!confirm(`Apagar campanha "${mission?.title}"?\n\nIsso removerá também todos os itens e doações registradas. Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/missions/${id}`, { method: 'DELETE' })
    if (res.ok) router.push(`/${slug}/missoes`)
  }

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <p style={{ color: '#a0aec0', fontSize: '14px' }}>Carregando...</p>
    </div>
  )

  if (!mission) return null

  const totalComprometidos = items.reduce((acc, i) => acc + i.committed, 0)
  const totalNecessario = items.reduce((acc, i) => acc + i.quantity, 0)
  const progresso = totalNecessario > 0 ? Math.round((totalComprometidos / totalNecessario) * 100) : 0

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/missoes`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Missões</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>
            {editando ? 'Editar campanha' : mission.title}
          </span>
        </div>
        {!editando && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={copyLink} style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
              border: '1.5px solid #e2e8f0', background: 'white', color: '#4a5568', cursor: 'pointer',
            }}>
              {copied ? '✓ Copiado!' : '🔗 Copiar link'}
            </button>
            <button onClick={handleNotify} disabled={notifying} style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
              border: 'none', background: '#7c3aed', color: 'white', cursor: 'pointer',
              opacity: notifying ? 0.7 : 1,
            }}>
              {notifying ? 'Enviando...' : '🔔 Notificar membros'}
            </button>
            <button onClick={() => setEditando(true)} className="btn-secondary">Editar</button>
            <button onClick={handleDelete} style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
              border: '1.5px solid #fed7d7', background: 'white', color: '#e53e3e', cursor: 'pointer',
            }}>Apagar</button>
          </div>
        )}
        {notifyResult && (
          <p style={{ fontSize: '12px', color: '#718096', margin: '4px 0 0' }}>{notifyResult}</p>
        )}
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {editando ? (
          <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label>Nome da campanha *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label>Descrição</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label>Data de entrega *</label>
                <input type="date" value={form.deliveryDate} onChange={e => setForm(p => ({ ...p, deliveryDate: e.target.value }))} required />
              </div>
            </div>

            <div className="card">
              <p style={{ fontWeight: '600', fontSize: '14px', color: '#4a5568', marginBottom: '12px' }}>Itens</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input value={novoItem.name} onChange={e => setNovoItem(p => ({ ...p, name: e.target.value }))}
                  placeholder="Item (ex: Arroz 5kg)" style={{ flex: 1 }} />
                <input type="number" value={novoItem.quantity} min="1"
                  onChange={e => setNovoItem(p => ({ ...p, quantity: e.target.value }))}
                  style={{ width: '80px', textAlign: 'center' }} />
                <button type="button" onClick={adicionarItem} className="btn-primary" style={{ padding: '8px 16px' }}>+</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item, idx) => (
                  <div key={item.id || idx} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#f8f9fb', borderRadius: '8px', padding: '8px 12px',
                  }}>
                    <input value={item.name}
                      onChange={e => setItems(p => p.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))}
                      style={{ flex: 1 }} disabled={item.committed > 0} />
                    <input type="number" min="1" value={item.quantity}
                      onChange={e => setItems(p => p.map((it, i) => i === idx ? { ...it, quantity: parseInt(e.target.value) || 1 } : it))}
                      style={{ width: '72px', textAlign: 'center' }} />
                    {item.committed > 0 ? (
                      <span style={{ fontSize: '12px', color: '#a0aec0', width: '80px', textAlign: 'right' }}>
                        {item.committed} doado(s)
                      </span>
                    ) : (
                      <button type="button" onClick={() => setItems(p => p.filter((_, i) => i !== idx))}
                        style={{ fontSize: '12px', color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', width: '80px' }}>
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setEditando(false); setItems(mission.items) }} className="btn-secondary" style={{ flex: 1 }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={salvando} className="btn-primary" style={{ flex: 1 }}>
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Resumo */}
            <div className="card">
              {mission.description && (
                <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '16px' }}>{mission.description}</p>
              )}
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#a0aec0' }}>Data de entrega</p>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>
                    {new Date(mission.deliveryDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#a0aec0' }}>Progresso geral</p>
                  <span className={progresso >= 100 ? 'badge-green' : 'badge-yellow'}>{progresso}% comprometido</span>
                </div>
              </div>
              <div style={{ width: '100%', background: '#edf2f7', borderRadius: '9999px', height: '6px' }}>
                <div style={{
                  width: `${Math.min(progresso, 100)}%`, background: 'var(--primary)',
                  height: '6px', borderRadius: '9999px', transition: 'width 0.3s',
                }} />
              </div>
            </div>

            {/* Itens */}
            {items.map((item) => {
              const itemProgress = item.quantity > 0 ? Math.round((item.committed / item.quantity) * 100) : 0
              return (
                <div key={item.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '15px' }}>{item.name}</p>
                    <span className={itemProgress >= 100 ? 'badge-green' : 'badge-yellow'}>
                      {item.committed}/{item.quantity}
                    </span>
                  </div>
                  <div style={{ width: '100%', background: '#edf2f7', borderRadius: '9999px', height: '4px', marginBottom: '12px' }}>
                    <div style={{
                      width: `${Math.min(itemProgress, 100)}%`, background: 'var(--primary)',
                      height: '4px', borderRadius: '9999px',
                    }} />
                  </div>
                  {item.donations.length > 0 ? (
                    <div>
                      <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '8px' }}>Doadores:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {item.donations.map(d => (
                          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#1a1a2e' }}>{d.donorName}</span>
                            <span style={{ color: '#a0aec0' }}>{d.donorPhone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#a0aec0' }}>Nenhum doador ainda</p>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
