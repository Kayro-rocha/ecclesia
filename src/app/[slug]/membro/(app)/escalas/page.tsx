'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Clock, Target, Check, X, CheckCircle, XCircle, AlarmClock, ChevronRight } from 'lucide-react'
import BottomSheet from '../BottomSheet'

interface ScheduleItem {
  id: string
  role: string
  status: string
  schedule: { id: string; title: string; date: string; department: string }
}

interface Participante {
  id: string
  name: string
  role: string
  status: string
  isMe: boolean
}

interface Detalhe {
  schedule: { id: string; title: string; date: string; department: string }
  myItemId: string
  participants: Participante[]
}

type StatusKey = 'PENDING' | 'CONFIRMED' | 'DECLINED'

const STATUS: Record<StatusKey, { label: string; bg: string; color: string; Icon: React.ElementType }> = {
  PENDING:   { label: 'Aguardando', bg: '#fef9c3', color: '#a16207', Icon: AlarmClock },
  CONFIRMED: { label: 'Confirmado', bg: '#dcfce7', color: '#16a34a', Icon: CheckCircle },
  DECLINED:  { label: 'Recusado',   bg: '#fee2e2', color: '#dc2626', Icon: XCircle   },
}

export default function MembroEscalasPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null)
  const [loadingDetalhe, setLoadingDetalhe] = useState(false)

  async function load() {
    const res = await fetch('/api/membro/escalas')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function abrirDetalhe(itemId: string) {
    setLoadingDetalhe(true)
    setDetalhe({ schedule: {} as any, myItemId: itemId, participants: [] })
    const res = await fetch(`/api/membro/escalas/${itemId}`)
    const data = await res.json()
    setDetalhe(data)
    setLoadingDetalhe(false)
  }

  async function responder(itemId: string, status: 'CONFIRMED' | 'DECLINED') {
    setAtualizando(itemId)
    await fetch(`/api/membro/escalas/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
    if (detalhe) {
      const res = await fetch(`/api/membro/escalas/${itemId}`)
      setDetalhe(await res.json())
    }
    setAtualizando(null)
  }

  const now = new Date()
  const proximas = items.filter(i => new Date(i.schedule.date) >= now)
  const passadas  = items.filter(i => new Date(i.schedule.date) <  now)

  return (
    <>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Minhas Escalas</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Suas convocações de serviço</p>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            Carregando...
          </div>
        ) : items.length === 0 ? (
          <div style={emptyBox}>
            <Calendar size={40} color="#cbd5e1" />
            <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Você não tem escalas registradas.
            </p>
          </div>
        ) : (
          <>
            {proximas.length > 0 && (
              <section>
                <p style={sectionLabel}>PRÓXIMAS ({proximas.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {proximas.map(item => (
                    <EscalaCard key={item.id} item={item} atualizando={atualizando === item.id}
                      onResponder={responder} isPast={false} onDetalhes={abrirDetalhe} />
                  ))}
                </div>
              </section>
            )}
            {passadas.length > 0 && (
              <section>
                <p style={sectionLabel}>ANTERIORES ({passadas.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {passadas.map(item => (
                    <EscalaCard key={item.id} item={item} atualizando={false}
                      onResponder={responder} isPast={true} onDetalhes={abrirDetalhe} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Modal de detalhes */}
      {detalhe && (
        <BottomSheet onClose={() => setDetalhe(null)}>
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 20px 8px' }}>
            {loadingDetalhe || !detalhe.schedule?.title ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
                Carregando detalhes...
              </div>
            ) : (
              <>
                {/* Cabeçalho */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {detalhe.schedule.department}
                  </p>
                  <h2 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                    {detalhe.schedule.title}
                  </h2>

                  {(() => {
                    const d = new Date(detalhe.schedule.date)
                    return (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        background: '#eff6ff', borderRadius: '12px', padding: '12px 14px',
                      }}>
                        <div style={{ textAlign: 'center', minWidth: '44px' }}>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase' }}>
                            {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                          </div>
                          <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e40af', lineHeight: 1 }}>
                            {d.toLocaleDateString('pt-BR', { day: '2-digit' })}
                          </div>
                          <div style={{ fontSize: '10px', color: '#3b82f6' }}>
                            {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                            <Clock size={14} color="#3b82f6" />
                            {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', textTransform: 'capitalize' }}>
                            {d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Minha função */}
                {(() => {
                  const me = detalhe.participants.find(p => p.isMe)
                  const s = STATUS[me?.status as StatusKey] || STATUS.PENDING
                  return me ? (
                    <div style={{ marginBottom: '20px', padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Sua participação</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <Target size={14} color="#3b82f6" />
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{me.role}</p>
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Sua função nesta escala</p>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: s.bg, color: s.color }}>
                          <s.Icon size={11} />
                          {s.label}
                        </span>
                      </div>

                      {me.status === 'PENDING' && new Date(detalhe.schedule.date) >= new Date() && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button
                            onClick={() => responder(detalhe.myItemId, 'DECLINED')}
                            disabled={!!atualizando}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', border: '1.5px solid #fecaca', background: 'white', color: '#dc2626', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            <X size={14} /> Recusar
                          </button>
                          <button
                            onClick={() => responder(detalhe.myItemId, 'CONFIRMED')}
                            disabled={!!atualizando}
                            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', border: 'none', background: '#22c55e', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            <Check size={14} /> {atualizando ? 'Salvando...' : 'Confirmar presença'}
                          </button>
                        </div>
                      )}
                      {me.status !== 'PENDING' && new Date(detalhe.schedule.date) >= new Date() && (
                        <button
                          onClick={() => responder(detalhe.myItemId, 'PENDING' as any)}
                          disabled={!!atualizando}
                          style={{ marginTop: '10px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                        >Alterar resposta</button>
                      )}
                    </div>
                  ) : null
                })()}

                {/* Todos os participantes */}
                <div>
                  <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Equipe ({detalhe.participants.length})
                  </p>
                  <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                    {detalhe.participants.map((p, i) => {
                      const s = STATUS[p.status as StatusKey] || STATUS.PENDING
                      return (
                        <div key={p.id} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 14px',
                          borderBottom: i < detalhe.participants.length - 1 ? '1px solid #f8fafc' : 'none',
                          background: p.isMe ? '#f0f9ff' : 'white',
                        }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                            background: p.isMe ? '#3b82f6' : '#e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: '700',
                            color: p.isMe ? 'white' : '#64748b',
                          }}>
                            {p.name.charAt(0).toUpperCase()}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: '0 0 1px', fontSize: '14px', fontWeight: p.isMe ? '700' : '500', color: '#1e293b' }}>
                              {p.name}{p.isMe ? ' (você)' : ''}
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{p.role}</p>
                          </div>

                          <span style={{
                            display: 'flex', alignItems: 'center', gap: '3px',
                            fontSize: '10px', fontWeight: '700', padding: '2px 8px',
                            borderRadius: '20px', background: s.bg, color: s.color, flexShrink: 0,
                          }}>
                            <s.Icon size={10} />
                            {s.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ padding: '12px 20px 28px', flexShrink: 0, borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => setDetalhe(null)}
              style={{ width: '100%', padding: '14px', border: 'none', background: '#f1f5f9', borderRadius: '12px', fontSize: '15px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
            >
              Fechar
            </button>
          </div>
        </BottomSheet>
      )}
    </>
  )
}

function EscalaCard({ item, atualizando, onResponder, isPast, onDetalhes }: {
  item: ScheduleItem
  atualizando: boolean
  onResponder: (id: string, s: 'CONFIRMED' | 'DECLINED') => void
  isPast: boolean
  onDetalhes: (id: string) => void
}) {
  const s = STATUS[item.status as StatusKey] || STATUS.PENDING
  const date = new Date(item.schedule.date)
  const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      border: `1px solid ${!isPast && item.status === 'PENDING' ? '#bfdbfe' : '#f1f5f9'}`,
      overflow: 'hidden', opacity: isPast ? 0.7 : 1,
    }}>
      <button
        onClick={() => onDetalhes(item.id)}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '16px 16px 12px', cursor: 'pointer', display: 'block' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
              {item.schedule.department}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{item.schedule.title}</p>
          </div>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
            background: s.bg, color: s.color, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            <s.Icon size={11} />
            {s.label}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#475569', textTransform: 'capitalize' }}>
            <Calendar size={12} color="#94a3b8" />{dateStr}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#475569' }}>
            <Clock size={12} color="#94a3b8" />{timeStr}
          </span>
        </div>

        {item.role && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            <Target size={12} color="#94a3b8" />
            <span style={{ fontSize: '12px', color: '#475569' }}>Função: {item.role}</span>
          </div>
        )}

        <p style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '10px 0 0', fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
          Ver equipe <ChevronRight size={14} />
        </p>
      </button>

      {!isPast && item.status === 'PENDING' && (
        <div style={{ display: 'flex', gap: '8px', padding: '0 16px 14px' }}>
          <button
            onClick={() => onResponder(item.id, 'DECLINED')}
            disabled={atualizando}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', border: '1.5px solid #fecaca', background: 'white', color: '#dc2626', fontSize: '13px', fontWeight: '600', cursor: atualizando ? 'not-allowed' : 'pointer', opacity: atualizando ? 0.6 : 1 }}
          >
            <X size={14} /> Recusar
          </button>
          <button
            onClick={() => onResponder(item.id, 'CONFIRMED')}
            disabled={atualizando}
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', border: 'none', background: '#22c55e', color: 'white', fontSize: '13px', fontWeight: '600', cursor: atualizando ? 'not-allowed' : 'pointer', opacity: atualizando ? 0.6 : 1 }}
          >
            <Check size={14} /> {atualizando ? 'Salvando...' : 'Confirmar presença'}
          </button>
        </div>
      )}
      {!isPast && item.status !== 'PENDING' && (
        <div style={{ padding: '0 16px 12px' }}>
          <button
            onClick={() => onResponder(item.id, 'PENDING' as any)}
            disabled={atualizando}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', padding: 0 }}
          >Alterar resposta</button>
        </div>
      )}
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  margin: '0 0 10px', fontSize: '11px', fontWeight: '700',
  color: '#94a3b8', letterSpacing: '0.5px',
}

const emptyBox: React.CSSProperties = {
  padding: '60px 20px', textAlign: 'center',
  background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
}
