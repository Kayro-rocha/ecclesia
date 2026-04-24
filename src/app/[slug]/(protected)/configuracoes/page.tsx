'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'

export default function ConfiguracoesPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgSenha, setMsgSenha] = useState('')

  // Automação WhatsApp
  const [auto, setAuto] = useState({ enabled: false, triggerDays: 3, message: '' })
  const [salvandoAuto, setSalvandoAuto] = useState(false)
  const [msgAuto, setMsgAuto] = useState('')

  // WhatsApp
  const [waStatus, setWaStatus] = useState<'open' | 'close' | 'connecting' | 'notfound' | 'loading'>('loading')
  const [waQr, setWaQr] = useState<string | null>(null)
  const [waNumber, setWaNumber] = useState<string | null>(null)
  const [waConnecting, setWaConnecting] = useState(false)
  const [waDisconnecting, setWaDisconnecting] = useState(false)
  const waPollingRef = useRef<NodeJS.Timeout | null>(null)

  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [novoGrupo, setNovoGrupo] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [form, setForm] = useState({
    name: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    logoUrl: '',
    pixKey: '',
    whatsappInstance: '',
    phone: '',
  })

  const [senha, setSenha] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const fetchWaStatus = useCallback(async () => {
    const res = await fetch(`/api/whatsapp/status?slug=${slug}`)
    const data = await res.json()
    setWaStatus(data.status)
    setWaNumber(data.number ?? null)
    if (data.status === 'open') {
      setWaQr(null)
      if (waPollingRef.current) { clearInterval(waPollingRef.current); waPollingRef.current = null }
    }
  }, [slug])

  useEffect(() => {
    fetchWaStatus()
    return () => { if (waPollingRef.current) clearInterval(waPollingRef.current) }
  }, [fetchWaStatus])

  async function handleWaConnect() {
    setWaConnecting(true)
    setWaQr(null)
    const res = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    const data = await res.json()
    setWaConnecting(false)
    if (data.qr) {
      setWaQr(data.qr)
      setWaStatus('connecting')
      waPollingRef.current = setInterval(fetchWaStatus, 3000)
    } else if (data.status === 'open') {
      await fetchWaStatus()
    }
  }

  async function handleWaDisconnect() {
    if (!confirm('Desconectar o WhatsApp desta igreja?')) return
    setWaDisconnecting(true)
    await fetch('/api/whatsapp/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    setWaDisconnecting(false)
    setWaQr(null)
    setWaNumber(null)
    setWaStatus('notfound')
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/church?slug=${slug}`).then(r => r.json()),
      fetch(`/api/groups?slug=${slug}`).then(r => r.json()),
      fetch(`/api/visitor-automation?slug=${slug}`).then(r => r.json()),
    ]).then(([church, grps, automation]) => {
      setForm({
        name: church.name || '',
        primaryColor: church.primaryColor || '#2563eb',
        secondaryColor: church.secondaryColor || '#1e40af',
        logoUrl: church.logoUrl || '',
        pixKey: church.pixKey || '',
        whatsappInstance: church.whatsappInstance || '',
        phone: church.phone || '',
      })
      setGroups(Array.isArray(grps) ? grps : [])
      if (automation && !automation.error) {
        setAuto({ enabled: automation.enabled ?? false, triggerDays: automation.triggerDays ?? 3, message: automation.message ?? '' })
      }
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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('slug', slug)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) setForm(p => ({ ...p, logoUrl: data.url }))
    setUploadingLogo(false)
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


  async function handleSaveAuto(e: React.FormEvent) {
    e.preventDefault()
    setSalvandoAuto(true)
    setMsgAuto('')
    const res = await fetch('/api/visitor-automation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, ...auto }),
    })
    setSalvandoAuto(false)
    if (res.ok) {
      setMsgAuto('Automação salva com sucesso!')
      setTimeout(() => setMsgAuto(''), 3000)
    } else {
      setMsgAuto('Erro ao salvar automação.')
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
      {/* Header */}
      <div className="page-header">
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>Configurações</h1>
      </div>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── COLUNA ESQUERDA ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Card: Identidade visual */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' }}>Identidade visual</h2>
              <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>Nome, logo e cores da sua igreja</p>
            </div>

            <div>
              <label>Nome da igreja</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Nome da sua igreja" />
            </div>

            <div>
              <label>Logo da igreja</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: form.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'white', border: '2px solid #edf2f7' }}>
                  {form.logoUrl ? <img src={form.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : form.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingLogo}
                    style={{ padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', fontSize: '13px', cursor: 'pointer', color: '#4a5568' }}>
                    {uploadingLogo ? 'Enviando...' : form.logoUrl ? 'Trocar logo' : 'Enviar logo'}
                  </button>
                  {form.logoUrl && (
                    <button type="button" onClick={() => setForm(p => ({ ...p, logoUrl: '' }))}
                      style={{ marginLeft: '8px', padding: '7px 12px', border: 'none', borderRadius: '8px', background: '#fff5f5', fontSize: '13px', cursor: 'pointer', color: '#e53e3e' }}>
                      Remover
                    </button>
                  )}
                  <p style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }}>PNG ou JPG, máx. 2MB.</p>
                </div>
              </div>
            </div>

            <div>
              <label>Cor principal</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" name="primaryColor" value={form.primaryColor} onChange={handleChange}
                  style={{ width: '44px', height: '38px', padding: '2px 4px', cursor: 'pointer', borderRadius: '8px' }} />
                <input name="primaryColor" value={form.primaryColor} onChange={handleChange} placeholder="#2563eb" style={{ flex: 1 }} />
              </div>
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>Usada nos botões e destaques do painel</p>
            </div>

            <div>
              <label>Cor secundária</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" name="secondaryColor" value={form.secondaryColor} onChange={handleChange}
                  style={{ width: '44px', height: '38px', padding: '2px 4px', cursor: 'pointer', borderRadius: '8px' }} />
                <input name="secondaryColor" value={form.secondaryColor} onChange={handleChange} placeholder="#1e40af" style={{ flex: 1 }} />
              </div>
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>Gradiente da tela de login</p>
            </div>

            {/* Preview */}
            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #edf2f7' }}>
              <p style={{ fontSize: '11px', color: '#a0aec0', padding: '6px 12px', background: '#f8f9fb', margin: 0, borderBottom: '1px solid #edf2f7' }}>Preview da tela de login</p>
              <div style={{ height: '72px', background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: 'white', overflow: 'hidden' }}>
                  {form.logoUrl ? <img src={form.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : form.name.charAt(0)}
                </div>
                <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{form.name || 'Nome da Igreja'}</span>
              </div>
            </div>
          </div>

          {/* Card: Contato & Financeiro */}
          <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' }}>Contato & Financeiro</h2>
              <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>WhatsApp exibido no app e integração de pagamentos</p>
            </div>

            <div>
              <label>Número de contato da igreja</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Ex: (11) 99999-8888" />
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>Exibido no app dos membros</p>
            </div>

            <div>
              <label>Chave PIX</label>
              <input name="pixKey" value={form.pixKey} onChange={handleChange} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" />
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>Chave PIX para recebimento de dízimos e ofertas</p>
            </div>

            {msg &&<p style={{ fontSize: '13px', color: msg.includes('sucesso') ? '#276749' : '#e53e3e' }}>{msg}</p>}

            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </form>

        </div>

        {/* ── COLUNA DIREITA ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Card: Grupos */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' }}>Grupos / Departamentos</h2>
              <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>Usados em Membros, Eventos e Escalas</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '28px' }}>
              {groups.length === 0 && <span style={{ fontSize: '13px', color: '#a0aec0' }}>Nenhum grupo criado ainda.</span>}
              {groups.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary-light)', borderRadius: '20px', padding: '4px 12px', fontSize: '13px', color: 'var(--primary)' }}>
                  <span>{g.name}</span>
                  <button type="button" onClick={() => removeGroup(g.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '16px', lineHeight: 1, padding: 0, opacity: 0.6 }}>×</button>
                </div>
              ))}
            </div>

            <form onSubmit={addGroup} style={{ display: 'flex', gap: '8px' }}>
              <input value={novoGrupo} onChange={e => setNovoGrupo(e.target.value)} placeholder="Ex: Jovens, Louvor, Mídia..." style={{ flex: 1 }} />
              <button type="submit" disabled={addingGroup || !novoGrupo.trim()} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>+ Adicionar</button>
            </form>
          </div>

          {/* Card: Conexão WhatsApp */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' }}>Conexão WhatsApp</h2>
              <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>Vincula o número da igreja para envio de mensagens</p>
            </div>

            {waStatus === 'loading' && <p style={{ fontSize: '13px', color: '#a0aec0' }}>Verificando status...</p>}

            {waStatus === 'open' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f0fff4', borderRadius: '10px', border: '1px solid #c6f6d5', marginBottom: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38a169', flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#276749' }}>WhatsApp conectado</p>
                    {waNumber && <p style={{ margin: 0, fontSize: '12px', color: '#38a169' }}>+{waNumber}</p>}
                  </div>
                </div>
                <button type="button" onClick={handleWaDisconnect} disabled={waDisconnecting}
                  style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px', border: '1px solid #fed7d7', background: '#fff5f5', color: '#e53e3e', cursor: waDisconnecting ? 'not-allowed' : 'pointer' }}>
                  {waDisconnecting ? 'Desconectando...' : 'Desconectar WhatsApp'}
                </button>
              </div>
            )}

            {(waStatus === 'close' || waStatus === 'notfound') && !waQr && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#fff5f5', borderRadius: '10px', border: '1px solid #fed7d7', marginBottom: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e53e3e', flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '13px', color: '#c53030' }}>WhatsApp não conectado</p>
                </div>
                <button type="button" onClick={handleWaConnect} disabled={waConnecting} className="btn-primary" style={{ fontSize: '13px' }}>
                  {waConnecting ? 'Gerando QR Code...' : 'Conectar WhatsApp'}
                </button>
              </div>
            )}

            {waStatus === 'connecting' && waQr && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#4a5568', marginBottom: '12px' }}>
                  Abra o WhatsApp → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong>
                </p>
                <div style={{ display: 'inline-block', padding: '10px', background: 'white', borderRadius: '12px', border: '1px solid #edf2f7', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <img src={waQr} alt="QR Code WhatsApp" style={{ width: '200px', height: '200px', display: 'block' }} />
                </div>
                <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '10px' }}>Verificando conexão automaticamente...</p>
              </div>
            )}

            {waStatus === 'connecting' && !waQr && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fef08a' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>Aguardando leitura do QR code...</p>
              </div>
            )}
          </div>

          {/* Card: Automação de visitantes */}
          <form onSubmit={handleSaveAuto} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' }}>Automação de visitantes</h2>
              <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>Mensagem automática via WhatsApp após X dias sem contato</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: auto.enabled ? '#f0fff4' : '#f8f9fb', borderRadius: '10px', border: `1px solid ${auto.enabled ? '#c6f6d5' : '#edf2f7'}` }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: auto.enabled ? '#276749' : '#4a5568', margin: 0 }}>
                  {auto.enabled ? 'Automação ativa' : 'Automação desativada'}
                </p>
                <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>
                  {auto.enabled ? 'Mensagens enviadas automaticamente' : 'Ative para começar a enviar'}
                </p>
              </div>
              <button type="button" onClick={() => setAuto(p => ({ ...p, enabled: !p.enabled }))}
                style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: auto.enabled ? '#38a169' : '#cbd5e0', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: '3px', left: auto.enabled ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>

            <div>
              <label>Dias sem contato para disparar</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="number" min={1} max={30} value={auto.triggerDays}
                  onChange={e => setAuto(p => ({ ...p, triggerDays: Number(e.target.value) }))}
                  style={{ width: '80px' }} />
                <span style={{ fontSize: '13px', color: '#718096' }}>dias após o cadastro</span>
              </div>
            </div>

            <div>
              <label>Mensagem automática</label>
              <textarea value={auto.message} onChange={e => setAuto(p => ({ ...p, message: e.target.value }))}
                placeholder="Olá [nome]! Foi uma alegria ter você conosco..."
                rows={4}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '10px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>Use <strong>[nome]</strong> para personalizar</p>
            </div>

            {msgAuto && <p style={{ fontSize: '13px', color: msgAuto.includes('sucesso') ? '#276749' : '#e53e3e' }}>{msgAuto}</p>}
            <button type="submit" disabled={salvandoAuto} className="btn-primary">{salvandoAuto ? 'Salvando...' : 'Salvar automação'}</button>
          </form>

          {/* Card: Alterar senha */}
          <form onSubmit={handleSenha} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' }}>Alterar senha</h2>
              <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>Segurança da sua conta de acesso</p>
            </div>

            <div>
              <label>Senha atual</label>
              <input type="password" value={senha.currentPassword} onChange={e => setSenha(p => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" />
            </div>
            <div>
              <label>Nova senha</label>
              <input type="password" value={senha.newPassword} onChange={e => setSenha(p => ({ ...p, newPassword: e.target.value }))} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label>Confirmar nova senha</label>
              <input type="password" value={senha.confirmPassword} onChange={e => setSenha(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="••••••••" />
            </div>

            {msgSenha && <p style={{ fontSize: '13px', color: msgSenha.includes('sucesso') ? '#276749' : '#e53e3e' }}>{msgSenha}</p>}
            <button type="submit" disabled={salvandoSenha} className="btn-primary">{salvandoSenha ? 'Alterando...' : 'Alterar senha'}</button>
          </form>

        </div>
      </div>
    </div>
  )
}
