'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface ScheduleItem {
  id: string
  role: string
  status: string
  schedule: { id: string; title: string; date: string; department: string }
}

const STATUS = {
  PENDING:   { label: 'Aguardando',  bg: '#fef9c3', color: '#a16207',  icon: '⏳' },
  CONFIRMED: { label: 'Confirmado',  bg: '#dcfce7', color: '#16a34a',  icon: '✓' },
  DECLINED:  { label: 'Recusado',    bg: '#fee2e2', color: '#dc2626',  icon: '✕' },
}

export default function MembroEscalasPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/membro/escalas')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function responder(itemId: string, status: 'CONFIRMED' | 'DECLINED') {
    setAtualizando(itemId)
    await fetch(`/api/membro/escalas/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
    setAtualizando(null)
  }

  const now = new Date()
  const proximas = items.filter(i => new Date(i.schedule.date) >= now)
  const passadas  = items.filter(i => new Date(i.schedule.date) <  now)

  return (
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
          <span style={{ fontSize: '40px' }}>📅</span>
          <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Você não tem escalas registradas.
          </p>
        </div>
      ) : (
        <>
          {/* Próximas */}
          {proximas.length > 0 && (
            <section>
              <p style={sectionLabel}>PRÓXIMAS ({proximas.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {proximas.map(item => (
                  <EscalaCard
                    key={item.id}
                    item={item}
                    atualizando={atualizando === item.id}
                    onResponder={responder}
                    isPast={false}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Passadas */}
          {passadas.length > 0 && (
            <section>
              <p style={sectionLabel}>ANTERIORES ({passadas.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {passadas.map(item => (
                  <EscalaCard
                    key={item.id}
                    item={item}
                    atualizando={false}
                    onResponder={responder}
                    isPast={true}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function EscalaCard({
  item, atualizando, onResponder, isPast,
}: {
  item: ScheduleItem
  atualizando: boolean
  onResponder: (id: string, s: 'CONFIRMED' | 'DECLINED') => void
  isPast: boolean
}) {
  const s = STATUS[item.status as keyof typeof STATUS] || STATUS.PENDING
  const date = new Date(item.schedule.date)
  const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '16px',
      border: '1px solid #f1f5f9',
      opacity: isPast ? 0.7 : 1,
    }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
            {item.schedule.department}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{item.schedule.title}</p>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
          background: s.bg, color: s.color, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {s.icon} {s.label}
        </span>
      </div>

      {/* Data e função */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: isPast || item.status !== 'PENDING' ? 0 : '14px' }}>
        <div style={infoChip}>
          <span style={{ fontSize: '13px' }}>📆</span>
          <span style={{ fontSize: '12px', color: '#475569', textTransform: 'capitalize' }}>{dateStr}</span>
        </div>
        <div style={infoChip}>
          <span style={{ fontSize: '13px' }}>🕐</span>
          <span style={{ fontSize: '12px', color: '#475569' }}>{timeStr}</span>
        </div>
      </div>

      {item.role && (
        <div style={{ ...infoChip, marginBottom: isPast || item.status !== 'PENDING' ? 0 : '14px', marginTop: '6px' }}>
          <span style={{ fontSize: '13px' }}>🎯</span>
          <span style={{ fontSize: '12px', color: '#475569' }}>Função: {item.role}</span>
        </div>
      )}

      {/* Botões — só para próximas e pendentes */}
      {!isPast && item.status === 'PENDING' && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
          <button
            onClick={() => onResponder(item.id, 'DECLINED')}
            disabled={atualizando}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #fecaca',
              background: 'white', color: '#dc2626', fontSize: '13px', fontWeight: '600',
              cursor: atualizando ? 'not-allowed' : 'pointer', opacity: atualizando ? 0.6 : 1,
            }}
          >
            ✕ Recusar
          </button>
          <button
            onClick={() => onResponder(item.id, 'CONFIRMED')}
            disabled={atualizando}
            style={{
              flex: 2, padding: '10px', borderRadius: '10px', border: 'none',
              background: '#22c55e', color: 'white', fontSize: '13px', fontWeight: '600',
              cursor: atualizando ? 'not-allowed' : 'pointer', opacity: atualizando ? 0.6 : 1,
            }}
          >
            {atualizando ? 'Salvando...' : '✓ Confirmar presença'}
          </button>
        </div>
      )}

      {/* Permite trocar resposta se ainda não passou */}
      {!isPast && item.status !== 'PENDING' && (
        <button
          onClick={() => onResponder(item.id, 'PENDING'  as any)}
          disabled={atualizando}
          style={{
            marginTop: '12px', background: 'none', border: 'none',
            color: '#94a3b8', fontSize: '12px', cursor: 'pointer', padding: 0,
          }}
        >
          Alterar resposta
        </button>
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
}

const infoChip: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '4px',
}
