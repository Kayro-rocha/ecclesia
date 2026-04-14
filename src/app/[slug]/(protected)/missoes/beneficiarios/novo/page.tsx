'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function NovoBeneficiarioPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', phone: '', familySize: '1', need: '', observations: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch(`/api/missions/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug }),
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
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Novo beneficiário</span>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label>Nome do responsável *</label>
            <input name="name" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
              placeholder="Nome completo" />
          </div>
          <div>
            <label>WhatsApp *</label>
            <input name="phone" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required
              placeholder="(27) 99999-9999" />
          </div>
          <div>
            <label>Tamanho da família</label>
            <input type="number" min="1" value={form.familySize}
              onChange={e => setForm(p => ({ ...p, familySize: e.target.value }))} />
          </div>
          <div>
            <label>Principal necessidade</label>
            <input value={form.need}
              onChange={e => setForm(p => ({ ...p, need: e.target.value }))}
              placeholder="Ex: Desemprego, doença, etc." />
          </div>
          <div>
            <label>Observações</label>
            <textarea value={form.observations}
              onChange={e => setForm(p => ({ ...p, observations: e.target.value }))}
              rows={3} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Link href={`/${slug}/missoes`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Cancelar
            </Link>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
              {loading ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
