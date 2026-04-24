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
    title: '', description: '', date: '', location: '', imageUrl: '',
  })

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
      body: JSON.stringify({ ...form, slug, cellId }),
    })
    if (res.ok) {
      router.push(`/${slug}/celulas/${cellId}`)
    } else {
      setLoading(false)
    }
  }

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
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label>Data e hora *</label>
              <input type="datetime-local" name="date" value={form.date} onChange={handleChange} required />
            </div>
            <div>
              <label>Local</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="Casa do líder, Online..." />
            </div>
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
              {form.location && <p style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>📍 {form.location}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
