'use client'

import { useState, useEffect, useCallback } from 'react'

const EXPENSE_LABELS: Record<string, string> = {
  INFRASTRUCTURE: 'Infraestrutura / Aluguel',
  UTILITIES: 'Água / Luz / Internet',
  SALARIES: 'Salários / Honorários',
  EVENTS: 'Eventos',
  MISSIONS: 'Missões / Ações Sociais',
  MAINTENANCE: 'Manutenção',
  SUPPLIES: 'Material / Escritório',
  OTHER: 'Outros',
}

const INCOME_LABELS: Record<string, string> = {
  TITHE: 'Dízimo',
  OFFERING: 'Oferta de Coleta',
  DONATION: 'Doação',
  EVENT: 'Renda de Evento',
  OTHER: 'Outros',
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface Summary {
  totalReceitas: number
  totalDespesas: number
  resultado: number
  expensesByCategory: Record<string, number>
  incomesByCategory: Record<string, number>
  history: { month: number; year: number; receitas: number; despesas: number }[]
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  isRecurring: boolean
  date: string
}

interface Income {
  id: string
  description: string
  amount: number
  category: string
  date: string
}

interface ReceitaItem {
  id: string
  description: string
  category: string
  categoryLabel: string
  amount: number
  date: string
  isFromTithe: boolean
}

interface Props {
  slug: string
}

export default function FinanceiroClient({ slug }: Props) {
  const now = new Date()
  const [tab, setTab] = useState<'geral' | 'receitas' | 'despesas' | 'relatorio'>('geral')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [summary, setSummary] = useState<Summary | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [receitas, setReceitas] = useState<ReceitaItem[]>([])

  const [loadingSummary, setLoadingSummary] = useState(true)

  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true)
    const res = await fetch(`/api/financial/summary?slug=${slug}&month=${month}&year=${year}`)
    const data = await res.json()
    setSummary(data)
    setLoadingSummary(false)
  }, [slug, month, year])

  const fetchExpenses = useCallback(async () => {
    const res = await fetch(`/api/expenses?slug=${slug}&month=${month}&year=${year}`)
    const data = await res.json()
    setExpenses(data)
  }, [slug, month, year])

  const fetchIncomes = useCallback(async () => {
    const res = await fetch(`/api/incomes?slug=${slug}&month=${month}&year=${year}`)
    const data = await res.json()
    setIncomes(data)
  }, [slug, month, year])

  const fetchReceitas = useCallback(async () => {
    const res = await fetch(`/api/financial/receitas?slug=${slug}&month=${month}&year=${year}`)
    const data = await res.json()
    setReceitas(data)
  }, [slug, month, year])

  const generateRecurring = useCallback(async () => {
    const res = await fetch('/api/financial/generate-recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, month, year }),
    })
    const data = await res.json()
    return data.generated as number
  }, [slug, month, year])

  useEffect(() => {
    const load = async () => {
      const generated = await generateRecurring()
      fetchSummary()
      fetchExpenses()
      fetchIncomes()
      fetchReceitas()
      if (generated > 0) {
        const msg = document.createElement('div')
        msg.textContent = `${generated} despesa${generated > 1 ? 's' : ''} fixa${generated > 1 ? 's' : ''} gerada${generated > 1 ? 's' : ''} automaticamente`
        Object.assign(msg.style, {
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', color: 'white', padding: '10px 20px',
          borderRadius: '8px', fontSize: '13px', zIndex: '9999',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        })
        document.body.appendChild(msg)
        setTimeout(() => msg.remove(), 4000)
      }
    }
    load()
  }, [generateRecurring, fetchSummary, fetchExpenses, fetchIncomes, fetchReceitas])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('Excluir esta despesa?')) return
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    fetchExpenses()
    fetchSummary()
  }

  const deleteIncome = async (id: string) => {
    if (!confirm('Excluir esta receita?')) return
    await fetch(`/api/incomes/${id}`, { method: 'DELETE' })
    fetchIncomes()
    fetchReceitas()
    fetchSummary()
  }

  const TAB_STYLE = (active: boolean) => ({
    padding: '8px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? '600' : '400',
    background: active ? 'var(--primary)' : 'transparent',
    color: active ? 'white' : '#718096',
    transition: 'all 0.15s',
  } as React.CSSProperties)

  const resultadoPositivo = (summary?.resultado ?? 0) >= 0

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Financeiro</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f7fafc', borderRadius: '8px', padding: '4px 8px' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '16px', padding: '2px 6px' }}>‹</button>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e', minWidth: '130px', textAlign: 'center' }}>
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '16px', padding: '2px 6px' }}>›</button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Cards resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ borderLeft: '4px solid #48bb78' }}>
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '6px' }}>Receitas do mês</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#276749' }}>
              {loadingSummary ? '...' : fmt(summary?.totalReceitas ?? 0)}
            </p>
            <p style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }}>Dízimo + Ofertas + Doações</p>
          </div>
          <div className="card" style={{ borderLeft: '4px solid #fc8181' }}>
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '6px' }}>Despesas do mês</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#742a2a' }}>
              {loadingSummary ? '...' : fmt(summary?.totalDespesas ?? 0)}
            </p>
            <p style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }}>Total de gastos registrados</p>
          </div>
          <div className="card" style={{ borderLeft: `4px solid ${resultadoPositivo ? '#48bb78' : '#fc8181'}` }}>
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '6px' }}>Resultado</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: resultadoPositivo ? '#276749' : '#742a2a' }}>
              {loadingSummary ? '...' : fmt(summary?.resultado ?? 0)}
            </p>
            <p style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }}>
              {resultadoPositivo ? 'Superávit' : 'Déficit'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#f7fafc', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
          {([
            ['geral', 'Visão Geral'],
            ['receitas', 'Receitas'],
            ['despesas', 'Despesas'],
            ['relatorio', 'Relatório'],
          ] as const).map(([key, label]) => (
            <button key={key} style={TAB_STYLE(tab === key)} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* TAB: VISÃO GERAL */}
        {tab === 'geral' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card">
              <p style={{ fontWeight: '600', marginBottom: '16px', color: '#1a1a2e' }}>Receitas por origem</p>
              {loadingSummary ? <p style={{ color: '#a0aec0' }}>Carregando...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {summary && Object.entries(summary.incomesByCategory)
                    .filter(([, v]) => v > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, val]) => {
                      const pct = summary.totalReceitas > 0 ? (val / summary.totalReceitas) * 100 : 0
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', color: '#4a5568' }}>{INCOME_LABELS[cat] || cat}</span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#276749' }}>{fmt(val)}</span>
                          </div>
                          <div style={{ height: '6px', background: '#f0fff4', borderRadius: '3px' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: '#48bb78', borderRadius: '3px' }} />
                          </div>
                        </div>
                      )
                    })}
                  {(!summary || summary.totalReceitas === 0) && (
                    <p style={{ color: '#a0aec0', fontSize: '13px' }}>Nenhuma receita registrada</p>
                  )}
                </div>
              )}
            </div>

            <div className="card">
              <p style={{ fontWeight: '600', marginBottom: '16px', color: '#1a1a2e' }}>Despesas por categoria</p>
              {loadingSummary ? <p style={{ color: '#a0aec0' }}>Carregando...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {summary && Object.entries(summary.expensesByCategory)
                    .filter(([, v]) => v > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, val]) => {
                      const pct = summary.totalDespesas > 0 ? (val / summary.totalDespesas) * 100 : 0
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', color: '#4a5568' }}>{EXPENSE_LABELS[cat] || cat}</span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#742a2a' }}>{fmt(val)}</span>
                          </div>
                          <div style={{ height: '6px', background: '#fff5f5', borderRadius: '3px' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: '#fc8181', borderRadius: '3px' }} />
                          </div>
                        </div>
                      )
                    })}
                  {(!summary || summary.totalDespesas === 0) && (
                    <p style={{ color: '#a0aec0', fontSize: '13px' }}>Nenhuma despesa registrada</p>
                  )}
                </div>
              )}
            </div>

            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontWeight: '600', marginBottom: '16px', color: '#1a1a2e' }}>Histórico — últimos 6 meses</p>
              {loadingSummary ? <p style={{ color: '#a0aec0' }}>Carregando...</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Mês</th>
                        <th style={{ textAlign: 'right' }}>Receitas</th>
                        <th style={{ textAlign: 'right' }}>Despesas</th>
                        <th style={{ textAlign: 'right' }}>Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary?.history.map((h) => {
                        const res = h.receitas - h.despesas
                        return (
                          <tr key={`${h.year}-${h.month}`}>
                            <td>{MONTHS[h.month - 1]} {h.year}</td>
                            <td style={{ textAlign: 'right', color: '#276749', fontWeight: '500' }}>{fmt(h.receitas)}</td>
                            <td style={{ textAlign: 'right', color: '#742a2a', fontWeight: '500' }}>{fmt(h.despesas)}</td>
                            <td style={{ textAlign: 'right', fontWeight: '600', color: res >= 0 ? '#276749' : '#742a2a' }}>{fmt(res)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: RECEITAS */}
        {tab === 'receitas' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ color: '#718096', fontSize: '13px' }}>
                {receitas.length} entrada{receitas.length !== 1 ? 's' : ''}
              </p>
              <button className="btn-primary" onClick={() => { setEditingIncome(null); setShowIncomeModal(true) }}>
                + Lançar receita
              </button>
            </div>

            {receitas.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <p style={{ color: '#a0aec0', fontSize: '14px' }}>Nenhuma receita neste mês</p>
                <p style={{ color: '#cbd5e0', fontSize: '12px', marginTop: '4px' }}>
                  Dízimos marcados como pagos e lançamentos manuais aparecem aqui
                </p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Data</th>
                      <th style={{ textAlign: 'right' }}>Valor</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {receitas.map((r) => (
                      <tr key={r.id}>
                        <td>{r.description}</td>
                        <td>
                          <span className={r.category === 'TITHE' ? 'badge-blue' : r.category === 'OFFERING' ? 'badge-green' : 'badge-gray'}>
                            {r.categoryLabel}
                          </span>
                        </td>
                        <td style={{ color: '#718096' }}>
                          {new Date(r.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: '#276749' }}>{fmt(r.amount)}</td>
                        <td>
                          {!r.isFromTithe && (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button onClick={() => {
                                const income = incomes.find((i) => i.id === r.id)
                                if (income) { setEditingIncome(income); setShowIncomeModal(true) }
                              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '13px' }}>Editar</button>
                              <button onClick={() => deleteIncome(r.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fc8181', fontSize: '13px' }}>Excluir</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: DESPESAS */}
        {tab === 'despesas' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ color: '#718096', fontSize: '13px' }}>
                {expenses.filter((e) => e.isRecurring).length} fixas · {expenses.filter((e) => !e.isRecurring).length} avulsas
              </p>
              <button className="btn-primary" onClick={() => { setEditingExpense(null); setShowExpenseModal(true) }}>
                + Lançar despesa
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <p style={{ color: '#a0aec0', fontSize: '14px' }}>Nenhuma despesa registrada neste mês</p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th>Data</th>
                      <th style={{ textAlign: 'right' }}>Valor</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td>{e.description}</td>
                        <td><span className="badge-red">{EXPENSE_LABELS[e.category] || e.category}</span></td>
                        <td>
                          {e.isRecurring
                            ? <span className="badge-blue">Fixo</span>
                            : <span className="badge-gray">Avulso</span>}
                        </td>
                        <td style={{ color: '#718096' }}>{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: '#742a2a' }}>{fmt(e.amount)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setEditingExpense(e); setShowExpenseModal(true) }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '13px' }}>Editar</button>
                            <button onClick={() => deleteExpense(e.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fc8181', fontSize: '13px' }}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: RELATÓRIO */}
        {tab === 'relatorio' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <p style={{ fontWeight: '700', fontSize: '16px', color: '#1a1a2e' }}>DRE — Demonstrativo de Resultado</p>
                <p style={{ color: '#718096', fontSize: '13px' }}>{MONTHS[month - 1]} {year}</p>
              </div>
              <a href={`/${slug}/financeiro/relatorio?month=${month}&year=${year}`} target="_blank" className="btn-secondary" style={{ textDecoration: 'none' }}>
                🖨 Imprimir / Exportar PDF
              </a>
            </div>

            {loadingSummary ? <p style={{ color: '#a0aec0' }}>Carregando...</p> : summary && (
              <div>
                <p style={{ fontWeight: '600', color: '#276749', marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  RECEITAS
                </p>
                <table style={{ marginBottom: '16px' }}>
                  <tbody>
                    {Object.entries(summary.incomesByCategory)
                      .filter(([, v]) => v > 0)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, val]) => (
                        <tr key={cat}>
                          <td style={{ color: '#4a5568' }}>{INCOME_LABELS[cat] || cat}</td>
                          <td style={{ textAlign: 'right', color: '#276749' }}>{fmt(val)}</td>
                        </tr>
                      ))}
                    {summary.totalReceitas === 0 && (
                      <tr><td colSpan={2} style={{ color: '#a0aec0', fontSize: '13px' }}>Nenhuma receita</td></tr>
                    )}
                    <tr style={{ borderTop: '2px solid #edf2f7' }}>
                      <td style={{ fontWeight: '700' }}>Total Receitas</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#276749', fontSize: '16px' }}>{fmt(summary.totalReceitas)}</td>
                    </tr>
                  </tbody>
                </table>

                <p style={{ fontWeight: '600', color: '#742a2a', marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  DESPESAS
                </p>
                <table style={{ marginBottom: '16px' }}>
                  <tbody>
                    {Object.entries(summary.expensesByCategory)
                      .filter(([, v]) => v > 0)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, val]) => (
                        <tr key={cat}>
                          <td style={{ color: '#4a5568' }}>{EXPENSE_LABELS[cat] || cat}</td>
                          <td style={{ textAlign: 'right', color: '#742a2a' }}>{fmt(val)}</td>
                        </tr>
                      ))}
                    {summary.totalDespesas === 0 && (
                      <tr><td colSpan={2} style={{ color: '#a0aec0', fontSize: '13px' }}>Nenhuma despesa</td></tr>
                    )}
                    <tr style={{ borderTop: '2px solid #edf2f7' }}>
                      <td style={{ fontWeight: '700' }}>Total Despesas</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#742a2a', fontSize: '16px' }}>{fmt(summary.totalDespesas)}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{
                  background: resultadoPositivo ? '#f0fff4' : '#fff5f5',
                  border: `1px solid ${resultadoPositivo ? '#c6f6d5' : '#fed7d7'}`,
                  borderRadius: '8px', padding: '16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: resultadoPositivo ? '#276749' : '#742a2a' }}>
                    {resultadoPositivo ? 'SUPERÁVIT' : 'DÉFICIT'}
                  </span>
                  <span style={{ fontWeight: '700', fontSize: '22px', color: resultadoPositivo ? '#276749' : '#742a2a' }}>
                    {fmt(Math.abs(summary.resultado))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showExpenseModal && (
        <ExpenseModal
          slug={slug}
          editing={editingExpense}
          month={month}
          year={year}
          onClose={() => setShowExpenseModal(false)}
          onSave={() => { fetchExpenses(); fetchSummary(); setShowExpenseModal(false) }}
        />
      )}

      {showIncomeModal && (
        <IncomeModal
          slug={slug}
          editing={editingIncome}
          month={month}
          year={year}
          onClose={() => setShowIncomeModal(false)}
          onSave={() => { fetchIncomes(); fetchReceitas(); fetchSummary(); setShowIncomeModal(false) }}
        />
      )}
    </div>
  )
}

function ExpenseModal({ slug, editing, month, year, onClose, onSave }: {
  slug: string
  editing: Expense | null
  month: number
  year: number
  onClose: () => void
  onSave: () => void
}) {
  const defaultDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const [description, setDescription] = useState(editing?.description || '')
  const [amount, setAmount] = useState(editing?.amount?.toString() || '')
  const [category, setCategory] = useState(editing?.category || 'UTILITIES')
  const [isRecurring, setIsRecurring] = useState(editing?.isRecurring || false)
  const [date, setDate] = useState(editing?.date?.slice(0, 10) || defaultDate)
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    const url = editing ? `/api/expenses/${editing.id}` : '/api/expenses'
    const method = editing ? 'PUT' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, description, amount, category, isRecurring, date }),
    })
    setLoading(false)
    onSave()
  }

  return (
    <Modal title={editing ? 'Editar despesa' : 'Nova despesa'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div><label>Descrição</label><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Conta de luz" /></div>
        <div><label>Valor (R$)</label><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></div>
        <div>
          <label>Categoria</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(EXPENSE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label>Data</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
          <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)}
            style={{ width: 'auto', accentColor: 'var(--primary)' }} />
          Gasto fixo (recorrente)
        </label>
        <button className="btn-primary" onClick={save} disabled={loading || !description || !amount}>
          {loading ? 'Salvando...' : editing ? 'Salvar alterações' : 'Adicionar despesa'}
        </button>
      </div>
    </Modal>
  )
}

function IncomeModal({ slug, editing, month, year, onClose, onSave }: {
  slug: string
  editing: Income | null
  month: number
  year: number
  onClose: () => void
  onSave: () => void
}) {
  const defaultDate = `${year}-${String(month).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const [description, setDescription] = useState(editing?.description || '')
  const [amount, setAmount] = useState(editing?.amount?.toString() || '')
  const [category, setCategory] = useState(editing?.category || 'OFFERING')
  const [date, setDate] = useState(editing?.date?.slice(0, 10) || defaultDate)
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    const url = editing ? `/api/incomes/${editing.id}` : '/api/incomes'
    const method = editing ? 'PUT' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, description, amount, category, date }),
    })
    setLoading(false)
    onSave()
  }

  return (
    <Modal title={editing ? 'Editar receita' : 'Lançar receita'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div><label>Descrição</label><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Coleta culto domingo" /></div>
        <div><label>Valor (R$)</label><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></div>
        <div>
          <label>Categoria</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(INCOME_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label>Data</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <button className="btn-primary" onClick={save} disabled={loading || !description || !amount}>
          {loading ? 'Salvando...' : editing ? 'Salvar alterações' : 'Lançar receita'}
        </button>
      </div>
    </Modal>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p style={{ fontWeight: '700', fontSize: '16px', color: '#1a1a2e' }}>{title}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: '20px' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
