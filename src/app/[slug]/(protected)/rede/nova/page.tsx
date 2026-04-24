'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Network, Copy, CheckCheck, ExternalLink } from 'lucide-react'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

interface CreatedFilial {
  name: string
  slug: string
  email: string
  password: string
}

export default function NovaFilialPage() {
  const params = useParams()
  const slug = params.slug as string

  const [form, setForm] = useState({ name: '', slug: '', pastorName: '', pastorEmail: '', pastorPassword: '' })
  const [slugEdited, setSlugEdited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedFilial | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  function handleNameChange(name: string) {
    setForm(p => ({ ...p, name, slug: slugEdited ? p.slug : slugify(name) }))
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true)
    setForm(p => ({ ...p, slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/filiais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Erro ao criar filial')
      setLoading(false)
      return
    }

    setCreated({ name: form.name, slug: form.slug, email: form.pastorEmail, password: form.pastorPassword })
    setLoading(false)
  }

  const isValid = form.name && form.slug && form.pastorName && form.pastorEmail && form.pastorPassword.length >= 6

  // Modal de sucesso
  if (created) {
    const url = `${created.slug}.ecclesia.app`
    return (
      <div className="page-content" style={{ maxWidth: '520px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', background: '#f0fff4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
            ✅
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 6px' }}>Filial criada!</h1>
          <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>
            <strong>{created.name}</strong> está pronta. Compartilhe os dados abaixo com o pastor responsável.
          </p>
        </div>

        <div className="card" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: '#a0aec0', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dados de acesso</h2>

          {[
            { label: 'URL de acesso', value: url, key: 'url' },
            { label: 'E-mail', value: created.email, key: 'email' },
            { label: 'Senha', value: created.password, key: 'password' },
          ].map(item => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f7fafc' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#a0aec0', margin: '0 0 2px' }}>{item.label}</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', margin: 0, fontFamily: item.key !== 'url' ? 'monospace' : undefined }}>
                  {item.value}
                </p>
              </div>
              <button
                onClick={() => copy(item.value, item.key)}
                style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: copied === item.key ? '#276749' : '#718096', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              >
                {copied === item.key ? <CheckCheck size={13} /> : <Copy size={13} />}
                {copied === item.key ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={`/${slug}/rede`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
            Voltar à rede
          </Link>
          <a
            href={`https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <ExternalLink size={14} />
            Acessar filial
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content" style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '28px' }}>
        <Link
          href={`/${slug}/rede`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#718096', textDecoration: 'none', marginBottom: '16px' }}
        >
          <ArrowLeft size={14} />
          Voltar
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Network size={22} color="var(--primary)" />
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>Nova filial</h1>
        </div>
        <p style={{ fontSize: '14px', color: '#718096', margin: '6px 0 0' }}>
          A filial terá seu próprio painel e pastor responsável.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#4a5568', margin: '0 0 16px' }}>Dados da filial</h2>

          <div style={{ marginBottom: '14px' }}>
            <label>Nome da filial *</label>
            <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Ex: Igreja Norte" required />
          </div>

          <div>
            <label>URL de acesso *</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
              <input
                value={form.slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="igreja-norte"
                required
                style={{ border: 'none !important', borderRadius: '0 !important', flex: 1, boxShadow: 'none !important' }}
              />
              <span style={{ padding: '10px 12px', background: '#f8f9fb', color: '#a0aec0', fontSize: '13px', whiteSpace: 'nowrap', borderLeft: '1.5px solid #e2e8f0', flexShrink: 0 }}>
                .ecclesia.app
              </span>
            </div>
            {form.slug && (
              <p style={{ fontSize: '12px', color: '#a0aec0', margin: '4px 0 0' }}>
                Acesso: <strong>{form.slug}.ecclesia.app</strong>
              </p>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#4a5568', margin: '0 0 16px' }}>Pastor responsável</h2>

          <div style={{ marginBottom: '14px' }}>
            <label>Nome *</label>
            <input value={form.pastorName} onChange={e => setForm(p => ({ ...p, pastorName: e.target.value }))} placeholder="Nome completo" required />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label>E-mail *</label>
            <input type="email" value={form.pastorEmail} onChange={e => setForm(p => ({ ...p, pastorEmail: e.target.value }))} placeholder="pastor@email.com" required />
          </div>
          <div>
            <label>Senha *</label>
            <input type="password" value={form.pastorPassword} onChange={e => setForm(p => ({ ...p, pastorPassword: e.target.value }))} placeholder="Mínimo 6 caracteres" minLength={6} required />
          </div>
        </div>

        {error && (
          <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#c53030', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={`/${slug}/rede`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>Cancelar</Link>
          <button type="submit" disabled={loading || !isValid} className="btn-primary" style={{ flex: 1, opacity: loading || !isValid ? 0.6 : 1, cursor: loading || !isValid ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Criando...' : 'Criar filial'}
          </button>
        </div>
      </form>
    </div>
  )
}
