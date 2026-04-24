'use client'

import { useState } from 'react'
import Link from 'next/link'
import ComunicadoActions from './ComunicadoActions'

type Comunicado = {
  id: string
  title: string
  body: string
  imageUrl: string | null
  targetGroup: string | null
  sentAt: Date | null
  createdAt: Date
  recipientCount: number
}

interface Props {
  comunicados: Comunicado[]
  slug: string
  churchName: string
}

export default function ComunicadosListGestor({ comunicados, slug, churchName }: Props) {
  const [preview, setPreview] = useState<Comunicado | null>(null)

  if (comunicados.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '8px' }}>Nenhum comunicado encontrado</p>
        <Link href={`/${slug}/comunicados/novo`} style={{ color: 'var(--primary)', fontSize: '14px' }}>
          Criar primeiro comunicado
        </Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {comunicados.map((c) => (
          <div key={c.id} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              {/* Thumbnail */}
              <div style={{ display: 'flex', gap: '14px', flex: 1, minWidth: 0 }}>
                {c.imageUrl && (
                  <img
                    src={c.imageUrl}
                    alt={c.title}
                    style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '15px' }}>{c.title}</p>
                  <p style={{ fontSize: '13px', color: '#718096', marginTop: '4px',
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const }}>
                    {c.body}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {c.sentAt ? <span className="badge-green">Enviado</span> : <span className="badge-yellow">Rascunho</span>}
                <p style={{ fontSize: '11px', color: '#cbd5e0', marginTop: '4px' }}>
                  {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            {c.sentAt && (
              <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '8px' }}>
                Enviado para {c.recipientCount} membros · {new Date(c.sentAt).toLocaleDateString('pt-BR')}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => setPreview(c)}
                style={{ fontSize: '13px', padding: '6px 14px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#718096', fontWeight: '500' }}
              >
                👁 Preview
              </button>
              <ComunicadoActions slug={slug} comunicadoId={c.id} foiEnviado={!!c.sentAt} />
            </div>
          </div>
        ))}
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
                    <span style={{ fontSize: '10px', color: '#1e293b' }}>▲▲▲ WiFi 🔋</span>
                  </div>
                </div>

                {/* Header da app */}
                <div style={{ background: 'white', padding: '8px 14px 10px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div style={{ width: '28px', height: '28px', background: '#667eea', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>⛪</div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>{churchName}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Olá, Membro</div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
                  <div style={{
                    background: 'white', borderRadius: '14px',
                    border: '1px solid #bfdbfe', overflow: 'hidden',
                  }}>
                    {preview.imageUrl && (
                      <img src={preview.imageUrl} alt="" style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                    )}
                    <div style={{ padding: '12px' }}>
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '20px', background: '#eff6ff', color: '#3b82f6' }}>NOVO</span>
                        <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '20px',
                          background: !preview.targetGroup ? '#f0fdf4' : '#faf5ff',
                          color: !preview.targetGroup ? '#16a34a' : '#9333ea' }}>
                          {!preview.targetGroup ? '🌐 Todos' : `👥 ${preview.targetGroup}`}
                        </span>
                      </div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                        {preview.title}
                      </h3>
                      <p style={{
                        margin: '0 0 8px', fontSize: '11px', color: '#475569', lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {preview.body}
                      </p>
                      <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>
                        📅 {new Date(preview.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
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
