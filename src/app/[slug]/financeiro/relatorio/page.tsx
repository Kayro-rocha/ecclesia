import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

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
  TITHE: 'Dízimo (PIX)',
  OFFERING: 'Ofertas (PIX)',
  DONATION: 'Doações',
  EVENT: 'Renda de Evento',
  OTHER: 'Outros',
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function RelatorioPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { month, year } = await searchParams

  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const now = new Date()
  const m = month ? parseInt(month) : now.getMonth() + 1
  const y = year ? parseInt(year) : now.getFullYear()

  const startDate = new Date(y, m - 1, 1)
  const endDate = new Date(y, m, 0, 23, 59, 59)

  const [tithes, offerings, incomesManual, expenses] = await Promise.all([
    prisma.tithe.findMany({ where: { churchId: church.id, status: 'PAID', paidAt: { gte: startDate, lte: endDate } } }),
    prisma.offering.findMany({ where: { churchId: church.id, createdAt: { gte: startDate, lte: endDate } } }),
    prisma.incomeManual.findMany({ where: { churchId: church.id, date: { gte: startDate, lte: endDate } } }),
    prisma.expense.findMany({ where: { churchId: church.id, date: { gte: startDate, lte: endDate } }, orderBy: { category: 'asc' } }),
  ])

  const totalTithes = tithes.reduce((s, t) => s + t.amount, 0)
  const totalOfferings = offerings.reduce((s, o) => s + o.amount, 0)

  const incomesByCategory: Record<string, number> = { TITHE: totalTithes, OFFERING: totalOfferings }
  for (const i of incomesManual) {
    incomesByCategory[i.category] = (incomesByCategory[i.category] || 0) + i.amount
  }

  const expensesByCategory: Record<string, number> = {}
  for (const e of expenses) {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount
  }

  const totalReceitas = Object.values(incomesByCategory).reduce((s, v) => s + v, 0)
  const totalDespesas = Object.values(expensesByCategory).reduce((s, v) => s + v, 0)
  const resultado = totalReceitas - totalDespesas
  const positivo = resultado >= 0

  const geradoEm = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 40px' }} className="page">

      {/* Botões — somem na impressão */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          id="btn-print"
          style={{ padding: '10px 24px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
        >
          🖨 Imprimir / Salvar PDF
        </button>
        <button
          id="btn-close"
          style={{ padding: '10px 24px', background: 'white', color: '#1a1a2e', border: '1.5px solid #1a1a2e', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
        >
          ✕ Fechar
        </button>
      </div>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '20px', borderBottom: '3px solid #1a1a2e' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Demonstrativo de Resultado</h1>
          <p style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>{church.name}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: '700', fontSize: '15px' }}>{MONTHS[m - 1]} {y}</p>
          <p style={{ fontSize: '12px', color: '#a0aec0' }}>Gerado em {geradoEm}</p>
        </div>
      </div>

      {/* Receitas */}
      <p style={{ fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#276749', marginBottom: '8px', paddingBottom: '4px', borderBottom: '2px solid #276749' }}>
        Receitas
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <tbody>
          {Object.entries(incomesByCategory).filter(([, v]) => v > 0).map(([cat, val]) => (
            <tr key={cat}>
              <td style={{ padding: '7px 0', borderBottom: '1px solid #f0f0f0', color: '#4a5568' }}>{INCOME_LABELS[cat] || cat}</td>
              <td style={{ padding: '7px 0', borderBottom: '1px solid #f0f0f0', textAlign: 'right', color: '#276749' }}>{fmt(val)}</td>
            </tr>
          ))}
          {totalReceitas === 0 && (
            <tr><td colSpan={2} style={{ padding: '7px 0', color: '#a0aec0', fontStyle: 'italic' }}>Nenhuma receita registrada</td></tr>
          )}
          <tr>
            <td style={{ padding: '10px 0 0', fontWeight: '700', borderTop: '2px solid #1a1a2e' }}>Total de Receitas</td>
            <td style={{ padding: '10px 0 0', textAlign: 'right', fontWeight: '700', fontSize: '14px', color: '#276749', borderTop: '2px solid #1a1a2e' }}>{fmt(totalReceitas)}</td>
          </tr>
        </tbody>
      </table>

      {/* Despesas */}
      <p style={{ fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#742a2a', marginBottom: '8px', paddingBottom: '4px', borderBottom: '2px solid #742a2a' }}>
        Despesas
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <tbody>
          {Object.entries(expensesByCategory).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).map(([cat, val]) => (
            <tr key={cat}>
              <td style={{ padding: '7px 0', borderBottom: '1px solid #f0f0f0', color: '#4a5568' }}>{EXPENSE_LABELS[cat] || cat}</td>
              <td style={{ padding: '7px 0', borderBottom: '1px solid #f0f0f0', textAlign: 'right', color: '#742a2a' }}>{fmt(val)}</td>
            </tr>
          ))}
          {totalDespesas === 0 && (
            <tr><td colSpan={2} style={{ padding: '7px 0', color: '#a0aec0', fontStyle: 'italic' }}>Nenhuma despesa registrada</td></tr>
          )}
          <tr>
            <td style={{ padding: '10px 0 0', fontWeight: '700', borderTop: '2px solid #1a1a2e' }}>Total de Despesas</td>
            <td style={{ padding: '10px 0 0', textAlign: 'right', fontWeight: '700', fontSize: '14px', color: '#742a2a', borderTop: '2px solid #1a1a2e' }}>{fmt(totalDespesas)}</td>
          </tr>
        </tbody>
      </table>

      {/* Resultado */}
      <div style={{
        padding: '16px 20px', borderRadius: '6px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: positivo ? '#f0fff4' : '#fff5f5',
        border: `1px solid ${positivo ? '#c6f6d5' : '#fed7d7'}`,
        marginBottom: '32px',
      }}>
        <span style={{ fontWeight: '700', fontSize: '14px', color: positivo ? '#276749' : '#742a2a' }}>
          {positivo ? 'SUPERÁVIT' : 'DÉFICIT'}
        </span>
        <span style={{ fontWeight: '700', fontSize: '20px', color: positivo ? '#276749' : '#742a2a' }}>
          {fmt(Math.abs(resultado))}
        </span>
      </div>

      {/* Detalhamento linha a linha */}
      {expenses.length > 0 && (
        <>
          <p style={{ fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4a5568', marginBottom: '8px', paddingBottom: '4px', borderBottom: '2px solid #4a5568' }}>
            Detalhamento de Despesas
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#4a5568' }}>
                    {e.description}
                    {e.isRecurring && <span style={{ fontSize: '10px', color: '#a0aec0', marginLeft: '6px' }}>(fixo)</span>}
                  </td>
                  <td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>{fmt(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Rodapé */}
      <div style={{ marginTop: '48px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a0aec0' }}>
        <span>{church.name} · Sistema Ecclesia</span>
        <span>{MONTHS[m - 1]} {y}</span>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('btn-print').addEventListener('click', function() { window.print(); });
          document.getElementById('btn-close').addEventListener('click', function() { window.close(); });
        `
      }} />
    </div>
  )
}
