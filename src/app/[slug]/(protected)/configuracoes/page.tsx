'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function ConfiguracoesPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [registrandoWebhook, setRegistrandoWebhook] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgSenha, setMsgSenha] = useState('')
  const [msgWebhook, setMsgWebhook] = useState('')

  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [novoGrupo, setNovoGrupo] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)

  const [form, setForm] = useState({
    name: '',
    primaryColor: '#2563eb',
    pixKey: '',
    whatsappInstance: '',
  })

  const [senha, setSenha] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/church?slug=${slug}`).then(r => r.json()),
      fetch(`/api/groups?slug=${slug}`).then(r => r.json()),
    ]).then(([church, grps]) => {
      setForm({
        name: church.name || '',
        primaryColor: church.primaryColor || '#2563eb',
        pixKey: church.pixKey || '',
        whatsappInstance: church.whatsappInstance || '',
      })
      setGroups(Array.isArray(grps) ? grps : [])
      setLoading(false)
    })
  }, [slug])

  async function addGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!novoGrupo.trim()) return
    setAddingGroup(true)
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, name: novoGrupo.trim() }),
    })
    if (res.ok) {
      const g = await res.json()
      setGroups(prev => [...prev, g].sort((a, b) => a.name.localeCompare(b.name)))
      setNovoGrupo('')
    }
    setAddingGroup(false)
  }

  async function removeGroup(id: string) {
    await fetch('/api/groups', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setGroups(prev => prev.filter(g => g.id !== id))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setMsg('')
    const res = await fetch('/api/church', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug }),
    })
    setSalvando(false)
    if (res.ok) {
      setMsg('Configurações salvas com sucesso!')
      setTimeout(() => setMsg(''), 3000)
    } else {
      setMsg('Erro ao salvar. Tente novamente.')
    }
  }

  async function handleRegistrarWebhook() {
    setRegistrandoWebhook(true)
    setMsgWebhook('')
    const res = await fetch('/api/church/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    const data = await res.json()
    setRegistrandoWebhook(false)
    if (res.ok) {
      setMsgWebhook('Webhook registrado com sucesso!')
      setTimeout(() => setMsgWebhook(''), 4000)
    } else {
      setMsgWebhook(data.error || 'Erro ao registrar webhook.')
    }
  }

  async function handleSenha(e: React.FormEvent) {
    e.preventDefault()
    setMsgSenha('')
    if (senha.newPassword !== senha.confirmPassword) {
      setMsgSenha('As senhas não coincidem.')
      return
    }
    setSalvandoSenha(true)
    const res = await fetch('/api/users/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: senha.currentPassword, newPassword: senha.newPassword }),
    })
    const data = await res.json()
    setSalvandoSenha(false)
    if (res.ok) {
      setMsgSenha('Senha alterada com sucesso!')
      setSenha({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setMsgSenha(''), 3000)
    } else {
      setMsgSenha(data.error || 'Erro ao alterar senha.')
    }
  }

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <p style={{ color: '#a0aec0', fontSize: '14px' }}>Carregando...</p>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>Configurações</h1>
      </div>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* Dados da Igreja */}
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>Dados da Igreja</h2>

          <div>
            <label>Nome da igreja</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Nome da sua igreja" />
          </div>

          <div>
            <label>Cor principal</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="color"
                name="primaryColor"
                value={form.primaryColor}
                onChange={handleChange}
                style={{ width: '48px', height: '40px', padding: '2px 4px', cursor: 'pointer', borderRadius: '8px' }}
              />
              <input
                name="primaryColor"
                value={form.primaryColor}
                onChange={handleChange}
                placeholder="#2563eb"
                style={{ flex: 1 }}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
              Usada nos botões e destaques do painel
            </p>
          </div>

          {/* WhatsApp */}
          <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 12px' }}>WhatsApp</h2>
            <div>
              <label>Número / Instância Evolution</label>
              <input
                name="whatsappInstance"
                value={form.whatsappInstance}
                onChange={handleChange}
                placeholder="Ex: 27999998888 ou nome-da-instancia"
              />
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
                Usado para enviar comunicados e cobranças de dízimo via WhatsApp
              </p>
            </div>
          </div>

          {/* PIX */}
          <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 12px' }}>Financeiro</h2>
            <div>
              <label>Chave PIX</label>
              <input
                name="pixKey"
                value={form.pixKey}
                onChange={handleChange}
                placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              />
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
                Chave PIX da conta Asaas da igreja para recebimento de dízimos
              </p>
            </div>

            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleRegistrarWebhook}
                disabled={registrandoWebhook}
                style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                  border: '1px solid #e2e8f0', background: 'white', color: '#4a5568',
                  cursor: registrandoWebhook ? 'not-allowed' : 'pointer', fontWeight: '500',
                }}
              >
                {registrandoWebhook ? 'Registrando...' : 'Registrar webhook Asaas'}
              </button>
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
                Necessário para atualizar automaticamente o status dos dízimos pagos
              </p>
              {msgWebhook && (
                <p style={{ fontSize: '13px', marginTop: '4px', color: msgWebhook.includes('sucesso') ? '#276749' : '#e53e3e' }}>
                  {msgWebhook}
                </p>
              )}
            </div>
          </div>

          {msg && (
            <p style={{ fontSize: '13px', color: msg.includes('sucesso') ? '#276749' : '#e53e3e' }}>
              {msg}
            </p>
          )}

          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </form>

        {/* Grupos / Departamentos */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 4px' }}>Grupos / Departamentos</h2>
            <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>Usados em Membros, Eventos e Escalas</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '32px' }}>
            {groups.length === 0 && (
              <span style={{ fontSize: '13px', color: '#a0aec0' }}>Nenhum grupo criado ainda.</span>
            )}
            {groups.map(g => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'var(--primary-light)', borderRadius: '20px',
                padding: '4px 12px', fontSize: '13px', color: 'var(--primary)',
              }}>
                <span>{g.name}</span>
                <button
                  type="button"
                  onClick={() => removeGroup(g.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '16px', lineHeight: 1, padding: 0, opacity: 0.6 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={addGroup} style={{ display: 'flex', gap: '8px' }}>
            <input
              value={novoGrupo}
              onChange={e => setNovoGrupo(e.target.value)}
              placeholder="Ex: Jovens, Louvor, Mídia, Diaconato..."
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={addingGroup || !novoGrupo.trim()} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
              + Adicionar
            </button>
          </form>
        </div>

        {/* Alterar Senha */}
        <form onSubmit={handleSenha} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>Alterar senha</h2>

          <div>
            <label>Senha atual</label>
            <input
              type="password"
              value={senha.currentPassword}
              onChange={e => setSenha(p => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label>Nova senha</label>
            <input
              type="password"
              value={senha.newPassword}
              onChange={e => setSenha(p => ({ ...p, newPassword: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label>Confirmar nova senha</label>
            <input
              type="password"
              value={senha.confirmPassword}
              onChange={e => setSenha(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="••••••••"
            />
          </div>

          {msgSenha && (
            <p style={{ fontSize: '13px', color: msgSenha.includes('sucesso') ? '#276749' : '#e53e3e' }}>
              {msgSenha}
            </p>
          )}

          <button type="submit" disabled={salvandoSenha} className="btn-primary">
            {salvandoSenha ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>

      </div>
    </div>
  )
}
