'use client'

import { useState } from 'react'
import Link from 'next/link'

type Evento = {
  id: string
  title: string
  description: string | null
  date: Date
  location: string | null
  targetGroup: string | null
  imageUrl: string | null
  _count: { attendees: number }
}

interface Props {
  eventos: Evento[]
  slug: string
  appDomain: string
}

export default function EventosListGestor({ eventos, slug, appDomain }: Props) {
  const [preview, setPreview] = useState<Evento | null>(null)

  if (eventos.length === 0) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</div>
        <p style={{ color: '#718096', fontSize: '14px', margin: '0 0 20px' }}>
          Nenhum evento criado ainda.<br />Crie retiros, células, encontros e muito mais.
        </p>
        <Link href={`/${slug}/eventos/novo`} className="btn-primary">Criar primeiro evento</Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {eventos.map(evento => {
          const passado = new Date(evento.date) < new Date()
          const dataFormatada = new Date(evento.date).toLocaleDateString('pt-BR', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
          })

          return (
            <div key={evento.id} className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {/* Thumbnail ou bloco de data */}
              {evento.imageUrl ? (
                <img
                  src={evento.imageUrl}
                  alt={evento.title}
                  style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: '56px', height: '56px', borderRadius: '12px', flexShrink: 0,
                  background: passado ? '#f7fafc' : 'var(--primary-light)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: passado ? '#a0aec0' : 'var(--primary)', lineHeight: 1 }}>
                    {new Date(evento.date).getDate()}
                  </div>
                  <div style={{ fontSize: '10px', color: passado ? '#a0aec0' : 'var(--primary)', textTransform: 'uppercase' }}>
                    {new Date(evento.date).toLocaleDateString('pt-BR', { month: 'short' })}
                  </div>
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a2e' }}>{evento.title}</span>
                  {passado ? <span className="badge-gray">Encerrado</span> : <span className="badge-green">Próximo</span>}
                  {evento.targetGroup && <span className="badge-blue">{evento.targetGroup}</span>}
                </div>
                <div style={{ fontSize: '13px', color: '#718096' }}>{dataFormatada}</div>
                {evento.location && <div style={{ fontSize: '13px', color: '#a0aec0' }}>📍 {evento.location}</div>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e' }}>{evento._count.attendees}</span>
                <span style={{ fontSize: '11px', color: '#a0aec0' }}>confirmados</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPreview(evento)}
                    style={{ fontSize: '13px', padding: '6px 14px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#718096', fontWeight: '500' }}
                  >
                    👁 Preview
                  </button>
                  <Link href={`/${slug}/eventos/${evento.id}`} className="btn-secondary" style={{ fontSize: '13px', padding: '6px 14px' }}>
                    Gerenciar
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de preview */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>Como o membro vê no app</p>

            {/* Moldura do celular */}
            <div style={{
              width: '300px',
              background: '#0f172a',
              borderRadius: '40px',
              padding: '10px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.1)',
            }}>
              {/* Tela */}
              <div style={{
                background: '#f1f5f9',
                borderRadius: '32px',
                overflow: 'hidden',
                maxHeight: '580px',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Status bar */}
                <div style={{ background: 'white', padding: '10px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>11:10</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#1e293b' }}>▲▲▲</span>
                    <span style={{ fontSize: '10px', color: '#1e293b' }}>WiFi</span>
                    <span style={{ fontSize: '10px', color: '#1e293b' }}>🔋</span>
                  </div>
                </div>

                {/* Conteúdo scrollável */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
                  {/* Card do evento */}
                  <div style={{
                    background: 'white', borderRadius: '14px',
                    border: '1px solid #bfdbfe', overflow: 'hidden',
                  }}>
                    {preview.imageUrl && (
                      <img src={preview.imageUrl} alt="" style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                    )}
                    <div style={{ display: 'flex' }}>
                      {/* Bloco data */}
                      {(() => {
                        const d = new Date(preview.date)
                        return (
                          <div style={{
                            minWidth: '54px', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', padding: '12px 8px',
                            background: '#eff6ff', borderRight: '1px solid #f1f5f9',
                          }}>
                            <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>
                              {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                            </span>
                            <span style={{ fontSize: '22px', fontWeight: '800', color: '#3b82f6', lineHeight: 1.1 }}>
                              {d.toLocaleDateString('pt-BR', { day: '2-digit' })}
                            </span>
                            <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
                              {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                            </span>
                          </div>
                        )
                      })()}
                      <div style={{ flex: 1, padding: '10px 12px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '20px', background: '#dbeafe', color: '#2563eb' }}>EM BREVE</span>
                        <h3 style={{ margin: '6px 0 4px', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{preview.title}</h3>
                        {preview.description && (
                          <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#64748b', lineHeight: 1.4,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {preview.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>
                            🕐 {new Date(preview.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {preview.location && <span style={{ fontSize: '10px', color: '#64748b' }}>📍 {preview.location}</span>}
                        </div>
                      </div>
                    </div>
                    {/* Botões RSVP */}
                    <div style={{ padding: '10px 12px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ padding: '8px', textAlign: 'center', background: '#f0fdf4', borderRadius: '8px', fontSize: '11px', fontWeight: '600', color: '#16a34a', border: '1px solid #bbf7d0' }}>✓ Vou comparecer</div>
                      <div style={{ padding: '8px', textAlign: 'center', background: '#fff5f5', borderRadius: '8px', fontSize: '11px', fontWeight: '600', color: '#dc2626', border: '1px solid #fecaca' }}>✕ Não vou</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setPreview(null)}
              style={{ background: 'white', border: 'none', borderRadius: '12px', padding: '10px 32px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#475569' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </>
  )
}
