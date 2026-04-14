'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditarComunicadoPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const id = params?.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [form, setForm] = useState({ title: '', body: '' })

  useEffect(() => {
    fetch(`/api/announcements/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({ title: data.title, body: data.body })
        setLoadingData(false)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.body) return
    setLoading(true)

    const res = await fetch(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) router.push(`/${slug}/comunicados`)
    else setLoading(false)
  }

  if (loadingData) {
    return (
      <div>
        <div className="page-header">
          <span style={{ color: '#a0aec0', fontSize: '14px' }}>Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/comunicados`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Comunicados</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Editar comunicado</span>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label>Título *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Culto especial neste domingo" required />
          </div>
          <div>
            <label>Mensagem *</label>
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              rows={6} placeholder="Digite a mensagem..."
              style={{ resize: 'vertical' }} />
            <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>{form.body.length} caracteres</p>
          </div>

          <div style={{ background: '#f8f9fb', borderRadius: '8px', padding: '12px' }}>
            <p style={{ fontSize: '12px', color: '#718096', fontWeight: '500', marginBottom: '6px' }}>Pré-visualização WhatsApp</p>
            <p style={{ fontSize: '14px', color: '#1a1a2e', whiteSpace: 'pre-wrap' }}>
              {form.body || 'Sua mensagem aparecerá aqui...'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Link href={`/${slug}/comunicados`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Cancelar
            </Link>
            <button type="submit" disabled={loading || !form.title || !form.body}
              className="btn-primary" style={{ flex: 1, textAlign: 'center' }}>
              {loading ? 'Salvando...' : 'Salvar rascunho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
