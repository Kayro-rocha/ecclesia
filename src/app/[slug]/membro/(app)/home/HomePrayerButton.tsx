'use client'

import { useState } from 'react'
import BottomSheet from '../BottomSheet'

interface Props {
  slug: string
  memberId: string
}

export default function HomePrayerButton({ slug, memberId }: Props) {
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar() {
    if (texto.trim().length < 5) {
      setErro('Escreva um pouco mais sobre seu pedido.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      const res = await fetch('/api/prayer-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: texto }),
      })
      if (!res.ok) throw new Error()
      setEnviado(true)
      setTexto('')
    } catch {
      setErro('Não foi possível enviar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  function fechar() {
    setOpen(false)
    setTimeout(() => { setEnviado(false); setErro(''); setTexto('') }, 300)
  }

  return (
    <>
      {/* Botão na home */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          borderRadius: '18px', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '14px',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: '28px', width: '44px', height: '44px',
          background: 'rgba(255,255,255,0.15)', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>🙏</span>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: '700', color: 'white' }}>
            Pedido de Oração
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
            Compartilhe com a liderança da igreja
          </p>
        </div>
      </button>

      {/* Modal */}
      {open && (
        <BottomSheet onClose={fechar}>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {enviado ? (
              /* ── Estado de sucesso ── */
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>🙏</div>
                <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                  Pedido enviado!
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                  A liderança da igreja vai interceder por você. Deus está no controle!
                </p>
                <button
                  onClick={fechar}
                  style={{
                    width: '100%', padding: '14px', border: 'none', cursor: 'pointer',
                    background: '#7c3aed', color: 'white', borderRadius: '12px',
                    fontSize: '15px', fontWeight: '700',
                  }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              /* ── Formulário ── */
              <>
                <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                  <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                    🙏 Pedido de Oração
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Sua solicitação é confidencial e vista apenas pela liderança.
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block', fontSize: '13px', fontWeight: '600',
                    color: '#374151', marginBottom: '8px',
                  }}>
                    Escreva seu pedido
                  </label>
                  <textarea
                    value={texto}
                    onChange={e => setTexto(e.target.value)}
                    placeholder="Ex: Preciso de oração pela minha saúde, família, emprego..."
                    rows={5}
                    style={{
                      width: '100%', borderRadius: '12px', border: '1.5px solid #e2e8f0',
                      padding: '12px', fontSize: '15px', color: '#1e293b',
                      background: '#f8fafc', resize: 'none', outline: 'none',
                      fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>
                    {texto.length} caracteres
                  </p>
                </div>

                {erro && (
                  <div style={{
                    background: '#fee2e2', color: '#dc2626',
                    borderRadius: '10px', padding: '10px 14px', fontSize: '13px',
                  }}>
                    {erro}
                  </div>
                )}

                <button
                  onClick={enviar}
                  disabled={salvando || texto.trim().length < 5}
                  style={{
                    width: '100%', padding: '14px', border: 'none', cursor: 'pointer',
                    background: salvando || texto.trim().length < 5 ? '#a78bfa' : '#7c3aed',
                    color: 'white', borderRadius: '12px', fontSize: '15px', fontWeight: '700',
                    opacity: salvando ? 0.7 : 1, transition: 'background 0.2s',
                  }}
                >
                  {salvando ? 'Enviando...' : '🙏 Enviar pedido'}
                </button>

                <button
                  onClick={fechar}
                  style={{
                    width: '100%', padding: '12px', border: '1.5px solid #e2e8f0',
                    cursor: 'pointer', background: 'white', color: '#64748b',
                    borderRadius: '12px', fontSize: '14px', fontWeight: '600',
                  }}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </BottomSheet>
      )}
    </>
  )
}
