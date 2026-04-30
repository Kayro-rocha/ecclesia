'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function NovaReuniaoPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const cellId = params?.id as string
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', date: '', imageUrl: '',
    listMode: 'none', useChurchLocation: true, locationCep: '',
  })
  const [predefinedItems, setPredefinedItems] = useState<string[]>(['', ''])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('slug', slug)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) setForm(p => ({ ...p, imageUrl: data.url }))
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.date) return
    setLoading(true)
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug, cellId,
        title: form.title,
        description: form.description,
        date: form.date,
        imageUrl: form.imageUrl,
        listMode: form.listMode,
        predefinedItems: form.listMode === 'predefined' ? predefinedItems.filter(i => i.trim()) : [],
        useChurchLocation: form.useChurchLocation,
        locationCep: !form.useChurchLocation ? form.locationCep : '',
      }),
    })
    if (res.ok) {
      router.push(`/${slug}/celulas/${cellId}`)
    } else {
      setLoading(false)
    }
  }

  const listModes = [
    { value: 'none', label: 'Sem lista', desc: 'Só descrição, sem itens' },
    { value: 'free', label: 'Lista livre', desc: 'Cada membro digita o que vai levar' },
    { value: 'predefined', label: 'Lista definida', desc: 'Você cria os itens, membros escolhem' },
  ]

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/celulas/${cellId}`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Célula</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Nova reunião</span>
        </div>
      </div>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Imagem + campos básicos */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label>Imagem de capa (opcional)</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
              {form.imageUrl ? (
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', marginTop: '6px' }}>
                  <img src={form.imageUrl} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                  <button type="button" onClick={() => { setForm(p => ({ ...p, imageUrl: '' })); if (fileRef.current) fileRef.current.value = '' }}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ marginTop: '6px', width: '100%', padding: '12px', border: '1.5px dashed #e2e8f0', borderRadius: '8px', background: 'white', color: '#a0aec0', cursor: 'pointer', fontSize: '13px' }}>
                  {uploading ? 'Enviando...' : '🖼 Adicionar foto da reunião'}
                </button>
              )}
            </div>
            <div>
              <label>Título *</label>
              <input name="title" value={form.title} onChange={handleChange} required placeholder="Ex: Reunião — Salmo 23, Estudo sobre fé..." />
            </div>
            <div>
              <label>Descrição</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                placeholder="Tema, avisos, o que trazer..." style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label>Data e hora *</label>
              <input type="datetime-local" name="date" value={form.date} onChange={handleChange} required />
            </div>
          </div>

          {/* Localização */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e', margin: 0 }}>Localização</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.useChurchLocation}
                onChange={e => setForm(p => ({ ...p, useChurchLocation: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', flexShrink: 0 }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>Reunião na sede da igreja</span>
            </label>
            {!form.useChurchLocation && (
              <div>
                <label>CEP do local</label>
                <input
                  name="locationCep"
                  value={form.locationCep}
                  onChange={handleChange}
                  placeholder="Ex: 01310-100"
                  maxLength={9}
                />
                <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
                  O endereço será geocodificado automaticamente para uso no mapa.
                </p>
              </div>
            )}
          </div>

          {/* Lista de itens */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e', margin: 0 }}>Lista de itens</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {listModes.map(m => (
                <label key={m.value} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', borderRadius: '10px', cursor: 'pointer',
                  border: `1.5px solid ${form.listMode === m.value ? 'var(--primary)' : '#e2e8f0'}`,
                  background: form.listMode === m.value ? 'var(--primary-light, #eff6ff)' : 'white',
                }}>
                  <input type="radio" name="listMode" value={m.value}
                    checked={form.listMode === m.value}
                    onChange={e => setForm(p => ({ ...p, listMode: e.target.value }))}
                    style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{m.label}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {form.listMode === 'predefined' && (
              <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', margin: 0 }}>Itens que os membros vão escolher:</p>
                {predefinedItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      value={item}
                      onChange={e => setPredefinedItems(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                      placeholder="Ex: Bolo, Refrigerante, Salgado..."
                      style={{ flex: 1 }}
                    />
                    {predefinedItems.length > 1 && (
                      <button type="button" onClick={() => setPredefinedItems(prev => prev.filter((_, j) => j !== i))}
                        style={{ width: '36px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}>×</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setPredefinedItems(prev => [...prev, ''])}
                  style={{ padding: '8px', border: '1.5px dashed #bfdbfe', borderRadius: '8px', background: 'white', color: '#3b82f6', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  + Adicionar item
                </button>
              </div>
            )}
          </div>

          <p style={{ fontSize: '12px', color: '#a0aec0' }}>
            Uma notificação será enviada para os membros da célula ao criar a reunião.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href={`/${slug}/celulas/${cellId}`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>Cancelar</Link>
            <button type="submit" disabled={loading || uploading} className="btn-primary" style={{ flex: 1 }}>
              {loading ? 'Criando...' : 'Criar reunião'}
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase' }}>Pré-visualização</p>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {form.imageUrl
              ? <img src={form.imageUrl} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
              : <div style={{ height: '80px', background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🏠</div>
            }
            <div style={{ padding: '14px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e', marginBottom: '6px' }}>{form.title || 'Título da reunião'}</p>
              {form.date && <p style={{ fontSize: '12px', color: '#718096' }}>📅 {new Date(form.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</p>}
              {!form.useChurchLocation && form.locationCep && <p style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>📍 CEP {form.locationCep}</p>}
              {form.useChurchLocation && <p style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>📍 Sede da igreja</p>}
              {form.listMode !== 'none' && (
                <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>
                  {form.listMode === 'free' ? '📋 Lista livre' : `📋 Lista com ${predefinedItems.filter(i => i.trim()).length} itens`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
