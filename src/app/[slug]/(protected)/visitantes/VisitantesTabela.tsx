'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface Visitor {
  id: string
  name: string
  phone: string
  invitedBy: string | null
  visits: number
  lastVisit: string
  createdAt: string
  status: string
  wantsHomeVisit: boolean
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
const STATUS_COLOR: Record<string, string> = { NEW: 'bg-blue-50 text-blue-600', RETURNED: 'bg-green-50 text-green-600', MEMBER: 'bg-purple-50 text-purple-600', INACTIVE: 'bg-gray-100 text-gray-400' }

const COOLDOWN_MS = 5 * 60 * 1000
const MAX_SELECTION = 5
const COOLDOWN_KEY = (slug: string) => `wa_bulk_cooldown_${slug}`

export default function VisitantesTabela({ visitors, slug }: { visitors: Visitor[]; slug: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkMsg, setBulkMsg] = useState('')
  const [bulkTemplateId, setBulkTemplateId] = useState('')
  const [customTemplates, setCustomTemplates] = useState<Template[]>([])
  const [progress, setProgress] = useState<{ sent: number; total: number; done: boolean; errors: string[] } | null>(null)
  const [sending, setSending] = useState(false)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const cooldownRef = useRef<NodeJS.Timeout | null>(null)

  const checkCooldown = useCallback(() => {
    const stored = localStorage.getItem(COOLDOWN_KEY(slug))
    if (!stored) { setCooldownLeft(0); return }
    const until = parseInt(stored)
    const left = until - Date.now()
    if (left > 0) {
      setCooldownLeft(left)
      cooldownRef.current = setInterval(() => {
        const l = until - Date.now()
        if (l <= 0) {
          setCooldownLeft(0)
          localStorage.removeItem(COOLDOWN_KEY(slug))
          if (cooldownRef.current) clearInterval(cooldownRef.current)
        } else {
          setCooldownLeft(l)
        }
      }, 1000)
    } else {
      localStorage.removeItem(COOLDOWN_KEY(slug))
      setCooldownLeft(0)
    }
  }, [slug])

  useEffect(() => {
    checkCooldown()
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [checkCooldown])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); return next }
      if (next.size >= MAX_SELECTION) return prev
      next.add(id)
      return next
    })
  }

  function openBulkModal() {
    setBulkMsg('')
    setBulkTemplateId('')
    setProgress(null)
    fetch(`/api/visitor-templates?slug=${slug}`).then(r => r.json()).then(data => {
      setCustomTemplates(Array.isArray(data) ? data : [])
    })
    setBulkModal(true)
  }

  const selectedVisitors = visitors.filter(v => selected.has(v.id))

  function applyTemplate(tpl: Template) {
    setBulkTemplateId(tpl.id)
    setBulkMsg(tpl.text.replace(/\[nome\]/gi, '{nome}'))
  }

  async function enviarEmMassa() {
    if (!bulkMsg.trim() || selectedVisitors.length === 0) return
    setSending(true)
    const errors: string[] = []
    setProgress({ sent: 0, total: selectedVisitors.length, done: false, errors: [] })

    for (let i = 0; i < selectedVisitors.length; i++) {
      const v = selectedVisitors[i]
      const msg = bulkMsg.replace(/\{nome\}/gi, v.name).replace(/\[nome\]/gi, v.name)
      try {
        const res = await fetch(`/api/visitors/${v.id}/whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
        if (!res.ok) errors.push(v.name)
      } catch {
        errors.push(v.name)
      }
      setProgress({ sent: i + 1, total: selectedVisitors.length, done: i + 1 === selectedVisitors.length, errors: [...errors] })
      if (i < selectedVisitors.length - 1) await new Promise(r => setTimeout(r, 1500))
    }

    const cooldownUntil = Date.now() + COOLDOWN_MS
    localStorage.setItem(COOLDOWN_KEY(slug), String(cooldownUntil))
    setSending(false)
    setSelected(new Set())
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    setCooldownLeft(COOLDOWN_MS)
    cooldownRef.current = setInterval(() => {
      const l = cooldownUntil - Date.now()
      if (l <= 0) {
        setCooldownLeft(0)
        localStorage.removeItem(COOLDOWN_KEY(slug))
        if (cooldownRef.current) clearInterval(cooldownRef.current)
      } else {
        setCooldownLeft(l)
      }
    }, 1000)
  }

  const cooldownMinSec = cooldownLeft > 0
    ? `${Math.floor(cooldownLeft / 60000)}:${String(Math.floor((cooldownLeft % 60000) / 1000)).padStart(2, '0')}`
    : ''

  return (
    <>
      {/* Barra de seleção em massa */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: '#276749', fontWeight: '600' }}>{selected.size} visitante{selected.size > 1 ? 's' : ''} selecionado{selected.size > 1 ? 's' : ''}</span>
          <span style={{ fontSize: '12px', color: '#38a169' }}>máx. {MAX_SELECTION}</span>
          <div style={{ flex: 1 }} />
          {cooldownLeft > 0 ? (
            <span style={{ fontSize: '12px', color: '#a0aec0' }}>Próximo envio em {cooldownMinSec}</span>
          ) : (
            <button
              onClick={openBulkModal}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#25D366', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enviar WhatsApp ({selected.size})
            </button>
          )}
          <button onClick={() => setSelected(new Set())} style={{ fontSize: '12px', color: '#a0aec0', background: 'none', border: 'none', cursor: 'pointer' }}>Limpar</button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <span className="text-sm text-gray-500">{visitors.length} visitantes</span>
          {cooldownLeft > 0 && (
            <span style={{ fontSize: '12px', color: '#a0aec0', marginLeft: 'auto' }}>
              ⏱ Próximo envio em massa: {cooldownMinSec}
            </span>
          )}
        </div>

        {visitors.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm mb-2">Nenhum visitante registrado</p>
            <Link href={`/${slug}/visitantes/novo`} className="text-blue-600 text-sm hover:underline">
              Registrar primeiro visitante
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 w-8" />
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Nome</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Telefone</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Visitas</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Última visita</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Convidado por</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Status</th>
                <th className="text-left text-xs text-gray-400 font-medium px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visitors.map(v => {
                const isSelected = selected.has(v.id)
                const canSelect = v.status === 'NEW' || v.status === 'RETURNED'
                const maxReached = selected.size >= MAX_SELECTION && !isSelected
                return (
                  <tr key={v.id} className={`border-b border-gray-50 hover:bg-gray-50 ${isSelected ? 'bg-green-50' : ''}`}>
                    <td className="px-4 py-3">
                      {canSelect && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={maxReached}
                          onChange={() => toggleSelect(v.id)}
                          style={{ width: '15px', height: '15px', cursor: maxReached ? 'not-allowed' : 'pointer', accentColor: '#25D366' }}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold">
                          {v.name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-900">{v.name}</span>
                        {v.wantsHomeVisit && (
                          <span className="text-xs bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded">Quer visita</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{v.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{v.visits}x</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{new Date(v.lastVisit).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{v.invitedBy || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[v.status]}`}>
                        {STATUS_LABEL[v.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/${slug}/visitantes/${v.id}`} className="text-xs text-blue-600 hover:underline">Ver</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal envio em massa */}
      {bulkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>
                Enviar para {selectedVisitors.length} visitante{selectedVisitors.length > 1 ? 's' : ''}
              </h2>
              {!sending && <button onClick={() => setBulkModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#a0aec0', lineHeight: 1 }}>×</button>}
            </div>

            {/* Destinatários */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {selectedVisitors.map(v => (
                <span key={v.id} style={{ fontSize: '12px', background: '#f0fff4', color: '#276749', padding: '3px 10px', borderRadius: '20px', border: '1px solid #c6f6d5' }}>
                  {v.name}
                </span>
              ))}
            </div>

            {progress ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                {!progress.done ? (
                  <>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#25D366', marginBottom: '8px' }}>{progress.sent}/{progress.total}</div>
                    <p style={{ fontSize: '14px', color: '#4a5568' }}>Enviando mensagens...</p>
                    <div style={{ marginTop: '16px', background: '#edf2f7', borderRadius: '8px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#25D366', width: `${(progress.sent / progress.total) * 100}%`, transition: 'width 0.3s' }} />
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>✓</div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#276749', marginBottom: '6px' }}>Envio concluído!</p>
                    <p style={{ fontSize: '13px', color: '#4a5568' }}>{progress.total - progress.errors.length} enviadas com sucesso</p>
                    {progress.errors.length > 0 && (
                      <p style={{ fontSize: '12px', color: '#e53e3e', marginTop: '4px' }}>Falhas: {progress.errors.join(', ')}</p>
                    )}
                    <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '8px' }}>Próximo envio disponível em 5 minutos</p>
                    <button onClick={() => setBulkModal(false)} className="btn-primary" style={{ marginTop: '16px' }}>Fechar</button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Templates built-in */}
                <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '8px' }}>Mensagens prontas</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: customTemplates.length > 0 ? '12px' : '16px' }}>
                  {BUILTIN_TEMPLATES('{nome}').map(t => (
                    <button key={t.id}
                      onClick={() => applyTemplate(t)}
                      style={{ textAlign: 'left', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: bulkTemplateId === t.id ? '1.5px solid #25D366' : '1.5px solid #e2e8f0', background: bulkTemplateId === t.id ? '#f0fff4' : 'white', color: bulkTemplateId === t.id ? '#276749' : '#4a5568', fontWeight: bulkTemplateId === t.id ? '600' : '400', transition: 'all 0.15s' }}>
                      {t.title}
                    </button>
                  ))}
                </div>

                {/* Templates personalizados */}
                {customTemplates.length > 0 && (
                  <>
                    <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '8px' }}>Meus templates</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '16px' }}>
                      {customTemplates.map(t => (
                        <button key={t.id}
                          onClick={() => applyTemplate(t)}
                          style={{ textAlign: 'left', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: bulkTemplateId === t.id ? '1.5px solid #25D366' : '1.5px solid #e2e8f0', background: bulkTemplateId === t.id ? '#f0fff4' : 'white', color: bulkTemplateId === t.id ? '#276749' : '#4a5568', fontWeight: bulkTemplateId === t.id ? '600' : '400', transition: 'all 0.15s' }}>
                          {t.title}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <label style={{ fontSize: '12px', color: '#a0aec0', display: 'block', marginBottom: '6px' }}>
                  Mensagem <span style={{ color: '#a0aec0' }}>— use {'{nome}'} para personalizar</span>
                </label>
                <textarea
                  value={bulkMsg}
                  onChange={e => { setBulkMsg(e.target.value); setBulkTemplateId('') }}
                  placeholder="Selecione um template ou escreva uma mensagem..."
                  rows={4}
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: '8px', border: '1.5px solid #e2e8f0', padding: '10px 12px', fontSize: '13px', color: '#1a1a2e', outline: 'none', fontFamily: 'inherit' }}
                />
                <p style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }}>{'{nome}'} será substituído pelo nome de cada visitante</p>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button onClick={() => setBulkModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', color: '#4a5568', fontSize: '14px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button
                    onClick={enviarEmMassa}
                    disabled={!bulkMsg.trim()}
                    style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: !bulkMsg.trim() ? '#a0aec0' : '#25D366', color: 'white', fontSize: '14px', fontWeight: '600', cursor: !bulkMsg.trim() ? 'not-allowed' : 'pointer' }}
                  >
                    Enviar para {selectedVisitors.length}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
