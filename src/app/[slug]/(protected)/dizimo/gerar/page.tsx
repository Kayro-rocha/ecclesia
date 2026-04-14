'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function GerarCobrancasPage() {
  const router = useRouter()
  const { slug } = useParams<{ slug: string }>()
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{ gerados: number; erros: string[] } | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const hoje = new Date()
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()

  async function gerar() {
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch(`/api/tithes/gerar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, mes, ano }),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error || 'Erro ao gerar cobranças')
        return
      }
      setResultado(data)
    } catch {
      setApiError('Erro inesperado ao gerar cobranças')
    } finally {
      setLoading(false)
    }
  }

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  return (
    <div>
      <div className="page-header">
        <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>
          Gerar cobranças — {meses[mes - 1]} {ano}
        </span>
      </div>

      <div className="page-content">
        <div className="card" style={{ maxWidth: '480px' }}>
          {apiError && (
            <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ color: '#c53030', fontSize: '14px' }}>Erro: {apiError}</p>
            </div>
          )}
          {!resultado ? (
            <>
              <p style={{ color: '#718096', fontSize: '14px', marginBottom: '20px' }}>
                Isso vai criar uma cobrança PIX para cada dizimista ativo que ainda não tem cobrança neste mês.
              </p>
              <button
                className="btn-primary"
                onClick={gerar}
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Gerando...' : `Gerar cobranças de ${meses[mes - 1]}`}
              </button>
            </>
          ) : (
            <>
              <p style={{ color: '#276749', fontWeight: '600', marginBottom: '8px' }}>
                {resultado.gerados} cobrança(s) gerada(s) com sucesso
              </p>
              {resultado.erros.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ color: '#744210', fontSize: '13px', marginBottom: '4px' }}>Erros:</p>
                  {resultado.erros.map((e, i) => (
                    <p key={i} style={{ color: '#c05621', fontSize: '13px' }}>• {e}</p>
                  ))}
                </div>
              )}
              <button
                className="btn-primary"
                onClick={() => router.push(`/${slug}/dizimo`)}
                style={{ width: '100%' }}
              >
                Ver cobranças
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
