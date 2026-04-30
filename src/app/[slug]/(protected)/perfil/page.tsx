'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'

export default function PerfilPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [msgSenha, setMsgSenha] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [form, setForm] = useState({
    name: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    logoUrl: '',
  })

  const [senha, setSenha] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/church?slug=${slug}`)
      .then(r => r.json())
      .then(church => {
        setForm({
          name: church.name || '',
          primaryColor: church.primaryColor || '#2563eb',
          secondaryColor: church.secondaryColor || '#1e40af',
          logoUrl: church.logoUrl || '',
        })
        setLoading(false)
      })
  }, [slug])

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
      setMsg('Salvo com sucesso!')
      setTimeout(() => setMsg(''), 3000)
    } else {
      setMsg('Erro ao salvar.')
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
    <div><div className="page-header"><span style={{ color: '#a0aec0', fontSize: '14px' }}>Carregando...</span></div></div>
  )

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>Meu Perfil</h1>
      </div>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── Identidade Visual ── */}
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                {form.logoUrl
                  ? <img src={form.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : form.name.charAt(0)}
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
                {form.logoUrl
                  ? <img src={form.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : form.name.charAt(0)}
              </div>
              <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{form.name || 'Nome da Igreja'}</span>
            </div>
          </div>

          {msg && <p style={{ fontSize: '13px', color: msg.includes('sucesso') || msg.includes('Salvo') ? '#276749' : '#e53e3e' }}>{msg}</p>}
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando...' : 'Salvar identidade'}
          </button>
        </form>

        {/* ── Alterar Senha ── */}
        <form onSubmit={handleSenha} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' }}>Alterar senha</h2>
            <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>Segurança da sua conta de acesso</p>
          </div>
          <div>
            <label>Senha atual</label>
            <input type="password" value={senha.currentPassword}
              onChange={e => setSenha(p => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••" />
          </div>
          <div>
            <label>Nova senha</label>
            <input type="password" value={senha.newPassword}
              onChange={e => setSenha(p => ({ ...p, newPassword: e.target.value }))}
              placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label>Confirmar nova senha</label>
            <input type="password" value={senha.confirmPassword}
              onChange={e => setSenha(p => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Repita a nova senha" />
          </div>
          {msgSenha && <p style={{ fontSize: '13px', color: msgSenha.includes('sucesso') ? '#276749' : '#e53e3e' }}>{msgSenha}</p>}
          <button type="submit" disabled={salvandoSenha} className="btn-primary">
            {salvandoSenha ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>

      </div>
    </div>
  )
}
