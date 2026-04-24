'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

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
  const router = useRouter()
  const slug = params?.slug as string

  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

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

      {/* Sair */}
      <button
        onClick={async () => {
          await fetch('/api/membro/auth/logout', { method: 'POST' })
          localStorage.removeItem(`membro_cpf_${slug}`)
          router.push(`/${slug}/membro/login`)
        }}
        style={{
          width: '100%', padding: '14px', borderRadius: '12px',
          border: '1.5px solid #e2e8f0', background: 'white',
          color: '#94a3b8', fontSize: '15px', fontWeight: '500',
          cursor: 'pointer', marginTop: '8px',
        }}
      >
        Sair da conta
      </button>

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
  fontSize: '16px', color: '#1e293b',
  outline: 'none', width: '100%', boxSizing: 'border-box',
}
