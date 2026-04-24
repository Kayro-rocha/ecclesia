'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface TitherRow {
  memberId: string
  name: string
  suggestedTithe: number | null
  tithe: { id: string; amount: number; paidAt: string } | null
}

interface Template {
  id: string
  title: string
  body: string
}

interface Props {
  slug: string
  initialMonth: number
  initialYear: number
}

export default function DizimoClient({ slug, initialMonth, initialYear }: Props) {
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear] = useState(initialYear)
  const [rows, setRows] = useState<TitherRow[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  // Modal: marcar como pago
  const [payModal, setPayModal] = useState<TitherRow | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payLoading, setPayLoading] = useState(false)

  // Modal: lembrete
  const [reminderTarget, setReminderTarget] = useState<{ memberId?: string; label: string } | null>(null)
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderBody, setReminderBody] = useState('')
  const [reminderLoading, setReminderLoading] = useState(false)
  const [reminderMsg, setReminderMsg] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/tithes/list?slug=${slug}&month=${month}&year=${year}`)
    const data = await res.json()
    setRows(data.rows ?? [])
    setTemplates(data.templates ?? [])
    setLoading(false)
  }, [slug, month, year])

  useEffect(() => { fetchData() }, [fetchData])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const openPayModal = (row: TitherRow) => {
    setPayModal(row)
    setPayAmount(row.suggestedTithe?.toString() || '')
  }

  const markPaid = async () => {
    if (!payModal || !payAmount) return
    setPayLoading(true)
    await fetch('/api/tithes/mark-paid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, memberId: payModal.memberId, amount: parseFloat(payAmount), month, year }),
    })
    setPayLoading(false)
    setPayModal(null)
    fetchData()
  }

  const unmark = async (titheId: string) => {
    await fetch('/api/tithes/unmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, titheId }),
    })
    fetchData()
  }

  const openReminderSingle = (row: TitherRow) => {
    setReminderTarget({ memberId: row.memberId, label: row.name })
    setReminderTitle('')
    setReminderBody('')
    setReminderMsg('')
  }

  const openReminderAll = () => {
    const pendingCount = rows.filter((r) => !r.tithe).length
    setReminderTarget({ label: `todos os pendentes (${pendingCount})` })
    setReminderTitle('')
    setReminderBody('')
    setReminderMsg('')
  }

  const sendReminder = async () => {
    setReminderLoading(true)
    setReminderMsg('')
    const res = await fetch('/api/tithes/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug, month, year,
        memberId: reminderTarget?.memberId ?? undefined,
        title: reminderTitle,
        message: reminderBody,
      }),
    })
    const data = await res.json()
    setReminderLoading(false)
    setReminderMsg(
      data.sent === 0
        ? 'Nenhum dispositivo encontrado para envio.'
        : `Enviado para ${data.sent} dispositivo${data.sent !== 1 ? 's' : ''}.`
    )
  }

  const applyTemplate = (t: Template) => {
    setReminderTitle(t.title)
    setReminderBody(t.body)
  }

  const saveAsTemplate = async () => {
    if (!reminderTitle || !reminderBody) return
    await fetch('/api/tithes/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, title: reminderTitle, body: reminderBody }),
    })
    fetchData()
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Excluir este template?')) return
    await fetch(`/api/tithes/templates/${id}?slug=${slug}`, { method: 'DELETE' })
    fetchData()
  }

  const paid = rows.filter((r) => r.tithe)
  const pending = rows.filter((r) => !r.tithe)
  const totalArrecadado = paid.reduce((acc, r) => acc + (r.tithe?.amount ?? 0), 0)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/dashboard`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Painel</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Dízimo</span>
        </div>
      </div>

      <div className="page-content">
        {/* Navegação de mês */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', background: '#f7fafc', borderRadius: '8px', padding: '4px 8px', width: 'fit-content' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '18px', padding: '2px 6px', lineHeight: 1 }}>‹</button>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', minWidth: '140px', textAlign: 'center' }}>
            {MONTHS[month - 1]} {year}
          </span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '18px', padding: '2px 6px', lineHeight: 1 }}>›</button>
        </div>

        {/* Cards resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="card">
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '6px' }}>Total arrecadado</p>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a2e' }}>{fmt(totalArrecadado)}</p>
          </div>
          <div className="card">
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '6px' }}>Pagos</p>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#276749' }}>{paid.length}</p>
          </div>
          <div className="card">
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '6px' }}>Pendentes</p>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#744210' }}>{pending.length}</p>
          </div>
        </div>

        {/* Tabela */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>
              {rows.length} dizimante{rows.length !== 1 ? 's' : ''}
            </span>
            {pending.length > 0 && (
              <button className="btn-secondary" onClick={openReminderAll}>
                Lembrar pendentes ({pending.length})
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ color: '#a0aec0' }}>Carregando...</p>
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '8px' }}>Nenhum dizimante cadastrado</p>
              <p style={{ color: '#cbd5e0', fontSize: '13px' }}>
                Adicione membros e marque a opção &quot;É dizimista&quot; no cadastro
              </p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Membro</th>
                  <th>Valor fixo</th>
                  <th>Pago em</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.memberId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'var(--primary-light)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: 'var(--primary)', fontSize: '13px', fontWeight: '600', flexShrink: 0,
                        }}>
                          {row.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: '500' }}>{row.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#718096' }}>
                      {row.suggestedTithe ? fmt(row.suggestedTithe) : <span style={{ color: '#cbd5e0' }}>—</span>}
                    </td>
                    <td style={{ color: '#a0aec0' }}>
                      {row.tithe ? new Date(row.tithe.paidAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      {row.tithe
                        ? <span className="badge-green">Pago {fmt(row.tithe.amount)}</span>
                        : <span className="badge-yellow">Pendente</span>
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {row.tithe ? (
                          <button
                            onClick={() => unmark(row.tithe!.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: '13px' }}
                          >
                            Desmarcar
                          </button>
                        ) : (
                          <button onClick={() => openPayModal(row)} className="btn-primary" style={{ fontSize: '12px', padding: '5px 12px' }}>
                            Marcar como pago
                          </button>
                        )}
                        <button
                          onClick={() => openReminderSingle(row)}
                          title="Enviar lembrete"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '16px', padding: '2px 4px' }}
                        >
                          🔔
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: MARCAR COMO PAGO */}
      {payModal && (
        <Modal title="Registrar pagamento" onClose={() => setPayModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#718096', fontSize: '14px' }}>
              {payModal.name} — {MONTHS[month - 1]} {year}
            </p>
            <div>
              <label>Valor recebido (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0,00"
                autoFocus
              />
              {!payModal.suggestedTithe && (
                <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
                  Sem valor fixo cadastrado. Informe o valor recebido.
                </p>
              )}
            </div>
            <button
              className="btn-primary"
              onClick={markPaid}
              disabled={payLoading || !payAmount || parseFloat(payAmount) <= 0}
            >
              {payLoading ? 'Salvando...' : 'Confirmar pagamento'}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL: LEMBRETE */}
      {reminderTarget && (
        <Modal
          title={`Lembrete para ${reminderTarget.label}`}
          onClose={() => setReminderTarget(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Templates salvos */}
            {templates.length > 0 && (
              <div>
                <label style={{ marginBottom: '6px', display: 'block' }}>Templates salvos</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {templates.map((t) => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button
                        onClick={() => applyTemplate(t)}
                        style={{
                          fontSize: '12px', padding: '4px 10px', borderRadius: '6px',
                          border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer',
                          color: '#4a5568',
                        }}
                      >
                        {t.title}
                      </button>
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fc8181', fontSize: '14px', padding: '0 2px' }}
                        title="Excluir template"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label>Título da notificação</label>
              <input
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder={`Ex: Dízimo de ${MONTHS[month - 1]}`}
              />
            </div>
            <div>
              <label>Mensagem</label>
              <textarea
                value={reminderBody}
                onChange={(e) => setReminderBody(e.target.value)}
                placeholder="Ex: Olá! Passando para lembrar do dízimo deste mês. Obrigado!"
                rows={3}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '14px', fontFamily: 'inherit',
                  resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>

            {reminderMsg && (
              <p style={{ fontSize: '13px', color: reminderMsg.includes('Nenhum') ? '#a0aec0' : '#276749' }}>
                {reminderMsg}
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-primary"
                onClick={sendReminder}
                disabled={reminderLoading || !reminderTitle || !reminderBody}
                style={{ flex: 1 }}
              >
                {reminderLoading ? 'Enviando...' : 'Enviar lembrete'}
              </button>
              {reminderTitle && reminderBody && (
                <button
                  onClick={saveAsTemplate}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
                    background: 'white', cursor: 'pointer', fontSize: '13px', color: '#718096',
                    whiteSpace: 'nowrap',
                  }}
                  title="Salva o título e mensagem como template para reutilizar"
                >
                  Salvar template
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'white', borderRadius: '12px', padding: '28px',
        width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p style={{ fontWeight: '700', fontSize: '16px', color: '#1a1a2e' }}>{title}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: '22px', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
