'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface MemberProfile {
  id: string
  name: string
  phone: string
  cpfCnpj: string | null
  email: string | null
  group: string | null
  role: string
  church: { name: string; primaryColor: string }
}

export default function MembroPerfilPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [testando, setTestando] = useState(false)
  const [testeMsg, setTesteMsg] = useState('')
  const [reativando, setReativando] = useState(false)
  const [pushStatus, setPushStatus] = useState<'idle'|'ok'|'denied'|'unsupported'>('idle')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    fetch('/api/membro/me')
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setName(data.name ?? '')
        setPhone(data.phone ?? '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const res = await fetch('/api/membro/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    })

    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Erro ao salvar. Tente novamente.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const output = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
    return output
  }

  async function reativarPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported')
      setTesteMsg('Este navegador não suporta push. Abra pelo Safari com o app na tela inicial.')
      return
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    setReativando(true)

    if (!isStandalone) {
      setTesteMsg('⚠️ Não está em modo standalone. Notificações podem não funcionar. Reinstale o app na tela inicial.')
      // Não bloqueia — tenta mesmo assim para diagnóstico
    }
    setTesteMsg('')

    try {
      // 1. Permissão
      const perm = await Notification.requestPermission()
      if (perm === 'denied') {
        setPushStatus('denied')
        setTesteMsg('Notificações bloqueadas. Vá em Ajustes → Apps → Safari → Notificações e permita.')
        setReativando(false)
        return
      }

      // 2. Registrar SW explicitamente com timeout de 8s
      let reg: ServiceWorkerRegistration
      try {
        reg = await Promise.race([
          (async () => {
            const existing = await navigator.serviceWorker.getRegistration('/sw.js')
            if (existing) return existing
            return navigator.serviceWorker.register('/sw.js')
          })(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('sw-timeout')), 8000)
          ),
        ])
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : ''
        if (msg === 'sw-timeout') {
          setTesteMsg('Service worker não respondeu. Remova e reinstale o app na tela inicial.')
        } else {
          setTesteMsg(`Erro no service worker: ${msg || 'desconhecido'}`)
        }
        setReativando(false)
        return
      }

      // 3. Aguardar SW ativo com timeout
      try {
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('ready-timeout')), 8000)
          ),
        ])
      } catch {
        setTesteMsg('SW registrado mas não ativou. Feche e abra o app novamente.')
        setReativando(false)
        return
      }

      // 4. Subscription
      const existing = await reg.pushManager.getSubscription()
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      // 5. Salvar no servidor
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, subscription: sub.toJSON(), memberId: profile?.id }),
      })

      if (res.ok) {
        setPushStatus('ok')
        setTesteMsg('✓ Registrado! Agora clique em "Enviar notificação de teste".')
      } else {
        setTesteMsg('Subscription criada mas erro ao salvar no servidor.')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setTesteMsg(`Erro: ${msg}`)
    }

    setReativando(false)
  }

  async function testarPush() {
    setTestando(true)
    setTesteMsg('')
    const res = await fetch('/api/membro/push-test', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setTesteMsg(`✓ Enviado! (${data.sent} dispositivo${data.sent !== 1 ? 's' : ''})`)
    } else {
      setTesteMsg(data.error || 'Erro ao enviar. Verifique se as notificações estão ativas.')
    }
    setTestando(false)
    setTimeout(() => setTesteMsg(''), 6000)
  }

  const color = profile?.church?.primaryColor || '#3b82f6'
  const initials = name ? name.trim()[0]?.toUpperCase() : '?'

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        Carregando...
      </div>
    )
  }

  const roleLabel: Record<string, string> = {
    PASTOR: 'Pastor',
    ADMIN: 'Administrador',
    LEADER: 'Líder',
    MEMBER: 'Membro',
  }

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Cabeçalho */}
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Meu Perfil</h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Edite seus dados pessoais</p>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: color, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: 'white',
        }}>
          {initials}
        </div>
        {profile?.group && (
          <span style={{
            fontSize: '12px', fontWeight: '600', padding: '3px 12px', borderRadius: '20px',
            background: `${color}15`, color: color,
          }}>
            {profile.group}
          </span>
        )}
        {profile?.role && (
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {roleLabel[profile.role] || profile.role}
          </span>
        )}
      </div>

      {/* Formulário */}
      <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Nome */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Nome completo</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Seu nome"
            style={inputStyle}
          />
        </div>

        {/* Telefone */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Telefone / WhatsApp</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            placeholder="(00) 00000-0000"
            style={inputStyle}
          />
        </div>

        {/* CPF — bloqueado */}
        <div style={fieldWrap}>
          <label style={labelStyle}>
            CPF
            <span style={{
              marginLeft: '8px', fontSize: '10px', fontWeight: '600',
              padding: '2px 6px', borderRadius: '4px',
              background: '#f1f5f9', color: '#94a3b8',
            }}>
              bloqueado
            </span>
          </label>
          <input
            type="text"
            value={profile?.cpfCnpj || '—'}
            disabled
            style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
          />
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#cbd5e1' }}>
            Para alterar o CPF, fale com o gestor da igreja.
          </p>
        </div>

        {/* Igreja */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Igreja</label>
          <input
            type="text"
            value={profile?.church?.name || ''}
            disabled
            style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
          />
        </div>

        {/* Feedback */}
        {error && (
          <div style={{
            padding: '12px 14px', borderRadius: '10px',
            background: '#fee2e2', color: '#dc2626', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {saved && (
          <div style={{
            padding: '12px 14px', borderRadius: '10px',
            background: '#dcfce7', color: '#16a34a', fontSize: '13px', fontWeight: '600',
          }}>
            ✓ Dados salvos com sucesso!
          </div>
        )}

        {/* Botão salvar */}
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '14px', borderRadius: '12px', border: 'none',
            background: saving ? '#93c5fd' : color,
            color: 'white', fontSize: '15px', fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            marginTop: '4px',
          }}
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>

      {/* Seção de notificações */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '16px',
        border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
            🔔 Notificações push
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            Seu dispositivo precisa estar registrado para receber avisos.
          </p>
        </div>

        {pushStatus === 'denied' && (
          <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#fff7ed', color: '#c2410c', fontSize: '12px' }}>
            ⚠️ Notificações bloqueadas. Vá em <strong>Ajustes → Safari → Notificações</strong> e permita este site.
          </div>
        )}
        {pushStatus === 'unsupported' && (
          <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#f1f5f9', color: '#64748b', fontSize: '12px' }}>
            Este navegador não suporta notificações push. Use o Safari com o app instalado na tela inicial.
          </div>
        )}

        {testeMsg && (
          <div style={{
            padding: '10px 12px', borderRadius: '10px',
            background: testeMsg.startsWith('✓') ? '#dcfce7' : '#fee2e2',
            color: testeMsg.startsWith('✓') ? '#16a34a' : '#dc2626',
            fontSize: '13px', fontWeight: '600',
          }}>
            {testeMsg}
          </div>
        )}

        {/* Botão reativar — principal */}
        <button
          type="button"
          onClick={reativarPush}
          disabled={reativando}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: pushStatus === 'ok' ? '#dcfce7' : '#3b82f6',
            color: pushStatus === 'ok' ? '#16a34a' : 'white',
            fontSize: '14px', fontWeight: '600',
            cursor: reativando ? 'not-allowed' : 'pointer',
            opacity: reativando ? 0.6 : 1,
          }}
        >
          {reativando ? 'Registrando...' : pushStatus === 'ok' ? '✓ Registrado com sucesso' : '🔔 Ativar / Reativar notificações'}
        </button>

        {/* Botão de teste — secundário */}
        <button
          type="button"
          onClick={testarPush}
          disabled={testando}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px',
            border: '1.5px solid #e2e8f0', background: 'white',
            color: '#64748b', fontSize: '13px', fontWeight: '600',
            cursor: testando ? 'not-allowed' : 'pointer',
            opacity: testando ? 0.6 : 1,
          }}
        >
          {testando ? 'Enviando...' : '📨 Enviar notificação de teste'}
        </button>
      </div>
    </div>
  )
}

const fieldWrap: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '6px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: '600', color: '#64748b',
  display: 'flex', alignItems: 'center',
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px', borderRadius: '10px',
  border: '1.5px solid #e2e8f0', background: 'white',
  fontSize: '15px', color: '#1e293b',
  outline: 'none', width: '100%', boxSizing: 'border-box',
}
