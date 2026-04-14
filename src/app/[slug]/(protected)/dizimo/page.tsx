import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ mes?: string; ano?: string }>
}

export default async function DizimoPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { mes, ano } = await searchParams

  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const hoje = new Date()
  const mesAtual = mes ? parseInt(mes) : hoje.getMonth() + 1
  const anoAtual = ano ? parseInt(ano) : hoje.getFullYear()

  const meses = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ]

  const dizimos = await prisma.tithe.findMany({
    where: {
      churchId: church.id,
      month: mesAtual,
      year: anoAtual,
    },
    include: { member: true },
    orderBy: { member: { name: 'asc' } },
  })

  const membrosdizimistas = await prisma.member.findMany({
    where: { churchId: church.id, isTither: true, active: true },
    orderBy: { name: 'asc' },
  })

  const totalArrecadado = dizimos
    .filter(d => d.status === 'PAID')
    .reduce((acc, d) => acc + d.amount, 0)

  const totalPagos = dizimos.filter(d => d.status === 'PAID').length
  const totalPendentes = dizimos.filter(d => d.status === 'PENDING').length

  const statusLabel: Record<string, string> = {
    PAID: 'Pago',
    PENDING: 'Pendente',
    EXEMPT: 'Isento',
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/dashboard`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Painel</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Dízimo</span>
        </div>
      </div>

      <div className="page-content">
        <form method="GET" style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <select name="mes" defaultValue={mesAtual} style={{ width: '160px' }}>
            {meses.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select name="ano" defaultValue={anoAtual} style={{ width: '100px' }}>
            {[2024, 2025, 2026].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">Ver</button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="card">
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '6px' }}>Total arrecadado</p>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a2e' }}>
              R$ {totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="card">
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '6px' }}>Pagos</p>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#276749' }}>{totalPagos}</p>
          </div>
          <div className="card">
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '6px' }}>Pendentes</p>
            <p style={{ fontSize: '24px', fontWeight: '600', color: '#744210' }}>{totalPendentes}</p>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>
              {meses[mesAtual - 1]} {anoAtual}
            </span>
            <Link href={`/${slug}/dizimo/gerar?mes=${mesAtual}&ano=${anoAtual}`} className="btn-primary">
              Gerar cobranças do mês
            </Link>
          </div>

          {dizimos.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '8px' }}>Nenhuma cobrança gerada para este mês</p>
              <p style={{ color: '#cbd5e0', fontSize: '13px' }}>
                Clique em &quot;Gerar cobranças do mês&quot; para criar os PIX de todos os {membrosdizimistas.length} dizimistas
              </p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Membro</th>
                  <th>Valor</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {dizimos.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'var(--primary-light)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: 'var(--primary)', fontSize: '13px', fontWeight: '600', flexShrink: 0,
                        }}>
                          {d.member.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: '500' }}>{d.member.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#718096' }}>
                      R$ {d.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ color: '#a0aec0' }}>
                      {d.paidAt ? new Date(d.paidAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      {d.status === 'PAID' && <span className="badge-green">{statusLabel[d.status]}</span>}
                      {d.status === 'PENDING' && <span className="badge-yellow">{statusLabel[d.status]}</span>}
                      {d.status === 'EXEMPT' && <span className="badge-gray">{statusLabel[d.status]}</span>}
                    </td>
                    <td>
                      {d.status === 'PENDING' && (
                        <button style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          Reenviar PIX
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
