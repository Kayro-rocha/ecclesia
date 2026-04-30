'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function NovaCelulaReuniaoPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const fileRef = useRef<HTMLInputElement>(null)

  const [cellId, setCellId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', date: '', imageUrl: '', notifyTarget: 'cell', listMode: 'none',
    useChurchLocation: true, locationCep: '',
  })
  const [predefinedItems, setPredefinedItems] = useState<string[]>(['', ''])

  useEffect(() => {
    fetch('/api/membro/celula')
      .then(r => r.json())
      .then(data => { if (data.cell) setCellId(data.cell.id) })
  }, [])

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('slug', slug)
      const res = await fetch('/api/membro/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setForm(p => ({ ...p, imageUrl: data.url }))
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cellId || !form.title || !form.date) return
    setLoading(true)
    const res = await fetch('/api/membro/celula/reuniao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cellId, ...form,
        predefinedItems: form.listMode === 'predefined' ? predefinedItems.filter(i => i.trim()) : [],
        useChurchLocation: form.useChurchLocation,
        locationCep: !form.useChurchLocation ? form.locationCep : '',
      }),
    })
    if (res.ok) {
      router.push(`/${slug}/membro/celula`)
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '16px', boxSizing: 'border-box' as const,
    color: '#1e293b', background: 'white',
  }

  const listModes = [
    { value: 'none', label: 'Sem lista', desc: 'Só descrição, sem itens' },
    { value: 'free', label: 'Lista livre', desc: 'Cada membro digita o que vai levar' },
    { value: 'predefined', label: 'Lista definida', desc: 'Você cria os itens, membros escolhem' },
  ]

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b', padding: '4px' }}>←</button>
        <p style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>Nova reunião</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Imagem */}
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
          {form.imageUrl ? (
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
              <img src={form.imageUrl} alt="" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
              <button type="button" onClick={() => { setForm(p => ({ ...p, imageUrl: '' })); if (fileRef.current) fileRef.current.value = '' }}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ width: '100%', padding: '20px', border: '2px dashed #e2e8f0', borderRadius: '16px', background: '#f8fafc', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>
              {uploading ? 'Enviando...' : '🖼 Adicionar foto da reunião (opcional)'}
            </button>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Título *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required placeholder="Ex: Estudo — Salmo 23, Oração e jejum..." style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Descrição</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3} placeholder="Avisos, tema, o que trazer..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Data e hora *</label>
            <input type="datetime-local" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Notificar</label>
            <select value={form.notifyTarget} onChange={e => setForm(p => ({ ...p, notifyTarget: e.target.value }))} style={inputStyle}>
              <option value="cell">Apenas membros da célula</option>
              <option value="all">Todos os membros da igreja</option>
            </select>
          </div>
        </div>

        {/* Localização */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: 0 }}>Localização</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.useChurchLocation}
              onChange={e => setForm(p => ({ ...p, useChurchLocation: e.target.checked }))}
              style={{ width: '18px', height: '18px', accentColor: '#3b82f6', flexShrink: 0 }}
            />
            <span style={{ fontSize: '14px', color: '#374151' }}>Reunião na sede da igreja</span>
          </label>
          {!form.useChurchLocation && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>CEP do local</label>
              <input
                value={form.locationCep}
                onChange={e => setForm(p => ({ ...p, locationCep: e.target.value }))}
                placeholder="Ex: 01310-100"
                maxLength={9}
                style={inputStyle}
              />
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>O endereço será geocodificado para o mapa.</p>
            </div>
          )}
        </div>

        {/* Lista de itens */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Lista de itens</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {listModes.map(m => (
              <label key={m.value} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px', borderRadius: '12px', cursor: 'pointer',
                border: `1.5px solid ${form.listMode === m.value ? '#3b82f6' : '#e2e8f0'}`,
                background: form.listMode === m.value ? '#eff6ff' : 'white',
              }}>
                <input type="radio" name="listMode" value={m.value}
                  checked={form.listMode === m.value}
                  onChange={e => setForm(p => ({ ...p, listMode: e.target.value }))}
                  style={{ accentColor: '#3b82f6', width: '16px', height: '16px', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{m.label}</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{m.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Itens predefinidos */}
          {form.listMode === 'predefined' && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Itens que os membros vão escolher:</p>
              {predefinedItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={item}
                    onChange={e => setPredefinedItems(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                    placeholder={`Ex: Bolo, Refrigerante, Salgado...`}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  {predefinedItems.length > 1 && (
                    <button type="button" onClick={() => setPredefinedItems(prev => prev.filter((_, j) => j !== i))}
                      style={{ width: '40px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}>×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setPredefinedItems(prev => [...prev, ''])}
                style={{ width: '100%', padding: '10px', border: '1.5px dashed #bfdbfe', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                + Adicionar item
              </button>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading || uploading || !cellId}
          style={{
            width: '100%', padding: '14px', background: '#3b82f6', color: 'white',
            border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600',
            cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
          {loading ? 'Criando...' : 'Criar reunião e notificar'}
        </button>
      </form>
    </div>
  )
}
