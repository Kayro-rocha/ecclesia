'use client'

import { useState, useEffect } from 'react'
import { Bell, Globe, Users, Calendar, ChevronRight } from 'lucide-react'
import BottomSheet from '../BottomSheet'

type Comunicado = {
  id: string
  title: string
  body: string
  imageUrl: string | null
  targetGroup: string | null
  createdAt: Date
}

interface Props {
  comunicados: Comunicado[]
  grupo: string | null
  initialOpenId?: string | null
}

export default function ComunicadosList({ comunicados, grupo, initialOpenId }: Props) {
  const [aberto, setAberto] = useState<Comunicado | null>(null)

  useEffect(() => {
    if (!initialOpenId) return
    const found = comunicados.find(c => c.id === initialOpenId)
    if (found) setAberto(found)
  }, [initialOpenId, comunicados])

  return (
    <>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Comunicados</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            {comunicados.length} aviso{comunicados.length !== 1 ? 's' : ''}
            {grupo ? ` · ${grupo} + Todos` : ''}
          </p>
        </div>

        {comunicados.length === 0 ? (
          <div style={emptyBox}>
            <Bell size={40} color="#cbd5e1" />
            <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Nenhum comunicado por enquanto.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {comunicados.map((c, i) => {
              const isGeral = !c.targetGroup
              const dataStr = new Date(c.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })
              const isNew = i === 0

              return (
                <button
                  key={c.id}
                  onClick={() => setAberto(c)}
                  style={{
                    textAlign: 'left', cursor: 'pointer', background: 'white',
                    borderRadius: '16px', border: `1px solid ${isNew ? '#bfdbfe' : '#f1f5f9'}`,
                    overflow: 'hidden', padding: 0, width: '100%',
                    boxShadow: isNew ? '0 2px 12px rgba(59,130,246,0.08)' : 'none',
                  }}
                >
                  {c.imageUrl && (
                    <img
                      src={c.imageUrl}
                      alt={c.title}
                      style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {isNew && <span style={badge('#eff6ff', '#3b82f6')}>NOVO</span>}
                      <span style={{ ...badge(isGeral ? '#f0fdf4' : '#faf5ff', isGeral ? '#16a34a' : '#9333ea'), display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        {isGeral
                          ? <><Globe size={10} /> Todos</>
                          : <><Users size={10} /> {c.targetGroup}</>
                        }
                      </span>
                    </div>
                    <h2 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                      {c.title}
                    </h2>
                    <p style={{
                      margin: '0 0 12px', fontSize: '14px', color: '#475569',
                      lineHeight: 1.6,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {c.body}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {dataStr}
                      </p>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>
                        Ler mais <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {aberto && (
        <BottomSheet onClose={() => setAberto(null)}>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {aberto.imageUrl && (
              <img
                src={aberto.imageUrl}
                alt={aberto.title}
                style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }}
              />
            )}

            <div style={{ padding: '20px 20px 40px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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

              <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: '#1e293b', lineHeight: 1.3 }}>
                {aberto.title}
              </h2>

              <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} />
                {new Date(aberto.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </p>

              <p style={{ margin: 0, fontSize: '15px', color: '#334155', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                {aberto.body}
              </p>
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

const emptyBox: React.CSSProperties = {
  padding: '60px 20px', textAlign: 'center',
  background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
}

function badge(bg: string, color: string): React.CSSProperties {
  return {
    display: 'inline-block', fontSize: '10px', fontWeight: '700',
    padding: '2px 8px', borderRadius: '20px',
    background: bg, color, letterSpacing: '0.3px',
  }
}
