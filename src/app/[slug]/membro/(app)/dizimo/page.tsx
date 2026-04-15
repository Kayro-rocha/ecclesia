import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import CopiarPix from './CopiarPix'

interface Props { params: Promise<{ slug: string }> }

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

const STATUS_MAP = {
  PAID:    { label: 'Pago',     bg: '#dcfce7', color: '#16a34a', icon: '✓' },
  PENDING: { label: 'Pendente', bg: '#fef9c3', color: '#a16207', icon: '⏳' },
  EXEMPT:  { label: 'Isento',   bg: '#f1f5f9', color: '#64748b', icon: '—' },
}

export default async function MembroDizimoPage({ params }: Props) {
  const { slug } = await params
  const session = await getMembroSession()
  if (!session) redirect(`/${slug}/membro/login`)

  const now = new Date()
  const mesAtual = now.getMonth() + 1
  const anoAtual = now.getFullYear()

  const [member, tithes, church] = await Promise.all([
    prisma.member.findUnique({
      where: { id: session.memberId },
      select: { name: true, suggestedTithe: true, isTither: true },
    }),
    prisma.tithe.findMany({
      where: { memberId: session.memberId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
    prisma.church.findUnique({
      where: { id: session.churchId },
      select: { pixKey: true },
    }),
  ])

  if (!member) redirect(`/${slug}/membro/login`)

  const dizimoMesAtual = tithes.find(t => t.month === mesAtual && t.year === anoAtual)
  const totalPago = tithes.filter(t => t.status === 'PAID').reduce((s, t) => s + t.amount, 0)
  const mesesPagos = tithes.filter(t => t.status === 'PAID').length
  const mesesPendentes = tithes.filter(t => t.status === 'PENDING').length

  const precisaPagar = dizimoMesAtual?.status === 'PENDING' || !dizimoMesAtual

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Dízimo</h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Seu histórico de contribuições</p>
      </div>

      {/* Card do mês atual */}
      <div style={{
        background: dizimoMesAtual?.status === 'PAID'
          ? 'linear-gradient(135deg, #16a34a, #22c55e)'
          : 'linear-gradient(135deg, #d97706, #f59e0b)',
        borderRadius: '20px', padding: '20px', color: 'white',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '13px', opacity: 0.85 }}>
          {MESES[mesAtual - 1]} {anoAtual}
        </p>
        <p style={{ margin: '0 0 2px', fontSize: '24px', fontWeight: '800' }}>
          {dizimoMesAtual?.status === 'PAID' ? '✓ Em dia!' : '⏳ Pendente'}
        </p>
        {dizimoMesAtual && (
          <p style={{ margin: 0, fontSize: '15px', opacity: 0.9 }}>
            R$ {dizimoMesAtual.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        )}
        {!dizimoMesAtual && member.suggestedTithe && (
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.85 }}>
            Sugerido: R$ {member.suggestedTithe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      {/* Resumo stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { label: 'Total pago', value: `R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: '#16a34a' },
          { label: 'Meses pagos', value: String(mesesPagos), color: '#3b82f6' },
          { label: 'Pendentes', value: String(mesesPendentes), color: '#d97706' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: '12px', padding: '12px',
            border: '1px solid #f1f5f9', textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* PIX — só se tiver chave e mês pendente */}
      {church?.pixKey && precisaPagar && (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
            COMO PAGAR
          </p>
          <CopiarPix pixKey={church.pixKey} />
          <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
            Copie a chave e realize o PIX pelo seu banco
          </p>
        </div>
      )}

      {/* Histórico */}
      {tithes.length > 0 && (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>
            HISTÓRICO ({tithes.length})
          </p>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            {tithes.map((t, i) => {
              const s = STATUS_MAP[t.status as keyof typeof STATUS_MAP] || STATUS_MAP.PENDING
              const isCurrent = t.month === mesAtual && t.year === anoAtual
              return (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: i < tithes.length - 1 ? '1px solid #f8fafc' : 'none',
                  background: isCurrent ? '#fafffe' : 'white',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: s.bg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: s.color,
                    }}>
                      {s.icon}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                        {MESES[t.month - 1]} {t.year}
                        {isCurrent && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#3b82f6', fontWeight: '700' }}>ATUAL</span>}
                      </p>
                      {t.paidAt && (
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                          Pago em {new Date(t.paidAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                      R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '2px 7px',
                      borderRadius: '20px', background: s.bg, color: s.color,
                    }}>
                      {s.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tithes.length === 0 && (
        <div style={{
          padding: '40px 20px', textAlign: 'center',
          background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9',
        }}>
          <span style={{ fontSize: '36px' }}>💰</span>
          <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Nenhum registro de dízimo ainda.
          </p>
        </div>
      )}
    </div>
  )
}
