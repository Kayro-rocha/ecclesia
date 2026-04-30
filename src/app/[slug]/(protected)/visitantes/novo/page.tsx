'use client'

import { useState, useEffect, useRef } from 'react'
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

  // Detecção de visitante retornando
  const [lookupResult, setLookupResult] = useState<{ found: boolean; id?: string; phoneTail?: string } | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const name = form.name.trim()
    if (name.length < 3) { setLookupResult(null); return }

    debounceRef.current = setTimeout(async () => {
      setLookupLoading(true)
      const res = await fetch(`/api/visitors/lookup?slug=${slug}&name=${encodeURIComponent(name)}`)
      const data = await res.json()
      setLookupResult(data)
      setLookupLoading(false)
    }, 500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [form.name, slug])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  // Registrar nova visita para visitante já existente
  async function handleRegisterReturn() {
    if (!lookupResult?.id) return
    setLoading(true)
    await fetch(`/api/visitors/${lookupResult.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registerVisit: true }),
    })
    router.push(`/${slug}/visitantes/${lookupResult.id}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/visitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, phone: form.phone.replace(/\D/g, ''), slug }),
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

            {/* Banner de visitante encontrado */}
            {lookupLoading && (
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '6px' }}>Verificando...</p>
            )}
            {!lookupLoading && lookupResult?.found && (
              <div style={{ marginTop: '10px', padding: '14px', background: '#fffbeb', border: '1.5px solid #fbbf24', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
                  Visitante já cadastrado
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
                  Encontramos um visitante com esse nome. Número termina em <strong>**{lookupResult.phoneTail}</strong>.
                  <br />É a mesma pessoa? Registre a visita ao invés de criar um novo cadastro.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={handleRegisterReturn} disabled={loading}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#d97706', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    {loading ? 'Registrando...' : 'Registrar nova visita'}
                  </button>
                  <button type="button" onClick={() => setLookupResult(null)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #fbbf24', background: 'white', fontSize: '13px', color: '#92400e', cursor: 'pointer' }}>
                    Cadastrar como novo
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label>WhatsApp *</label>
            <input
              name="phone"
              value={form.phone}
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
                let formatted = digits
                if (digits.length > 2) formatted = `(${digits.slice(0,2)}) ${digits.slice(2)}`
                if (digits.length > 7) formatted = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
                setForm(p => ({ ...p, phone: formatted }))
              }}
              required
              placeholder="(11) 99999-9999"
              inputMode="numeric"
            />
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
