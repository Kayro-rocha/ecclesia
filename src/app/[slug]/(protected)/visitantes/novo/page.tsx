'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function NovoVisitantePage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    invitedBy: '',
    howFound: '',
    wantsHomeVisit: false,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch(`/api/visitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug }),
    })

    if (res.ok) router.push(`/${slug}/visitantes`)
    else setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/visitantes`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Visitantes</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Registrar visitante</span>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label>Nome completo *</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Nome completo" />
          </div>
          <div>
            <label>WhatsApp *</label>
            <input name="phone" value={form.phone} onChange={handleChange} required placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label>Convidado por (nome do membro)</label>
            <input name="invitedBy" value={form.invitedBy} onChange={handleChange} placeholder="Nome do membro que convidou" />
          </div>
          <div>
            <label>Como conheceu a igreja?</label>
            <select name="howFound" value={form.howFound} onChange={handleChange}>
              <option value="">Selecionar</option>
              <option value="convite">Convite de membro</option>
              <option value="redes_sociais">Redes sociais</option>
              <option value="passou_na_frente">Passou na frente</option>
              <option value="familia">Família</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" name="wantsHomeVisit" id="wantsHomeVisit"
              checked={form.wantsHomeVisit} onChange={handleChange}
              style={{ width: '16px', padding: '0' }} />
            <label htmlFor="wantsHomeVisit" style={{ marginBottom: 0 }}>Gostaria de receber uma visita em casa</label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Link href={`/${slug}/visitantes`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Cancelar
            </Link>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, textAlign: 'center' }}>
              {loading ? 'Salvando...' : 'Registrar visitante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
