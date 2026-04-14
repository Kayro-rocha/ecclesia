'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function NovoComunicadoPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', imageUrl: '' })

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

  async function salvar(enviar: boolean) {
    if (enviar) {
      const confirmado = confirm('⚠️ Após o envio, não será possível editar este comunicado.\n\nDeseja enviar agora?')
      if (!confirmado) return
      setEnviando(true)
    } else setLoading(true)

    const res = await fetch(`/api/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug, enviar }),
    })

    if (res.ok) router.push(`/${slug}/comunicados`)
    else { setLoading(false); setEnviando(false) }
  }

  const canSend = !!form.title && !!form.body && !loading && !enviando && !uploading

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/comunicados`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Comunicados</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Novo comunicado</span>
        </div>
      </div>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Formulário */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label>Título *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Culto especial neste domingo" />
          </div>
          <div>
            <label>Mensagem *</label>
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              rows={6} placeholder="Digite a mensagem que será enviada para os membros..."
              style={{ resize: 'vertical' }} />
            <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>{form.body.length} caracteres</p>
          </div>

          {/* Upload imagem */}
          <div>
            <label>Imagem (opcional)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
            {form.imageUrl ? (
              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', marginTop: '6px' }}>
                <img src={form.imageUrl} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
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
                style={{ marginTop: '6px', width: '100%', padding: '10px', border: '1.5px dashed #e2e8f0', borderRadius: '8px', background: 'white', color: '#a0aec0', cursor: 'pointer', fontSize: '13px' }}
              >
                {uploading ? 'Enviando...' : '+ Adicionar imagem (JPG, PNG — máx. 5MB)'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button onClick={() => salvar(false)} disabled={!canSend}
              className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              {loading ? 'Salvando...' : 'Salvar rascunho'}
            </button>
            <button onClick={() => salvar(true)} disabled={!canSend}
              style={{
                flex: 1, background: '#667eea', color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: '8px', fontSize: '14px',
                fontWeight: '500', cursor: canSend ? 'pointer' : 'not-allowed', opacity: canSend ? 1 : 0.5,
              }}>
              {enviando ? 'Enviando...' : '🔔 Enviar notificação'}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Pré-visualização
          </p>

          {/* Card push notification */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {form.imageUrl && (
              <img src={form.imageUrl} alt="" style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
            )}
            <div style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '20px', height: '20px', background: '#667eea', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>⛪</div>
                <span style={{ fontSize: '11px', color: '#a0aec0', fontWeight: '500' }}>Ecclesia · agora</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 6px', lineHeight: 1.3 }}>
                {form.title || 'Título do comunicado'}
              </p>
              <p style={{ fontSize: '13px', color: '#4a5568', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {form.body || 'Sua mensagem aparecerá aqui...'}
              </p>
            </div>
          </div>

          <p style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center' }}>
            Enviado como notificação push para membros com o app instalado
          </p>
        </div>
      </div>
    </div>
  )
}
