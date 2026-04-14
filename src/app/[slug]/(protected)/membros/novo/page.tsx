'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { isValidCpfCnpj } from '@/lib/cpf'

export default function NovoMembroPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [grupos, setGrupos] = useState<string[]>([])

  useEffect(() => {
    fetch(`/api/groups?slug=${slug}`)
      .then(r => r.json())
      .then(data => setGrupos(Array.isArray(data) ? data.map((g: any) => g.name) : []))
  }, [slug])

  const [form, setForm] = useState({
    name: '', phone: '', cpfCnpj: '', email: '', group: '',
    role: 'MEMBER', isTither: true, suggestedTithe: '',
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
    setErro('')
    if (form.cpfCnpj && !isValidCpfCnpj(form.cpfCnpj)) {
      setErro('CPF ou CNPJ inválido. Verifique os dígitos.')
      return
    }
    setLoading(true)
    const res = await fetch(`/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug }),
    })
    if (!res.ok) { setErro('Erro ao cadastrar membro'); setLoading(false); return }
    router.push(`/${slug}/membros`)
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/membros`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Membros</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Novo membro</span>
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
            <label>CPF / CNPJ</label>
            <input name="cpfCnpj" value={form.cpfCnpj} onChange={handleChange} placeholder="000.000.000-00" />
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

          {erro && <p style={{ color: '#e53e3e', fontSize: '13px' }}>{erro}</p>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Link href={`/${slug}/membros`} className="btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Cancelar
            </Link>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, textAlign: 'center' }}>
              {loading ? 'Salvando...' : 'Salvar membro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}