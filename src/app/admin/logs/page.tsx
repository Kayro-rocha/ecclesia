'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Log {
  id: string
  userName: string
  action: string
  target: string
  detail: string | null
  createdAt: string
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CRIAR_IGREJA:    { label: 'Criou igreja',       color: '#3b82f6' },
  SUSPENDER_IGREJA:{ label: 'Suspendeu',           color: '#f59e0b' },
  REATIVAR_IGREJA: { label: 'Reativou',            color: '#4ade80' },
  ENCERRAR_CONTA:  { label: 'Encerrou conta',      color: '#ef4444' },
  ALTERAR_PLANO:   { label: 'Alterou plano',       color: '#a78bfa' },
  RENOMEAR_IGREJA: { label: 'Renomeou',            color: '#94a3b8' },
  RESET_SENHA:     { label: 'Resetou senha',       color: '#f97316' },
  ENVIAR_CONVITE:  { label: 'Enviou convite',      color: '#22d3ee' },
}

export default function AdminLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(p = page) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (search) params.set('search', search)
    const res = await fetch(`/api/admin/logs?${params}`)
    if (res.status === 401) { router.push('/admin/login'); return }
    const data = await res.json()
    setLogs(data.logs ?? [])
    setTotal(data.total ?? 0)
    setTotalPages(data.totalPages ?? 1)
    setLoading(false)
  }

  useEffect(() => { setPage(1); load(1) }, [search])
  useEffect(() => { load(page) }, [page])

  const from = total === 0 ? 0 : (page - 1) * 50 + 1
  const to = Math.min(page * 50, total)

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>Logs de auditoria</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            {loading ? 'Carregando...' : `${total} registros`}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          className="admin-input"
          placeholder="Buscar por ação, nome ou alvo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Carregando...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Quem</th>
                <th>Ação</th>
                <th>Alvo</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#475569', padding: '40px' }}>Nenhum registro encontrado</td></tr>
              ) : logs.map(log => {
                const meta = ACTION_LABELS[log.action]
                return (
                  <tr key={log.id}>
                    <td style={{ color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</td>
                    <td style={{ color: '#e2e8f0', fontSize: '13px' }}>{log.userName}</td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: '600',
                        background: `${meta?.color ?? '#475569'}20`,
                        color: meta?.color ?? '#94a3b8',
                      }}>
                        {meta?.label ?? log.action}
                      </span>
                    </td>
                    <td style={{ color: '#e2e8f0', fontSize: '13px' }}>{log.target}</td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{log.detail ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{from}–{to} de {total}</p>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="admin-btn admin-btn-ghost"
              style={{ fontSize: '12px', padding: '5px 12px', opacity: page === 1 ? 0.4 : 1 }}>
              ‹ Anterior
            </button>
            <span style={{ padding: '5px 12px', color: '#94a3b8', fontSize: '13px' }}>
              {page} / {totalPages}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="admin-btn admin-btn-ghost"
              style={{ fontSize: '12px', padding: '5px 12px', opacity: page === totalPages ? 0.4 : 1 }}>
              Próxima ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
