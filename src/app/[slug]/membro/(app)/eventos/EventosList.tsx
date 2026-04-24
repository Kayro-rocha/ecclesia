'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Globe, Users, Check, X, ChevronRight, PartyPopper } from 'lucide-react'
import BottomSheet from '../BottomSheet'

type Evento = {
  id: string
  title: string
  description: string | null
  date: Date
  location: string | null
  targetGroup: string | null
  imageUrl: string | null
}

interface Props {
  proximos: Evento[]
  anteriores: Evento[]
  rsvpMap: Record<string, boolean | null>
  memberId: string
  memberName: string
  memberPhone: string
  initialOpenId?: string | null
}

export default function EventosList({ proximos, anteriores, rsvpMap, memberId, memberName, memberPhone, initialOpenId }: Props) {
  const [aberto, setAberto] = useState<Evento | null>(null)

  useEffect(() => {
    if (!initialOpenId) return
    const all = [...proximos, ...anteriores]
    const found = all.find(e => e.id === initialOpenId)
    if (found) setAberto(found)
  }, [initialOpenId, proximos, anteriores])

  const [rsvp, setRsvp] = useState<Record<string, boolean | null>>(rsvpMap)
  const [salvando, setSalvando] = useState(false)

  const total = proximos.length + anteriores.length

  async function confirmar(eventId: string, confirmed: boolean) {
    setSalvando(true)
    await fetch(`/api/events/${eventId}/attend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, name: memberName, phone: memberPhone, confirmed }),
    })
    setRsvp(prev => ({ ...prev, [eventId]: confirmed }))
    setSalvando(false)
  }

  return (
    <>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Eventos</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            {proximos.length} próximo{proximos.length !== 1 ? 's' : ''} · {anteriores.length} anterior{anteriores.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {total === 0 ? (
          <div style={emptyBox}>
            <PartyPopper size={40} color="#cbd5e1" />
            <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Nenhum evento cadastrado.
            </p>
          </div>
        ) : (
          <>
            {proximos.length > 0 && (
              <section>
                <p style={sectionLabel}>PRÓXIMOS ({proximos.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {proximos.map((e, i) => (
                    <EventoCard key={e.id} evento={e} destaque={i === 0} rsvp={rsvp[e.id] ?? null} onClick={() => setAberto(e)} />
                  ))}
                </div>
              </section>
            )}
            {anteriores.length > 0 && (
              <section>
                <p style={sectionLabel}>ANTERIORES</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {anteriores.map(e => (
                    <EventoCard key={e.id} evento={e} destaque={false} passado rsvp={rsvp[e.id] ?? null} onClick={() => setAberto(e)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {aberto && (
        <BottomSheet onClose={() => setAberto(null)}>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {aberto.imageUrl && (
              <img
                src={aberto.imageUrl}
                alt={aberto.title}
                style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }}
              />
            )}

            <div style={{ padding: '20px 20px 8px' }}>
              {(() => {
                const d = new Date(aberto.date)
                const isPast = d < new Date()
                return (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    background: isPast ? '#f8fafc' : '#eff6ff',
                    borderRadius: '12px', padding: '12px 16px', marginBottom: '16px',
                  }}>
                    <div style={{ textAlign: 'center', minWidth: '44px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: isPast ? '#94a3b8' : '#3b82f6', textTransform: 'uppercase' }}>
                        {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: isPast ? '#94a3b8' : '#1e40af', lineHeight: 1 }}>
                        {d.toLocaleDateString('pt-BR', { day: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '10px', color: isPast ? '#94a3b8' : '#3b82f6' }}>
                        {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                        <Clock size={14} color={isPast ? '#94a3b8' : '#3b82f6'} />
                        {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {aberto.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                          <MapPin size={13} color="#94a3b8" />
                          {aberto.location}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              <div style={{ marginBottom: '12px' }}>
                <span style={{ ...badge(
                  !aberto.targetGroup ? '#f0fdf4' : '#faf5ff',
                  !aberto.targetGroup ? '#16a34a' : '#9333ea',
                ), display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  {!aberto.targetGroup
                    ? <><Globe size={10} /> Todos</>
                    : <><Users size={10} /> {aberto.targetGroup}</>
                  }
                </span>
              </div>

              <h2 style={{ margin: '0 0 14px', fontSize: '20px', fontWeight: '700', color: '#1e293b', lineHeight: 1.3 }}>
                {aberto.title}
              </h2>

              {aberto.description && (
                <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#334155', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {aberto.description}
                </p>
              )}

              {new Date(aberto.date) >= new Date() && (
                <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', marginBottom: '8px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                    Você vai comparecer?
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      disabled={salvando}
                      onClick={() => confirmar(aberto.id, true)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                        fontSize: '14px', fontWeight: '600', transition: 'all 0.15s',
                        background: rsvp[aberto.id] === true ? '#16a34a' : '#f0fdf4',
                        color: rsvp[aberto.id] === true ? 'white' : '#16a34a',
                        outline: rsvp[aberto.id] === true ? 'none' : '1.5px solid #bbf7d0',
                      }}
                    >
                      <Check size={15} />
                      {rsvp[aberto.id] === true ? 'Confirmado!' : 'Vou comparecer'}
                    </button>

                    <button
                      disabled={salvando}
                      onClick={() => confirmar(aberto.id, false)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                        fontSize: '14px', fontWeight: '600', transition: 'all 0.15s',
                        background: rsvp[aberto.id] === false ? '#dc2626' : '#fff5f5',
                        color: rsvp[aberto.id] === false ? 'white' : '#dc2626',
                        outline: rsvp[aberto.id] === false ? 'none' : '1.5px solid #fecaca',
                      }}
                    >
                      <X size={15} />
                      Não vou
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '12px 20px 28px', flexShrink: 0, borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => setAberto(null)}
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

function EventoCard({ evento, destaque, passado, rsvp, onClick }: {
  evento: Evento
  destaque: boolean
  passado?: boolean
  rsvp: boolean | null
  onClick: () => void
}) {
  const date = new Date(evento.date)
  const isGeral = !evento.targetGroup
  const diaSemana = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  const dia       = date.toLocaleDateString('pt-BR', { day: '2-digit' })
  const mes       = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const hora      = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', cursor: 'pointer', padding: 0, width: '100%',
        background: 'white', borderRadius: '16px',
        border: `1px solid ${destaque ? '#bfdbfe' : '#f1f5f9'}`,
        overflow: 'hidden', opacity: passado ? 0.65 : 1,
      }}
    >
      {evento.imageUrl && (
        <img src={evento.imageUrl} alt={evento.title}
          style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
      )}
      <div style={{ display: 'flex' }}>
        <div style={{
          minWidth: '64px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '16px 12px',
          background: destaque ? '#eff6ff' : '#f8fafc', borderRight: '1px solid #f1f5f9',
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>{diaSemana}</span>
          <span style={{ fontSize: '28px', fontWeight: '800', color: destaque ? '#3b82f6' : '#1e293b', lineHeight: 1.1 }}>{dia}</span>
          <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>{mes}</span>
        </div>

        <div style={{ flex: 1, padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {destaque && !passado && <span style={badge('#dbeafe', '#2563eb')}>EM BREVE</span>}
            <span style={{ ...badge(isGeral ? '#f0fdf4' : '#faf5ff', isGeral ? '#16a34a' : '#9333ea'), display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              {isGeral ? <><Globe size={10} /> Todos</> : <><Users size={10} /> {evento.targetGroup}</>}
            </span>
            {!passado && rsvp === true  && (
              <span style={{ ...badge('#dcfce7', '#16a34a'), display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Check size={10} /> Confirmado
              </span>
            )}
            {!passado && rsvp === false && (
              <span style={{ ...badge('#fee2e2', '#dc2626'), display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <X size={10} /> Não vou
              </span>
            )}
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{evento.title}</h2>
          {evento.description && (
            <p style={{
              margin: '0 0 8px', fontSize: '13px', color: '#64748b', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {evento.description}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                <Clock size={12} color="#94a3b8" />{hora}
              </span>
              {evento.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                  <MapPin size={12} color="#94a3b8" />{evento.location}
                </span>
              )}
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
              {!passado && rsvp === null ? 'Confirmar' : 'Ver mais'}
              <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

const sectionLabel: React.CSSProperties = {
  margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px',
}

const emptyBox: React.CSSProperties = {
  padding: '60px 20px', textAlign: 'center',
  background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
}

function badge(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-block', fontSize: '10px', fontWeight: '700',
    padding: '2px 8px', borderRadius: '20px', background: bg, color,
  }
}
