'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useModal } from '@/lib/useModal'

export default function ConfiguracoesPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { confirm, modalNode } = useModal()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  // Automação WhatsApp
  const [auto, setAuto] = useState({ enabled: false, triggerDays: 3, message: '', autoReply: '', followUpMessage: '', notifyAfterEvent: false })
  const [salvandoAuto, setSalvandoAuto] = useState(false)
  const [msgAuto, setMsgAuto] = useState('')

  // Cultos fixos
  type Culto = { id: string; weekday: number; hour: number; minute: number }
  const [cultos, setCultos] = useState<Culto[]>([])
  const [addingCulto, setAddingCulto] = useState(false)
  const [novoCulto, setNovoCulto] = useState({ weekday: 0, hour: 19, minute: 0 })

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

  const [form, setForm] = useState({ pixKey: '', phone: '', address: '', cep: '' })
  const [hasCoords, setHasCoords] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

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
    if (!await confirm('Desconectar o WhatsApp desta igreja?', { title: 'Desconectar WhatsApp', confirmText: 'Desconectar', variant: 'danger' })) return
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
      fetch(`/api/church?slug=${slug}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/groups?slug=${slug}`).then(r => r.json()).catch(() => []),
      fetch(`/api/visitor-automation?slug=${slug}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/culto-schedules?slug=${slug}`).then(r => r.json()).catch(() => []),
    ]).then(([church, grps, automation, cultosData]) => {
      setForm({
        pixKey: church.pixKey || '',
        phone: (() => { const d = (church.phone || '').replace(/\D/g, '').slice(0,11); if (d.length > 7) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`; if (d.length > 2) return `(${d.slice(0,2)}) ${d.slice(2)}`; return d })(),
        address: church.address || '',
        cep: '',
      })
      setHasCoords(church.lat != null && church.lng != null)
      setGroups(Array.isArray(grps) ? grps : [])
      if (automation && !automation.error) {
        setAuto({
          enabled: automation.enabled ?? false,
          triggerDays: automation.triggerDays ?? 3,
          message: automation.message ?? '',
          autoReply: automation.autoReply ?? '',
          followUpMessage: automation.followUpMessage ?? '',
          notifyAfterEvent: automation.notifyAfterEvent ?? false,
        })
      }
      if (Array.isArray(cultosData)) setCultos(cultosData)
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setMsg('')
    const res = await fetch('/api/church', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, phone: form.phone.replace(/\D/g, ''), slug }),
    })
    setSalvando(false)
    if (res.ok) {
      const updated = await res.json()
      setHasCoords(updated.lat != null && updated.lng != null)
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

  async function buscarCep(cep: string) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setBuscandoCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        const endereco = [data.logradouro, data.bairro, `${data.localidade}/${data.uf}`]
          .filter(Boolean).join(', ')
        setForm(p => ({ ...p, address: endereco, cep: digits }))
      }
    } finally {
      setBuscandoCep(false)
    }
  }

  async function addCulto() {
    const res = await fetch('/api/culto-schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, ...novoCulto }),
    })
    if (res.ok) {
      const created = await res.json()
      setCultos(prev => [...prev, created].sort((a, b) => a.weekday - b.weekday || a.hour - b.hour))
      setAddingCulto(false)
      setNovoCulto({ weekday: 0, hour: 19, minute: 0 })
    }
  }

  async function removeCulto(id: string) {
    const res = await fetch('/api/culto-schedules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setCultos(prev => prev.filter(c => c.id !== id))
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

        {/* ── COLUNA ESQUERDA ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Card: Contato & Financeiro */}
          <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' }}>Contato & Financeiro</h2>
              <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>Número de contato, endereço e pagamentos</p>
            </div>

            <div>
              <label>Número de contato da igreja (WhatsApp)</label>
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
                placeholder="(27) 99999-8888"
                inputMode="numeric"
              />
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>Apenas números — exibido como botão WhatsApp no app dos membros</p>
            </div>

            <div>
              <label>CEP da igreja</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={form.cep}
                  onChange={e => { setForm(p => ({ ...p, cep: e.target.value })); buscarCep(e.target.value) }}
                  placeholder="Ex: 29000-000"
                  maxLength={9}
                  style={{ flex: 1 }}
                />
                {buscandoCep && <span style={{ fontSize: '12px', color: '#a0aec0', alignSelf: 'center' }}>Buscando...</span>}
              </div>
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>Digite o CEP para preencher o endereço automaticamente</p>
            </div>

            <div>
              <label>Endereço da igreja</label>
              <input name="address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Ex: Rua das Flores, 123, Bairro, Cidade/UF" />
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
                {hasCoords
                  ? '✓ Localização geocodificada — presença automática ativa'
                  : 'Salve para geocodificar a localização automaticamente'}
              </p>
            </div>


            <div>
              <label>Chave PIX</label>
              <input name="pixKey" value={form.pixKey} onChange={e => setForm(p => ({ ...p, pixKey: e.target.value }))} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" />
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>Chave PIX para recebimento de dízimos e ofertas</p>
            </div>

            {msg && <p style={{ fontSize: '13px', color: msg.includes('sucesso') ? '#276749' : '#e53e3e' }}>{msg}</p>}
            <button type="submit" disabled={salvando} className="btn-primary">
              {salvando ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </form>

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

        </div>

        {/* ── COLUNA DIREITA ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

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

          {/* Card: Cultos fixos */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' }}>Cultos fixos da semana</h2>
              <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>Usados para disparo automático de mensagens pós-culto</p>
            </div>

            {cultos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cultos.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8f9fb', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                    <span style={{ fontSize: '13px', color: '#1a1a2e', fontWeight: '500' }}>
                      {['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][c.weekday]} às {String(c.hour).padStart(2,'0')}:{String(c.minute).padStart(2,'0')}
                    </span>
                    <button type="button" onClick={() => removeCulto(c.id)}
                      style={{ background: 'none', border: 'none', color: '#e53e3e', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {addingCulto ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#a0aec0', display: 'block', marginBottom: '4px' }}>Dia</label>
                  <select value={novoCulto.weekday} onChange={e => setNovoCulto(p => ({ ...p, weekday: Number(e.target.value) }))}
                    style={{ borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '7px 10px', fontSize: '13px', outline: 'none' }}>
                    {['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'].map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#a0aec0', display: 'block', marginBottom: '4px' }}>Hora</label>
                  <input type="number" min={0} max={23} value={novoCulto.hour}
                    onChange={e => setNovoCulto(p => ({ ...p, hour: Number(e.target.value) }))}
                    style={{ width: '64px', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '7px 10px', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#a0aec0', display: 'block', marginBottom: '4px' }}>Minuto</label>
                  <input type="number" min={0} max={59} step={5} value={novoCulto.minute}
                    onChange={e => setNovoCulto(p => ({ ...p, minute: Number(e.target.value) }))}
                    style={{ width: '64px', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '7px 10px', fontSize: '13px', outline: 'none' }} />
                </div>
                <button type="button" onClick={addCulto} className="btn-primary" style={{ padding: '8px 16px' }}>Adicionar</button>
                <button type="button" onClick={() => setAddingCulto(false)} className="btn-secondary" style={{ padding: '8px 12px' }}>Cancelar</button>
              </div>
            ) : (
              <button type="button" onClick={() => setAddingCulto(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--primary)', background: 'none', border: '1.5px dashed #cbd5e0', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                + Adicionar culto
              </button>
            )}
          </div>

          {/* Card: Automação de visitantes */}
          <form onSubmit={handleSaveAuto} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' }}>Automação de visitantes</h2>
              <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>Mensagens automáticas via WhatsApp para acompanhamento</p>
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
              <label>Dias sem contato para disparar follow-up</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="number" min={1} max={30} value={auto.triggerDays}
                  onChange={e => setAuto(p => ({ ...p, triggerDays: Number(e.target.value) }))}
                  style={{ width: '80px' }} />
                <span style={{ fontSize: '13px', color: '#718096' }}>dias após o cadastro</span>
              </div>
            </div>

            <div>
              <label>Mensagem de boas-vindas</label>
              <textarea value={auto.message} onChange={e => setAuto(p => ({ ...p, message: e.target.value }))}
                placeholder="Olá [nome]! Foi uma alegria ter você conosco hoje! 😊..."
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '10px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>Enviada automaticamente ~3 min após o cadastro do visitante. Use <strong>[nome]</strong> para personalizar</p>
            </div>

            <div>
              <label>Mensagem de follow-up (após {auto.triggerDays} dias sem contato)</label>
              <textarea value={auto.followUpMessage} onChange={e => setAuto(p => ({ ...p, followUpMessage: e.target.value }))}
                placeholder="Olá [nome]! Sentimos sua falta e gostaríamos de saber como você está. 😊"
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '10px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>Enviada se o visitante não foi contactado. Use <strong>[nome]</strong> para personalizar</p>
            </div>

            <div>
              <label>Resposta automática quando visitante responder</label>
              <textarea value={auto.autoReply} onChange={e => setAuto(p => ({ ...p, autoReply: e.target.value }))}
                placeholder="Que bom ouvir você! 😊 Em breve alguém da nossa equipe entrará em contato."
                rows={2}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '10px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>Enviada automaticamente se o visitante responder (com silêncio &gt; 4h)</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8f9fb', borderRadius: '10px', border: '1px solid #edf2f7' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', margin: 0 }}>Enviar também após eventos</p>
                <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>Dispara mensagem pós-culto para visitantes que confirmaram presença em eventos</p>
              </div>
              <button type="button" onClick={() => setAuto(p => ({ ...p, notifyAfterEvent: !p.notifyAfterEvent }))}
                style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: auto.notifyAfterEvent ? '#38a169' : '#cbd5e0', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: '3px', left: auto.notifyAfterEvent ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>

            {msgAuto && <p style={{ fontSize: '13px', color: msgAuto.includes('sucesso') ? '#276749' : '#e53e3e' }}>{msgAuto}</p>}
            <button type="submit" disabled={salvandoAuto} className="btn-primary">
              {salvandoAuto ? 'Salvando...' : 'Salvar automação'}
            </button>
          </form>

        </div>
      </div>
      {modalNode}
    </div>
  )
}
