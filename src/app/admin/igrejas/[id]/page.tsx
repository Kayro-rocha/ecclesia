'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { useModal } from '@/lib/useModal'

interface Church {
  id: string; name: string; slug: string; plan: string; active: boolean
  createdAt: string; pixKey: string | null; whatsappInstance: string | null
  users: { id: string; name: string; email: string }[]
  _count: {
    members: number; tithes: number; events: number; schedules: number
    announcements: number; visitors: number; missions: number; pushSubscriptions: number
  }
  members: { id: string; name: string; group: string; createdAt: string }[]
  tithes: { amount: number; month: number; year: number; paidAt: string }[]
}

export default function AdminIgrejaDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { confirm, modalNode } = useModal()

  const [church, setChurch] = useState<Church | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editPlan, setEditPlan] = useState('')
  const [editName, setEditName] = useState('')
  const [editMode, setEditMode] = useState(false)

  // Encerrar conta — confirmação inline
  const [encerrarMode, setEncerrarMode] = useState(false)
  const [encerrarSlug, setEncerrarSlug] = useState('')
  const [encerrandoLoading, setEncerrandoLoading] = useState(false)

  // Enviar convite
  const [inviteMode, setInviteMode] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/admin/churches/${id}`)
    if (res.status === 401) { router.push('/admin/login'); return }
    if (!res.ok) { router.push('/admin/igrejas'); return }
    const data = await res.json()
    setChurch(data)
    setEditPlan(data.plan)
    setEditName(data.name)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/admin/churches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: editPlan, name: editName }),
    })
    setEditMode(false)
    load()
    setSaving(false)
  }

  async function toggleActive() {
    if (!church) return
    if (!await confirm(church.active ? 'Suspender esta igreja?' : 'Reativar esta igreja?')) return
    await fetch(`/api/admin/churches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !church.active }),
    })
    load()
  }

  async function handleEncerrar() {
    if (!church) return
    setEncerrandoLoading(true)
    await fetch(`/api/admin/churches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encerrar: true }),
    })
    setEncerrarMode(false)
    setEncerrarSlug('')
    setEncerrandoLoading(false)
    load()
  }

  async function handleSendInvite() {
    if (!church) return
    setInviteLoading(true)
    setInviteMsg('')
    const res = await fetch(`/api/admin/churches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sendInvite: true, inviteEmail }),
    })
    setInviteLoading(false)
    if (res.ok) {
      setInviteMsg('Convite enviado com sucesso!')
      setInviteMode(false)
      setInviteEmail('')
    } else {
      const d = await res.json()
      setInviteMsg(d.error || 'Erro ao enviar.')
    }
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Carregando...</div>
  if (!church) return null

  const totalRevenue = church.tithes.reduce((s, t) => s + t.amount, 0)
  const monthlyValue = church.plan === 'REDE' ? '199,90' : '79,90'
  const pastor = church.users[0] ?? null
  const isEncerrada = church.slug.startsWith('_cancelado-')

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/admin/igrejas" style={{ fontSize: '13px', color: '#475569', textDecoration: 'none' }}>← Igrejas</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'white', margin: 0 }}>{church.name}</h1>
              <span className={`admin-badge ${church.active ? 'badge-active' : 'badge-inactive'}`}>{church.active ? 'Ativa' : 'Inativa'}</span>
              <span className={`admin-badge ${church.plan === 'REDE' ? 'badge-rede' : 'badge-igreja'}`}>{church.plan}</span>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0', fontFamily: 'monospace' }}>{church.slug}.ecclesiaa.com</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setEditMode(!editMode)} className="admin-btn admin-btn-ghost">
              {editMode ? 'Cancelar' : 'Editar'}
            </button>
            <button onClick={toggleActive} className={`admin-btn ${church.active ? 'admin-btn-danger' : 'admin-btn-ghost'}`}>
              {church.active ? 'Suspender' : 'Reativar'}
            </button>
            {!isEncerrada && (
              <button
                onClick={() => { setEncerrarMode(true); setEncerrarSlug('') }}
                className="admin-btn"
                style={{ background: 'transparent', border: '1px solid #7f1d1d', color: '#fca5a5', fontSize: '12px' }}
              >
                Encerrar conta
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal inline — Encerrar conta */}
      {encerrarMode && (
        <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ color: '#fca5a5', fontSize: '15px', fontWeight: '600', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} /> Encerrar conta definitivamente
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px', lineHeight: 1.6 }}>
            Esta ação não pode ser desfeita. O slug <code style={{ color: '#fca5a5' }}>{church.slug}</code> será liberado para outros clientes.<br />
            Para confirmar, digite o slug da igreja abaixo:
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              className="admin-input"
              placeholder={church.slug}
              value={encerrarSlug}
              onChange={e => setEncerrarSlug(e.target.value)}
              style={{ maxWidth: '260px' }}
            />
            <button
              onClick={handleEncerrar}
              disabled={encerrarSlug !== church.slug || encerrandoLoading}
              className="admin-btn"
              style={{
                background: encerrarSlug === church.slug ? '#7f1d1d' : 'transparent',
                border: '1px solid #7f1d1d',
                color: encerrarSlug === church.slug ? 'white' : '#64748b',
                cursor: encerrarSlug === church.slug ? 'pointer' : 'not-allowed',
              }}
            >
              {encerrandoLoading ? 'Encerrando...' : 'Confirmar encerramento'}
            </button>
            <button onClick={() => { setEncerrarMode(false); setEncerrarSlug('') }} className="admin-btn admin-btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editMode && (
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: '0 0 16px' }}>Editar dados</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Nome</label>
              <input className="admin-input" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Plano</label>
              <select className="admin-input" value={editPlan} onChange={e => setEditPlan(e.target.value)}>
                <option value="IGREJA">Igreja — R$ 79,90/mês</option>
                <option value="REDE">Rede — R$ 199,90/mês</option>
              </select>
            </div>
            <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Membros ativos', value: church._count.members, color: '#3b82f6' },
          { label: 'Eventos', value: church._count.events, color: '#a78bfa' },
          { label: 'Dízimos registrados', value: church._count.tithes, color: '#f59e0b' },
          { label: 'Assinantes push', value: church._count.pushSubscriptions, color: '#4ade80' },
        ].map(s => (
          <div key={s.label} className="admin-card" style={{ borderTop: `3px solid ${s.color}`, padding: '16px' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px', fontWeight: '500' }}>{s.label}</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: 'white', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Dados gerais */}
        <div className="admin-card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: '0 0 16px' }}>Informações</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Slug', value: church.slug, mono: true },
              { label: 'Plano', value: `${church.plan} — R$ ${monthlyValue}/mês` as string },
              { label: 'Cadastro', value: new Date(church.createdAt).toLocaleDateString('pt-BR') },
              { label: 'PIX', value: church.pixKey || 'Não configurado' },
              { label: 'WhatsApp', value: church.whatsappInstance || 'Não configurado' },
              { label: 'Visitantes', value: String(church._count.visitors) },
              { label: 'Escalas', value: String(church._count.schedules) },
              { label: 'Comunicados', value: String(church._count.announcements) },
              { label: 'Missões', value: String(church._count.missions) },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{item.label}</span>
                <span style={{ fontSize: '13px', color: '#e2e8f0', fontFamily: item.mono ? 'monospace' : undefined }}>{item.value}</span>
              </div>
            ))}

            {/* Pastor / Acesso */}
            <div style={{ padding: '10px 0 0' }}>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acesso do pastor</p>
              {pastor ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0 }}>{pastor.name}</p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>{pastor.email}</p>
                  </div>
                  <button
                    onClick={() => { setInviteMode(true); setInviteEmail(pastor.email) }}
                    className="admin-btn admin-btn-ghost"
                    style={{ fontSize: '12px' }}
                  >
                    Reenviar acesso
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#f59e0b' }}>Sem conta criada</span>
                  <button
                    onClick={() => setInviteMode(true)}
                    className="admin-btn admin-btn-primary"
                    style={{ fontSize: '12px' }}
                  >
                    Enviar convite
                  </button>
                </div>
              )}

              {/* Form inline de convite */}
              {inviteMode && (
                <div style={{ marginTop: '12px', padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px' }}>
                    {pastor ? 'Reenviar e-mail de acesso para:' : 'E-mail do pastor para enviar o convite:'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="email"
                      className="admin-input"
                      placeholder="pastor@email.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={handleSendInvite}
                      disabled={inviteLoading || !inviteEmail}
                      className="admin-btn admin-btn-primary"
                      style={{ opacity: inviteLoading || !inviteEmail ? 0.6 : 1, whiteSpace: 'nowrap' }}
                    >
                      {inviteLoading ? 'Enviando...' : 'Enviar'}
                    </button>
                    <button onClick={() => { setInviteMode(false); setInviteMsg('') }} className="admin-btn admin-btn-ghost">
                      Cancelar
                    </button>
                  </div>
                  {inviteMsg && (
                    <p style={{ fontSize: '12px', margin: '8px 0 0', color: inviteMsg.includes('sucesso') ? '#4ade80' : '#f87171' }}>
                      {inviteMsg}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Receita */}
        <div className="admin-card">
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: '0 0 16px' }}>Dízimos pagos (últimos 10)</h2>
          {church.tithes.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#475569' }}>Nenhum dízimo registrado</p>
          ) : (
            <>
              <div style={{ marginBottom: '12px', padding: '10px 14px', background: '#0f172a', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Total (amostra)</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#4ade80' }}>
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Valor</th>
                    <th>Pago em</th>
                  </tr>
                </thead>
                <tbody>
                  {church.tithes.map((t, i) => (
                    <tr key={i}>
                      <td style={{ color: '#94a3b8' }}>{String(t.month).padStart(2, '0')}/{t.year}</td>
                      <td style={{ color: '#4ade80' }}>R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ color: '#64748b', fontSize: '12px' }}>{t.paidAt ? new Date(t.paidAt).toLocaleDateString('pt-BR') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* Membros recentes */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', margin: 0 }}>
            Membros recentes ({church._count.members} total)
          </h2>
          <a
            href={`https://${church.slug}.ecclesiaa.com`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none' }}
          >
            Acessar painel →
          </a>
        </div>
        {church.members.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#475569' }}>Nenhum membro cadastrado</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Grupo</th>
                <th>Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {church.members.map(m => (
                <tr key={m.id}>
                  <td style={{ color: '#e2e8f0' }}>{m.name}</td>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>{m.group || '—'}</td>
                  <td style={{ color: '#64748b', fontSize: '12px' }}>{new Date(m.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modalNode}
    </div>
  )
}
