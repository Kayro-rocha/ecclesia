'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Contact {
  id: string
  message: string
  sentAt: string
  type: string
}

interface Visitor {
  id: string
  name: string
  phone: string
  invitedBy: string | null
  howFound: string | null
  wantsHomeVisit: boolean
  visits: number
  lastVisit: string
  status: 'NEW' | 'RETURNED' | 'MEMBER' | 'INACTIVE'
  createdAt: string
  contacts: Contact[]
}

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Novo',
  RETURNED: 'Retornou',
  MEMBER: 'Virou membro',
  INACTIVE: 'Inativo',
}

const STATUS_STYLE: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-600 border-blue-200',
  RETURNED: 'bg-green-50 text-green-600 border-green-200',
  MEMBER: 'bg-purple-50 text-purple-600 border-purple-200',
  INACTIVE: 'bg-gray-100 text-gray-400 border-gray-200',
}

const HOW_FOUND_LABEL: Record<string, string> = {
  convite: 'Convite de membro',
  redes_sociais: 'Redes sociais',
  passou_na_frente: 'Passou na frente',
  familia: 'Família',
  outro: 'Outro',
}

export default function VisitantePerfilPage() {
  const params = useParams()
  const slug = params?.slug as string
  const id = params?.id as string

  const [visitor, setVisitor] = useState<Visitor | null>(null)
  const [editando, setEditando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    invitedBy: '',
    howFound: '',
    wantsHomeVisit: false,
  })

  const load = useCallback(() => {
    fetch(`/api/visitors/${id}`)
      .then(r => r.json())
      .then((v: Visitor) => {
        setVisitor(v)
        setForm({
          name: v.name,
          phone: v.phone,
          invitedBy: v.invitedBy || '',
          howFound: v.howFound || '',
          wantsHomeVisit: v.wantsHomeVisit,
        })
      })
  }, [id])

  useEffect(() => { load() }, [load])

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/visitors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const updated = await res.json()
      setVisitor(v => v ? { ...v, ...updated } : v)
      setEditando(false)
    }
    setSaving(false)
  }

  async function mudarStatus(status: string) {
    const res = await fetch(`/api/visitors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) setVisitor(v => v ? { ...v, status: status as Visitor['status'] } : v)
  }

  async function registrarVisita() {
    if (!confirm('Registrar nova visita hoje?')) return
    const res = await fetch(`/api/visitors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registerVisit: true }),
    })
    if (res.ok) {
      const updated = await res.json()
      setVisitor(v => v ? { ...v, ...updated } : v)
    }
  }

  if (!visitor) {
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
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/visitantes`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Visitantes</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>{visitor.name}</span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLE[visitor.status]}`}>
          {STATUS_LABEL[visitor.status]}
        </span>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Dados + edição */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e' }}>Dados do visitante</span>
            {!editando && (
              <button onClick={() => setEditando(true)}
                style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Editar
              </button>
            )}
          </div>

          {editando ? (
            <form onSubmit={salvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label>Nome</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label>WhatsApp</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
              </div>
              <div>
                <label>Convidado por</label>
                <input value={form.invitedBy} onChange={e => setForm(p => ({ ...p, invitedBy: e.target.value }))}
                  placeholder="Nome do membro" />
              </div>
              <div>
                <label>Como conheceu</label>
                <select value={form.howFound} onChange={e => setForm(p => ({ ...p, howFound: e.target.value }))}>
                  <option value="">Selecionar</option>
                  <option value="convite">Convite de membro</option>
                  <option value="redes_sociais">Redes sociais</option>
                  <option value="passou_na_frente">Passou na frente</option>
                  <option value="familia">Família</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="wantsHomeVisit" checked={form.wantsHomeVisit}
                  onChange={e => setForm(p => ({ ...p, wantsHomeVisit: e.target.checked }))}
                  style={{ width: '16px', padding: '0' }} />
                <label htmlFor="wantsHomeVisit" style={{ marginBottom: 0 }}>Quer visita em casa</label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="button" onClick={() => setEditando(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Row label="Telefone">
                <a href={`https://wa.me/55${visitor.phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noreferrer"
                  style={{ color: '#38a169', textDecoration: 'none', fontSize: '14px' }}>
                  {visitor.phone} ↗
                </a>
              </Row>
              <Row label="Convidado por">{visitor.invitedBy || '—'}</Row>
              <Row label="Como conheceu">{visitor.howFound ? (HOW_FOUND_LABEL[visitor.howFound] ?? visitor.howFound) : '—'}</Row>
              <Row label="Quer visita em casa">{visitor.wantsHomeVisit ? 'Sim' : 'Não'}</Row>
              <Row label="Cadastrado em">{new Date(visitor.createdAt).toLocaleDateString('pt-BR')}</Row>
            </div>
          )}
        </div>

        {/* Visitas */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#a0aec0', marginBottom: '4px' }}>Visitas registradas</p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a2e', lineHeight: 1 }}>{visitor.visits}x</p>
            <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
              Última: {new Date(visitor.lastVisit).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button onClick={registrarVisita} className="btn-primary">
            + Registrar nova visita
          </button>
        </div>

        {/* Status */}
        <div className="card">
          <p style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e', marginBottom: '12px' }}>
            Status do acompanhamento
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(['NEW', 'RETURNED', 'MEMBER', 'INACTIVE'] as const).map(s => (
              <button key={s} onClick={() => mudarStatus(s)}
                style={{
                  fontSize: '13px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                  border: visitor.status === s ? '1.5px solid var(--primary)' : '1.5px solid #e2e8f0',
                  background: visitor.status === s ? 'var(--primary-light)' : 'white',
                  color: visitor.status === s ? 'var(--primary)' : '#718096',
                  fontWeight: visitor.status === s ? '600' : '400',
                }}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '12px' }}>
            {visitor.status === 'NEW' && 'Visitou pela primeira vez. Acompanhe o retorno.'}
            {visitor.status === 'RETURNED' && 'Já retornou ao culto. Continue o acompanhamento.'}
            {visitor.status === 'MEMBER' && 'Foi integrado como membro da igreja.'}
            {visitor.status === 'INACTIVE' && 'Não retornou. Arquivado para histórico.'}
          </p>
        </div>

        {/* Histórico de contatos */}
        {visitor.contacts.length > 0 && (
          <div className="card">
            <p style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e', marginBottom: '12px' }}>
              Histórico de contatos
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visitor.contacts.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e2e8f0', marginTop: '6px', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '14px', color: '#1a1a2e' }}>{c.message}</p>
                    <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '2px' }}>
                      {new Date(c.sentAt).toLocaleDateString('pt-BR')} · {c.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-1">
      <span className="text-xs text-gray-400 w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-700 text-right">{children}</span>
    </div>
  )
}
