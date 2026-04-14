'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Group {
  id: string
  name: string
}

export default function NovoEventoPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const fileRef = useRef<HTMLInputElement>(null)

  const [grupos, setGrupos] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    targetGroup: '',
    imageUrl: '',
  })

  useEffect(() => {
    fetch(`/api/groups?slug=${slug}`)
      .then(r => r.json())
      .then((data: Group[]) => { if (Array.isArray(data)) setGrupos(data) })
  }, [slug])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
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
      body: JSON.stringify({ ...form, slug }),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/${slug}/eventos/${data.id}`)
    } else {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/eventos`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Eventos</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Novo evento</span>
        </div>
      </div>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Imagem de capa */}
          <div>
            <label>Imagem de capa (opcional)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
            {form.imageUrl ? (
              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', marginTop: '6px' }}>
                <img src={form.imageUrl} alt="Capa" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                <button
                  type="button"
                  onClick={() => { setForm(p => ({ ...p, imageUrl: '' })); if (fileRef.current) fileRef.current.value = '' }}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px' }}
                >✕</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{ marginTop: '6px', width: '100%', padding: '12px', border: '1.5px dashed #e2e8f0', borderRadius: '8px', background: 'white', color: '#a0aec0', cursor: 'pointer', fontSize: '13px' }}
              >
                {uploading ? 'Enviando...' : '🖼 Adicionar foto do evento (JPG, PNG — máx. 5MB)'}
              </button>
            )}
          </div>

          <div>
            <label>Título do evento *</label>
            <input name="title" value={form.title} onChange={handleChange} required placeholder="Ex: Retiro dos Jovens, Célula de Mulheres..." />
          </div>
          <div>
            <label>Descrição</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Descreva o evento: o que vai acontecer, como se preparar..."
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label>Data e hora *</label>
              <input type="datetime-local" name="date" value={form.date} onChange={handleChange} required />
            </div>
            <div>
              <label>Local</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="Ex: Salão principal, Online..." />
            </div>
          </div>
          <div>
            <label>Enviar notificação para</label>
            <select name="targetGroup" value={form.targetGroup} onChange={handleChange}>
              <option value="">Todos os membros</option>
              {grupos.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
            </select>
            <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
              Uma notificação push será enviada para o grupo selecionado ao criar o evento
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Link href={`/${slug}/eventos`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>Cancelar</Link>
            <button type="submit" disabled={loading || uploading} className="btn-primary" style={{ flex: 1 }}>
              {loading ? 'Criando...' : 'Criar evento'}
            </button>
          </div>
        </form>

        {/* Preview do card de evento */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Pré-visualização
          </p>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="" style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ height: '100px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🎉</div>
            )}
            <div style={{ padding: '14px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 6px', lineHeight: 1.3 }}>
                {form.title || 'Título do evento'}
              </p>
              {form.date && (
                <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 4px' }}>
                  📅 {new Date(form.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                  {' · '}
                  🕐 {new Date(form.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {form.location && <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 8px' }}>📍 {form.location}</p>}
              {form.description && (
                <p style={{ fontSize: '12px', color: '#4a5568', margin: '8px 0 10px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {form.description}
                </p>
              )}
              <div style={{ background: '#667eea', color: 'white', textAlign: 'center', padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                ✓ Confirmar presença
              </div>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center' }}>
            Card enviado como notificação + link de confirmação de presença
          </p>
        </div>
      </div>
    </div>
  )
}
