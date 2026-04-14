'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Beneficiary {
  id: string
  name: string
  phone: string
  familySize: number
  need: string | null
  observations: string | null
  startDate: string
  active: boolean
}

export default function BeneficiarioPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [beneficiario, setBeneficiario] = useState<Beneficiary | null>(null)
  const [form, setForm] = useState({
    name: '', phone: '', familySize: '1', need: '', observations: '', active: true,
  })

  useEffect(() => {
    fetch(`/api/missions/beneficiaries/${id}`)
      .then(r => r.json())
      .then(data => {
        setBeneficiario(data)
        setForm({
          name: data.name,
          phone: data.phone,
          familySize: String(data.familySize),
          need: data.need || '',
          observations: data.observations || '',
          active: data.active,
        })
        setLoading(false)
      })
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleSave() {
    setSalvando(true)
    const res = await fetch(`/api/missions/beneficiaries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      setBeneficiario(data)
      setEditando(false)
    }
    setSalvando(false)
  }

  async function handleDelete() {
    if (!confirm(`Apagar beneficiário "${beneficiario?.name}"?\n\nEsta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/missions/beneficiaries/${id}`, { method: 'DELETE' })
    if (res.ok) router.push(`/${slug}/missoes`)
  }

  async function toggleActive() {
    if (!beneficiario) return
    const newActive = !beneficiario.active
    const res = await fetch(`/api/missions/beneficiaries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, active: newActive }),
    })
    if (res.ok) {
      const data = await res.json()
      setBeneficiario(data)
      setForm(prev => ({ ...prev, active: newActive }))
    }
  }

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <p style={{ color: '#a0aec0', fontSize: '14px' }}>Carregando...</p>
    </div>
  )

  if (!beneficiario) return null

  const mesesAtivo = Math.floor(
    (Date.now() - new Date(beneficiario.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
  )

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/missoes`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Missões</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>{beneficiario.name}</span>
        </div>
        {!editando && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setEditando(true)} className="btn-secondary">Editar</button>
            <button onClick={handleDelete} style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
              border: '1.5px solid #fed7d7', background: 'white', color: '#e53e3e', cursor: 'pointer',
            }}>Apagar</button>
          </div>
        )}
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {editando ? (
          <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label>Nome do responsável *</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div>
                <label>WhatsApp *</label>
                <input name="phone" value={form.phone} onChange={handleChange} required />
              </div>
              <div>
                <label>Tamanho da família</label>
                <input type="number" name="familySize" min="1" value={form.familySize} onChange={handleChange} />
              </div>
              <div>
                <label>Principal necessidade</label>
                <input name="need" value={form.need} onChange={handleChange} placeholder="Ex: Desemprego, doença, etc." />
              </div>
              <div>
                <label>Observações</label>
                <textarea name="observations" value={form.observations} onChange={handleChange}
                  rows={3} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" name="active" id="active" checked={form.active}
                  onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
                  style={{ width: '16px', padding: '0' }} />
                <label htmlFor="active" style={{ marginBottom: 0 }}>Beneficiário ativo</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setEditando(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSave} disabled={salvando} className="btn-primary" style={{ flex: 1 }}>
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#a0aec0' }}>WhatsApp</p>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>{beneficiario.phone}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#a0aec0' }}>Família</p>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>{beneficiario.familySize} pessoas</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#a0aec0' }}>Tempo como beneficiário</p>
                  <span className={mesesAtivo >= 2 ? 'badge-red' : 'badge-green'}>{mesesAtivo} {mesesAtivo === 1 ? 'mês' : 'meses'}</span>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#a0aec0' }}>Status</p>
                  <span className={beneficiario.active ? 'badge-green' : 'badge-gray'}>
                    {beneficiario.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              {beneficiario.need && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '4px' }}>Principal necessidade</p>
                  <p style={{ fontSize: '14px', color: '#1a1a2e' }}>{beneficiario.need}</p>
                </div>
              )}
              {beneficiario.observations && (
                <div>
                  <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '4px' }}>Observações</p>
                  <p style={{ fontSize: '14px', color: '#1a1a2e' }}>{beneficiario.observations}</p>
                </div>
              )}
            </div>

            <div className="card">
              <p style={{ fontSize: '13px', color: '#718096', marginBottom: '12px' }}>
                Beneficiário desde {new Date(beneficiario.startDate).toLocaleDateString('pt-BR')}
              </p>
              <button onClick={toggleActive}
                className={beneficiario.active ? 'btn-secondary' : 'btn-primary'}
                style={{ width: '100%' }}>
                {beneficiario.active ? 'Marcar como inativo' : 'Reativar beneficiário'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
