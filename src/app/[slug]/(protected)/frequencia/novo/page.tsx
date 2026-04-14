'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Member = { id: string; name: string; group: string | null }

const TIPOS_CULTO = [
  'Culto Dominical',
  'Culto de Quarta',
  'Reunião de Oração',
  'Culto de Jovens',
  'Escola Bíblica',
  'Culto de Louvor',
]

export default function NovaFrequenciaPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params?.slug as string

  const dataParam = searchParams.get('data') || new Date().toISOString().split('T')[0]
  const tipoParam = searchParams.get('tipo') || ''

  const [data, setData] = useState(dataParam)
  const [tipo, setTipo] = useState(tipoParam)
  const [tipoCustom, setTipoCustom] = useState(!TIPOS_CULTO.includes(tipoParam) && tipoParam ? tipoParam : '')
  const [usarCustom, setUsarCustom] = useState(!TIPOS_CULTO.includes(tipoParam) && !!tipoParam)

  const [membros, setMembros] = useState<Member[]>([])
  const [presentes, setPresentes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch(`/api/members?slug=${slug}&limit=500`)
      .then(r => r.json())
      .then(async (data) => {
        const lista: Member[] = Array.isArray(data) ? data : []
        setMembros(lista)

        // Se for edição (data+tipo na URL), carrega quem já estava presente
        if (dataParam && tipoParam) {
          const res = await fetch(`/api/attendance?slug=${slug}`)
          const eventos = await res.json()
          const evento = eventos.find((e: any) =>
            e.date === dataParam && e.type === tipoParam
          )
          if (evento?.memberNames) {
            const ids = new Set(
              lista.filter(m => evento.memberNames.includes(m.name)).map(m => m.id)
            )
            setPresentes(ids as Set<string>)
          }
        }
        setLoading(false)
      })
  }, [slug, dataParam, tipoParam])

  function toggleMembro(id: string) {
    setPresentes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTodos() {
    const filtrados = membrosFiltrados.map(m => m.id)
    const todosMarcados = filtrados.every(id => presentes.has(id))
    setPresentes(prev => {
      const next = new Set(prev)
      if (todosMarcados) filtrados.forEach(id => next.delete(id))
      else filtrados.forEach(id => next.add(id))
      return next
    })
  }

  const tipoFinal = usarCustom ? tipoCustom : tipo
  const membrosFiltrados = membros.filter(m =>
    m.name.toLowerCase().includes(busca.toLowerCase())
  )

  const grupos = Array.from(new Set(membros.map(m => m.group || 'Geral'))).sort()

  async function handleSave() {
    if (!data || !tipoFinal) { alert('Selecione a data e o tipo de culto.'); return }
    if (presentes.size === 0) { alert('Marque ao menos um membro presente.'); return }
    setSalvando(true)
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, date: data, type: tipoFinal, memberIds: Array.from(presentes) }),
    })
    setSalvando(false)
    if (res.ok) router.push(`/${slug}/frequencia`)
  }

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <p style={{ color: '#a0aec0', fontSize: '14px' }}>Carregando membros...</p>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/frequencia`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Frequência</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>
            {tipoParam ? 'Editar presença' : 'Registrar culto'}
          </span>
        </div>
        <button onClick={handleSave} disabled={salvando} className="btn-primary">
          {salvando ? 'Salvando...' : `Salvar — ${presentes.size} presente(s)`}
        </button>
      </div>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* Painel esquerdo — dados do culto */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>Dados do culto</h2>

          <div>
            <label>Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} />
          </div>

          <div>
            <label>Tipo de culto</label>
            {!usarCustom ? (
              <select value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="">Selecione...</option>
                {TIPOS_CULTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <input
                value={tipoCustom}
                onChange={e => setTipoCustom(e.target.value)}
                placeholder="Nome do culto/evento"
              />
            )}
            <button
              type="button"
              onClick={() => { setUsarCustom(!usarCustom); setTipoCustom(''); setTipo('') }}
              style={{ background: 'none', border: 'none', color: '#4299e1', fontSize: '12px', cursor: 'pointer', marginTop: '6px', padding: 0 }}
            >
              {usarCustom ? '← Usar lista padrão' : '+ Digitar outro tipo'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '12px' }}>
            <div style={{ fontSize: '13px', color: '#718096' }}>
              <strong style={{ color: '#1a1a2e' }}>{presentes.size}</strong> de <strong style={{ color: '#1a1a2e' }}>{membros.length}</strong> membros presentes
            </div>
            {membros.length > 0 && (
              <div style={{ marginTop: '8px', height: '6px', background: '#edf2f7', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((presentes.size / membros.length) * 100)}%`,
                  background: '#48bb78', borderRadius: '3px', transition: 'width 0.3s'
                }} />
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
              {membros.length > 0 ? Math.round((presentes.size / membros.length) * 100) : 0}% de presença
            </div>
          </div>
        </div>

        {/* Painel direito — lista de membros */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #edf2f7', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar membro..."
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={toggleTodos}
              className="btn-secondary"
              style={{ whiteSpace: 'nowrap', fontSize: '13px' }}
            >
              {membrosFiltrados.every(m => presentes.has(m.id)) ? 'Desmarcar todos' : 'Marcar todos'}
            </button>
          </div>

          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {grupos.map(grupo => {
              const membrosGrupo = membrosFiltrados.filter(m => (m.group || 'Geral') === grupo)
              if (membrosGrupo.length === 0) return null
              return (
                <div key={grupo}>
                  <div style={{ padding: '8px 20px', background: '#f7fafc', fontSize: '11px', fontWeight: '600', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {grupo}
                  </div>
                  {membrosGrupo.map(m => (
                    <div
                      key={m.id}
                      onClick={() => toggleMembro(m.id)}
                      style={{
                        padding: '12px 20px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        cursor: 'pointer', borderBottom: '1px solid #f7fafc',
                        background: presentes.has(m.id) ? '#f0fff4' : 'white',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
                        background: presentes.has(m.id) ? '#48bb78' : 'white',
                        border: `2px solid ${presentes.has(m.id) ? '#48bb78' : '#e2e8f0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {presentes.has(m.id) && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: '14px', color: '#1a1a2e', fontWeight: presentes.has(m.id) ? '500' : '400' }}>
                        {m.name}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}
            {membrosFiltrados.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: '#a0aec0', fontSize: '14px' }}>
                Nenhum membro encontrado.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
