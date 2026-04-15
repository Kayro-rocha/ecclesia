'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { isValidCpfCnpj } from '@/lib/cpf'



export default function EditarMembroPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const id = params?.id as string

  async function handleDelete() {
    if (!confirm(`Apagar ${form.name || 'este membro'}?\n\nIsso removerá também o histórico de dízimos e escalas. Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
    if (res.ok) router.push(`/${slug}/membros`)
  }

  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [grupos, setGrupos] = useState<string[]>([])

  const [form, setForm] = useState({
    name: '',
    phone: '',
    cpfCnpj: '',
    email: '',
    group: '',
    role: 'MEMBER',
    isTither: true,
    suggestedTithe: '',
    active: true,
  })

  useEffect(() => {
    fetch(`/api/groups?slug=${slug}`)
      .then(r => r.json())
      .then(data => setGrupos(Array.isArray(data) ? data.map((g: any) => g.name) : []))
  }, [slug])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/members/${id}?slug=${slug}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          cpfCnpj: data.cpfCnpj || '',
          email: data.email || '',
          group: data.group || '',
          role: data.role || 'MEMBER',
          isTither: data.isTither ?? true,
          suggestedTithe: data.suggestedTithe || '',
          active: data.active ?? true,
        })
        setLoading(false)
      })
  }, [id, slug])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (form.cpfCnpj && !isValidCpfCnpj(form.cpfCnpj)) {
      setErro('CPF ou CNPJ inválido. Verifique os dígitos.')
      return
    }
    setSalvando(true)

    const res = await fetch(`/api/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug }),
    })

    if (!res.ok) {
      setErro('Erro ao salvar')
      setSalvando(false)
      return
    }

    router.push(`/${slug}/membros`)
  }

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <p style={{ color: '#a0aec0', fontSize: '14px' }}>Carregando...</p>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/membros`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Membros</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Editar membro</span>
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
            <input name="phone" value={form.phone} onChange={handleChange} required placeholder="(27) 99999-9999" />
          </div>
          <div>
            <label>CPF <span style={{ fontSize: '11px', fontWeight: '400', color: '#718096' }}>(necessário para acesso ao app)</span></label>
            <input name="cpfCnpj" value={form.cpfCnpj} onChange={handleChange} placeholder="000.000.000-00" />
            {!form.cpfCnpj && (
              <p style={{ fontSize: '12px', color: '#dd6b20', margin: '4px 0 0' }}>
                ⚠️ Sem CPF este membro não consegue acessar o app.
              </p>
            )}
          </div>
          <div>
            <label>E-mail</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@exemplo.com" />
          </div>
          <div>
            <label>Grupo / Departamento</label>
            {grupos.length > 0 ? (
              <select name="group" value={form.group} onChange={handleChange}>
                <option value="">Sem grupo</option>
                {grupos.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
              <input name="group" value={form.group} onChange={handleChange} placeholder="Crie grupos em Configurações" />
            )}
          </div>
          <div>
            <label>Função</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="MEMBER">Membro</option>
              <option value="LEADER">Líder</option>
              <option value="ADMIN">Administrador</option>
              <option value="PASTOR">Pastor</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" name="isTither" id="isTither"
              checked={form.isTither} onChange={handleChange}
              style={{ width: '16px', padding: '0' }} />
            <label htmlFor="isTither" style={{ marginBottom: 0 }}>É dizimista</label>
          </div>
          {form.isTither && (
            <div>
              <label>Valor sugerido de dízimo (R$)</label>
              <input name="suggestedTithe" type="number" value={form.suggestedTithe}
                onChange={handleChange} placeholder="0,00" />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" name="active" id="active"
              checked={form.active} onChange={handleChange}
              style={{ width: '16px', padding: '0' }} />
            <label htmlFor="active" style={{ marginBottom: 0 }}>Membro ativo</label>
          </div>

          {erro && <p style={{ color: '#e53e3e', fontSize: '13px' }}>{erro}</p>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Link href={`/${slug}/membros`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Cancelar
            </Link>
            <button type="submit" disabled={salvando} className="btn-primary" style={{ flex: 1, textAlign: 'center' }}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '16px', marginTop: '4px' }}>
            <button type="button" onClick={handleDelete}
              style={{
                width: '100%', padding: '10px', borderRadius: '8px', fontSize: '14px',
                border: '1.5px solid #fed7d7', background: 'white', color: '#e53e3e',
                cursor: 'pointer', fontWeight: '500',
              }}>
              Apagar membro
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
