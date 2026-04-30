'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useModal } from '@/lib/useModal'

interface Contact {
  id: string
  message: string
  sentAt: string
  type: string
  direction: string
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
  temperature: 'COLD' | 'WARM' | 'HOT'
  flowActive: boolean
  notes: string | null
  createdAt: string
  contacts: Contact[]
}

interface Template {
  id: string
  title: string
  text: string
}

const BUILTIN_TEMPLATES = (name: string): Template[] => [
  { id: 'boas_vindas', title: 'Boas-vindas', text: `Olá ${name}! 😊 Foi uma alegria ter você conosco! Esperamos que tenha se sentido em casa. Ficamos no aguardo do seu retorno. Que Deus abençoe você e sua família!` },
  { id: 'retorno', title: 'Convite de retorno', text: `Olá ${name}! Sentimos sua falta por aqui. 🙏 Gostaríamos de te convidar para estar conosco novamente no culto. Será uma alegria revê-lo(a)!` },
  { id: 'visita_pastoral', title: 'Visita pastoral', text: `Olá ${name}! Gostaríamos de visitar você esta semana para um momento de oração e conversa. Qual seria um bom dia e horário para você?` },
  { id: 'evento', title: 'Convite para evento', text: `Olá ${name}! Temos um evento especial chegando e gostaríamos muito de contar com a sua presença! Fique atento(a) às nossas redes para mais informações. 🎉` },
]

const STATUS_LABEL: Record<string, string> = { NEW: 'Novo', RETURNED: 'Retornou', MEMBER: 'Virou membro', INACTIVE: 'Inativo' }
const STATUS_STYLE: Record<string, string> = { NEW: 'bg-blue-50 text-blue-600 border-blue-200', RETURNED: 'bg-green-50 text-green-600 border-green-200', MEMBER: 'bg-purple-50 text-purple-600 border-purple-200', INACTIVE: 'bg-gray-100 text-gray-400 border-gray-200' }
const HOW_FOUND_LABEL: Record<string, string> = { convite: 'Convite de membro', redes_sociais: 'Redes sociais', passou_na_frente: 'Passou na frente', familia: 'Família', outro: 'Outro' }

export default function VisitantePerfilPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const id = params?.id as string
  const { confirm, modalNode } = useModal()

  const [visitor, setVisitor] = useState<Visitor | null>(null)
  const [editando, setEditando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [waModal, setWaModal] = useState(false)
  const [waMsg, setWaMsg] = useState('')
  const [waTemplateId, setWaTemplateId] = useState('')
  const [waSending, setWaSending] = useState(false)
  const [waFeedback, setWaFeedback] = useState('')

  // Custom templates
  const [customTemplates, setCustomTemplates] = useState<Template[]>([])
  const [loadingTpl, setLoadingTpl] = useState(false)
  const [showNewTpl, setShowNewTpl] = useState(false)
  const [newTplTitle, setNewTplTitle] = useState('')
  const [newTplText, setNewTplText] = useState('')
  const [savingTpl, setSavingTpl] = useState(false)
  const [tplError, setTplError] = useState('')

  const [form, setForm] = useState({ name: '', phone: '', invitedBy: '', howFound: '', wantsHomeVisit: false, notes: '' })
  const [savingNotes, setSavingNotes] = useState(false)
  const notesTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Resposta inline na conversa
  const [replyMsg, setReplyMsg] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [replyError, setReplyError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(() => {
    fetch(`/api/visitors/${id}`)
      .then(r => r.json())
      .then((v: Visitor) => {
        setVisitor(v)
        const d = (v.phone||'').replace(/\D/g,'').slice(0,11); const pf = d.length>7?`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`:d.length>2?`(${d.slice(0,2)}) ${d.slice(2)}`:d
        setForm({ name: v.name, phone: pf, invitedBy: v.invitedBy || '', howFound: v.howFound || '', wantsHomeVisit: v.wantsHomeVisit, notes: v.notes || '' })
      })
  }, [id])

  useEffect(() => { load() }, [load])

  async function loadCustomTemplates() {
    setLoadingTpl(true)
    const res = await fetch(`/api/visitor-templates?slug=${slug}`)
    const data = await res.json()
    setCustomTemplates(Array.isArray(data) ? data : [])
    setLoadingTpl(false)
  }

  function openWaModal() {
    setWaModal(true)
    setWaMsg('')
    setWaTemplateId('')
    setWaFeedback('')
    setShowNewTpl(false)
    setNewTplTitle('')
    setNewTplText('')
    setTplError('')
    loadCustomTemplates()
  }

  function applyTemplate(tpl: Template, text: string) {
    setWaTemplateId(tpl.id)
    setWaMsg(text)
  }

  async function saveNewTemplate() {
    if (!newTplTitle.trim() || !newTplText.trim()) return
    setSavingTpl(true)
    setTplError('')
    const res = await fetch('/api/visitor-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, title: newTplTitle.trim(), text: newTplText.trim() }),
    })
    const data = await res.json()
    setSavingTpl(false)
    if (res.ok) {
      setCustomTemplates(prev => [...prev, data])
      setNewTplTitle('')
      setNewTplText('')
      setShowNewTpl(false)
    } else {
      setTplError(data.error || 'Erro ao salvar template.')
    }
  }

  async function deleteTemplate(tplId: string) {
    const res = await fetch('/api/visitor-templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tplId }),
    })
    if (res.ok) {
      setCustomTemplates(prev => prev.filter(t => t.id !== tplId))
      if (waTemplateId === tplId) { setWaTemplateId(''); setWaMsg('') }
    }
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/visitors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, phone: form.phone.replace(/\D/g, '') }) })
    if (res.ok) { const updated = await res.json(); setVisitor(v => v ? { ...v, ...updated } : v); setEditando(false) }
    setSaving(false)
  }

  async function mudarStatus(status: string) {
    const res = await fetch(`/api/visitors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) setVisitor(v => v ? { ...v, status: status as Visitor['status'] } : v)
  }

  function handleNotesChange(value: string) {
    setForm(p => ({ ...p, notes: value }))
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(async () => {
      setSavingNotes(true)
      await fetch(`/api/visitors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: value }) })
      setSavingNotes(false)
    }, 1000)
  }

  async function toggleFlowActive() {
    const next = !visitor!.flowActive
    const res = await fetch(`/api/visitors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flowActive: next }) })
    if (res.ok) setVisitor(v => v ? { ...v, flowActive: next } : v)
  }

  async function enviarWhatsApp() {
    if (!waMsg.trim()) return
    setWaSending(true)
    setWaFeedback('')
    const res = await fetch(`/api/visitors/${id}/whatsapp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: waMsg }) })
    const data = await res.json()
    setWaSending(false)
    if (res.ok) {
      setWaFeedback('✓ Mensagem enviada!')
      setWaMsg('')
      setTimeout(() => { setWaModal(false); setWaFeedback(''); load() }, 1500)
    } else {
      setWaFeedback(data.error || 'Erro ao enviar.')
    }
  }

  async function enviarResposta(e: React.FormEvent) {
    e.preventDefault()
    if (!replyMsg.trim() || replySending) return
    setReplySending(true)
    setReplyError('')
    const res = await fetch(`/api/visitors/${id}/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: replyMsg.trim() }),
    })
    const data = await res.json()
    setReplySending(false)
    if (res.ok) {
      setReplyMsg('')
      load()
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
    } else {
      setReplyError(data.error || 'Erro ao enviar mensagem.')
    }
  }

  async function registrarVisita() {
    if (!await confirm('Registrar nova visita hoje?', { title: 'Registrar visita', confirmText: 'Registrar' })) return
    const res = await fetch(`/api/visitors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ registerVisit: true }) })
    if (res.ok) { const updated = await res.json(); setVisitor(v => v ? { ...v, ...updated } : v) }
  }

  async function apagarVisitante() {
    setDeleting(true)
    const res = await fetch(`/api/visitors/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push(`/${slug}/visitantes`)
    } else {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (!visitor) {
    return <div><div className="page-header"><span style={{ color: '#a0aec0', fontSize: '14px' }}>Carregando...</span></div></div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLE[visitor.status]}`}>{STATUS_LABEL[visitor.status]}</span>
          {visitor.temperature === 'HOT' && <span style={{ fontSize: '11px', background: '#fff7ed', color: '#ea580c', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>🔥 Quente</span>}
          {visitor.temperature === 'WARM' && <span style={{ fontSize: '11px', background: '#fefce8', color: '#ca8a04', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>😊 Morno</span>}
          {visitor.temperature === 'COLD' && <span style={{ fontSize: '11px', background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>❄️ Frio</span>}
          <button
            onClick={openWaModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#25D366', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ padding: '6px 14px', borderRadius: '8px', border: '1.5px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            Apagar
          </button>
        </div>
      </div>

      {/* Modal confirmação de exclusão */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '10px' }}>Apagar visitante?</h2>
            <p style={{ fontSize: '14px', color: '#718096', marginBottom: '24px', lineHeight: 1.5 }}>
              Todos os dados de <strong>{visitor.name}</strong> e o histórico de mensagens serão apagados permanentemente. Essa ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', color: '#4a5568', fontSize: '14px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={apagarVisitante}
                disabled={deleting}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontSize: '14px', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Apagando...' : 'Sim, apagar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal WhatsApp */}
      {waModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '500px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>Enviar mensagem para {visitor.name}</h2>
              <button onClick={() => setWaModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#a0aec0', lineHeight: 1 }}>×</button>
            </div>

            {/* Built-in templates */}
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '8px' }}>Mensagens prontas</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
              {BUILTIN_TEMPLATES(visitor.name).map(t => (
                <button key={t.id}
                  onClick={() => applyTemplate(t, t.text)}
                  style={{ textAlign: 'left', padding: '9px 13px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: waTemplateId === t.id ? '1.5px solid #25D366' : '1.5px solid #e2e8f0', background: waTemplateId === t.id ? '#f0fff4' : 'white', color: waTemplateId === t.id ? '#276749' : '#4a5568', fontWeight: waTemplateId === t.id ? '600' : '400', transition: 'all 0.15s' }}>
                  {t.title}
                </button>
              ))}
            </div>

            {/* Custom templates */}
            <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ fontSize: '12px', color: '#a0aec0', margin: 0 }}>
                  Meus templates {loadingTpl ? '...' : `(${customTemplates.length}/5)`}
                </p>
                {customTemplates.length < 5 && !showNewTpl && (
                  <button
                    onClick={() => setShowNewTpl(true)}
                    style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                    + Novo template
                  </button>
                )}
              </div>

              {customTemplates.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: showNewTpl ? '12px' : '0' }}>
                  {customTemplates.map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => applyTemplate(t, t.text)}
                        style={{ flex: 1, textAlign: 'left', padding: '9px 13px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: waTemplateId === t.id ? '1.5px solid #25D366' : '1.5px solid #e2e8f0', background: waTemplateId === t.id ? '#f0fff4' : 'white', color: waTemplateId === t.id ? '#276749' : '#4a5568', fontWeight: waTemplateId === t.id ? '600' : '400', transition: 'all 0.15s' }}>
                        {t.title}
                      </button>
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: 'none', background: '#fff5f5', color: '#e53e3e', fontSize: '14px', cursor: 'pointer', flexShrink: 0 }}
                        title="Excluir template">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {customTemplates.length === 0 && !loadingTpl && !showNewTpl && (
                <p style={{ fontSize: '12px', color: '#cbd5e0', marginBottom: '4px' }}>Nenhum template criado ainda.</p>
              )}

              {/* Form novo template */}
              {showNewTpl && (
                <div style={{ background: '#f8f9fb', borderRadius: '10px', padding: '12px', border: '1px solid #edf2f7', marginTop: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>Criar template</p>
                  <input
                    value={newTplTitle}
                    onChange={e => setNewTplTitle(e.target.value)}
                    placeholder="Título (ex: Pós-culto)"
                    style={{ width: '100%', boxSizing: 'border-box', borderRadius: '7px', border: '1.5px solid #e2e8f0', padding: '8px 10px', fontSize: '13px', marginBottom: '8px', outline: 'none', fontFamily: 'inherit' }}
                  />
                  <textarea
                    value={newTplText}
                    onChange={e => setNewTplText(e.target.value)}
                    placeholder="Texto da mensagem... use [nome] para personalizar"
                    rows={3}
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: '7px', border: '1.5px solid #e2e8f0', padding: '8px 10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                  />
                  {tplError && <p style={{ fontSize: '12px', color: '#e53e3e', marginTop: '4px' }}>{tplError}</p>}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button onClick={() => { setShowNewTpl(false); setTplError('') }} style={{ flex: 1, padding: '7px', borderRadius: '7px', border: '1px solid #e2e8f0', background: 'white', color: '#4a5568', fontSize: '12px', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button onClick={saveNewTemplate} disabled={savingTpl || !newTplTitle.trim() || !newTplText.trim()} style={{ flex: 2, padding: '7px', borderRadius: '7px', border: 'none', background: 'var(--primary)', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      {savingTpl ? 'Salvando...' : 'Salvar template'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Message area */}
            <label style={{ fontSize: '12px', color: '#a0aec0', display: 'block', marginBottom: '6px' }}>Mensagem</label>
            <textarea
              value={waMsg}
              onChange={e => { setWaMsg(e.target.value); setWaTemplateId('') }}
              placeholder="Selecione um template ou escreva uma mensagem personalizada..."
              rows={5}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '10px 12px', fontSize: '13px', color: '#1a1a2e', outline: 'none', fontFamily: 'inherit' }}
            />

            {waFeedback && (
              <p style={{ fontSize: '13px', marginTop: '8px', color: waFeedback.startsWith('✓') ? '#276749' : '#e53e3e' }}>{waFeedback}</p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setWaModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', color: '#4a5568', fontSize: '14px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={enviarWhatsApp}
                disabled={waSending || !waMsg.trim()}
                style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: !waMsg.trim() ? '#a0aec0' : '#25D366', color: 'white', fontSize: '14px', fontWeight: '600', cursor: !waMsg.trim() ? 'not-allowed' : 'pointer' }}>
                {waSending ? 'Enviando...' : 'Enviar via WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Dados + edição */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e' }}>Dados do visitante</span>
            {!editando && <button onClick={() => setEditando(true)} style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Editar</button>}
          </div>

          {editando ? (
            <form onSubmit={salvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label>Nome</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
              <div><label>WhatsApp</label><input value={form.phone} inputMode="numeric" onChange={e => { const d = e.target.value.replace(/\D/g,'').slice(0,11); let f=d; if(d.length>2)f=`(${d.slice(0,2)}) ${d.slice(2)}`; if(d.length>7)f=`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`; setForm(p=>({...p,phone:f})) }} required /></div>
              <div><label>Convidado por</label><input value={form.invitedBy} onChange={e => setForm(p => ({ ...p, invitedBy: e.target.value }))} placeholder="Nome do membro" /></div>
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
                <input type="checkbox" id="wantsHomeVisit" checked={form.wantsHomeVisit} onChange={e => setForm(p => ({ ...p, wantsHomeVisit: e.target.checked }))} style={{ width: '16px', padding: '0' }} />
                <label htmlFor="wantsHomeVisit" style={{ marginBottom: 0 }}>Quer visita em casa</label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="button" onClick={() => setEditando(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, textAlign: 'center' }}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Row label="Telefone">
                <a href={`https://wa.me/55${visitor.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#38a169', textDecoration: 'none', fontSize: '14px' }}>
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

        {/* Anotações pastorais */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e' }}>Anotações pastorais</span>
            {savingNotes && <span style={{ fontSize: '11px', color: '#a0aec0' }}>Salvando...</span>}
            {!savingNotes && form.notes && <span style={{ fontSize: '11px', color: '#38a169' }}>✓ Salvo</span>}
          </div>
          <textarea
            value={form.notes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Observações sobre a família, pedidos de oração, contexto pastoral..."
            rows={4}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '10px 12px', fontSize: '13px', color: '#1a1a2e', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          <p style={{ fontSize: '11px', color: '#a0aec0', marginTop: '6px' }}>Salvo automaticamente</p>
        </div>

        {/* Visitas */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#a0aec0', marginBottom: '4px' }}>Visitas registradas</p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a2e', lineHeight: 1 }}>{visitor.visits}x</p>
            <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>Última: {new Date(visitor.lastVisit).toLocaleDateString('pt-BR')}</p>
          </div>
          <button onClick={registrarVisita} className="btn-primary">+ Registrar nova visita</button>
        </div>

        {/* Status */}
        <div className="card">
          <p style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e', marginBottom: '12px' }}>Status do acompanhamento</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(['NEW', 'RETURNED', 'MEMBER', 'INACTIVE'] as const).map(s => (
              <button key={s} onClick={() => mudarStatus(s)}
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', border: visitor.status === s ? '1.5px solid var(--primary)' : '1.5px solid #e2e8f0', background: visitor.status === s ? 'var(--primary-light)' : 'white', color: visitor.status === s ? 'var(--primary)' : '#718096', fontWeight: visitor.status === s ? '600' : '400' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #edf2f7' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', margin: 0 }}>Automação de mensagens</p>
              <p style={{ fontSize: '12px', color: '#a0aec0', margin: '2px 0 0' }}>
                {visitor.flowActive ? 'Mensagens automáticas ativas para este visitante' : 'Automação pausada para este visitante'}
              </p>
            </div>
            <button
              onClick={toggleFlowActive}
              style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: visitor.flowActive ? '#38a169' : '#cbd5e0', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <span style={{ position: 'absolute', top: '3px', left: visitor.flowActive ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        </div>

        {/* Histórico de contatos + resposta inline */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Cabeçalho */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e', margin: 0 }}>Conversa</p>
            <span style={{ fontSize: '11px', color: '#a0aec0' }}>via WhatsApp</span>
          </div>

          {/* Mensagens */}
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '80px', background: '#fafbfc' }}>
            {visitor.contacts.length === 0 && (
              <p style={{ fontSize: '13px', color: '#cbd5e0', textAlign: 'center', margin: '16px 0' }}>
                Nenhuma mensagem ainda. Inicie a conversa abaixo.
              </p>
            )}
            {[...visitor.contacts].reverse().map(c => {
              const isReceived = c.direction === 'RECEIVED'
              return (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isReceived ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px',
                    borderRadius: isReceived ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                    background: isReceived ? '#f1f5f9' : '#dcfce7',
                    border: `1px solid ${isReceived ? '#e2e8f0' : '#bbf7d0'}`,
                  }}>
                    <p style={{ fontSize: '13px', color: '#1a1a2e', margin: 0, lineHeight: 1.5 }}>{c.message}</p>
                  </div>
                  <p style={{ fontSize: '11px', color: '#a0aec0', margin: '3px 4px 0' }}>
                    {isReceived ? `${visitor.name} · ` : ''}
                    {new Date(c.sentAt).toLocaleDateString('pt-BR')} {new Date(c.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {!isReceived && c.type === 'auto_whatsapp' ? ' · Automação' : ''}
                  </p>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Caixa de resposta */}
          <form onSubmit={enviarResposta} style={{ borderTop: '1px solid #edf2f7', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-end', background: 'white' }}>
            <textarea
              ref={replyRef}
              value={replyMsg}
              onChange={e => {
                setReplyMsg(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarResposta(e as any) }
              }}
              placeholder="Responder... (Enter para enviar, Shift+Enter para nova linha)"
              rows={1}
              style={{
                flex: 1, resize: 'none', border: '1.5px solid #e2e8f0', borderRadius: '12px',
                padding: '10px 14px', fontSize: '13px', outline: 'none', fontFamily: 'inherit',
                lineHeight: '1.4', overflow: 'hidden', minHeight: '40px',
              }}
            />
            <button type="submit" disabled={replySending || !replyMsg.trim()}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', border: 'none', flexShrink: 0,
                background: !replyMsg.trim() ? '#e2e8f0' : '#25D366',
                color: !replyMsg.trim() ? '#a0aec0' : 'white',
                cursor: !replyMsg.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}>
              {replySending
                ? <span style={{ fontSize: '10px' }}>...</span>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              }
            </button>
          </form>
          {replyError && (
            <p style={{ fontSize: '12px', color: '#e53e3e', padding: '0 16px 10px', margin: 0 }}>{replyError}</p>
          )}
        </div>
      </div>
      {modalNode}
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
