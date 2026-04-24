import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import { prisma } from '@/lib/prisma'
import CopiarPix from './CopiarPix'

export const metadata = { title: 'Dízimo' }


interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ano?: string }>
}

const MESES = [
  'Jan','Fev','Mar','Abr','Mai','Jun',
  'Jul','Ago','Set','Out','Nov','Dez',
]
const MESES_FULL = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

const STATUS_MAP = {
  PAID:    { label: 'Pago',     bg: '#dcfce7', color: '#16a34a', icon: '✓' },
  PENDING: { label: 'Pendente', bg: '#fef9c3', color: '#a16207', icon: '⏳' },
  EXEMPT:  { label: 'Isento',   bg: '#f1f5f9', color: '#64748b', icon: '—' },
}

export default async function MembroDizimoPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { ano: anoParam } = await searchParams
  const session = await getMembroSession()
  if (!session) redirect(`/${slug}/membro/login`)

  const now = new Date()
  const mesAtual = now.getMonth() + 1
  const anoAtual = now.getFullYear()
  const anoFiltro = anoParam ? parseInt(anoParam) : anoAtual

  const [member, tithesAll, church] = await Promise.all([
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

  const dizimoMesAtual = tithesAll.find(t => t.month === mesAtual && t.year === anoAtual)
  const precisaPagar = dizimoMesAtual?.status === 'PENDING' || !dizimoMesAtual

  // Anos com registros
  const anosComRegistro = [...new Set(tithesAll.map(t => t.year))].sort((a, b) => b - a)

  // Tithes do ano selecionado
  const tithesAno = tithesAll.filter(t => t.year === anoFiltro)

  // Stats globais
  const totalPago     = tithesAll.filter(t => t.status === 'PAID').reduce((s, t) => s + t.amount, 0)
  const mesesPagos    = tithesAll.filter(t => t.status === 'PAID').length
  const mesesPendentes = tithesAll.filter(t => t.status === 'PENDING').length

  // Streak: meses consecutivos pagos até o mais recente
  let streak = 0
  const sorted = [...tithesAll].sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  )
  for (const t of sorted) {
    if (t.status === 'PAID') streak++
    else break
  }

  // Grade 12 meses do ano selecionado
  const grade = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const tithe = tithesAno.find(t => t.month === m)
    const isFuture = anoFiltro === anoAtual && m > mesAtual
    return { mes: m, tithe, isFuture }
  })

  // Total do ano selecionado
  const totalAno = tithesAno.filter(t => t.status === 'PAID').reduce((s, t) => s + t.amount, 0)
  const pagosAno = tithesAno.filter(t => t.status === 'PAID').length

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Dízimo</h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Seu histórico de contribuições</p>
      </div>

      {/* ── Card mês atual ───────────────────────────────────────────── */}
      <div style={{
        background: dizimoMesAtual?.status === 'PAID'
          ? 'linear-gradient(135deg, #16a34a, #22c55e)'
          : 'linear-gradient(135deg, #d97706, #f59e0b)',
        borderRadius: '20px', padding: '20px', color: 'white',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '13px', opacity: 0.85 }}>
          {MESES_FULL[mesAtual - 1]} {anoAtual}
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
        {streak >= 2 && (
          <p style={{ margin: '10px 0 0', fontSize: '13px', opacity: 0.95, fontWeight: '600' }}>
            🔥 {streak} meses consecutivos em dia!
          </p>
        )}
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { label: 'Total pago',   value: `R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: '#16a34a' },
          { label: 'Meses pagos',  value: String(mesesPagos),    color: '#3b82f6' },
          { label: 'Pendentes',    value: String(mesesPendentes), color: '#d97706' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: '12px', padding: '12px',
            border: '1px solid #f1f5f9', textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '800', color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── PIX ──────────────────────────────────────────────────────── */}
      {church?.pixKey && precisaPagar && (
        <div>
          <p style={sectionLabel}>COMO PAGAR</p>
          <CopiarPix pixKey={church.pixKey} />
          <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
            Copie a chave e realize o PIX pelo seu banco
          </p>
        </div>
      )}

      {/* ── Seletor de ano ───────────────────────────────────────────── */}
      {anosComRegistro.length > 0 && (
        <div>
          <p style={sectionLabel}>HISTÓRICO POR ANO</p>

          {/* Tabs de anos */}
          {anosComRegistro.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
              {anosComRegistro.map(ano => (
                <a
                  key={ano}
                  href={`?ano=${ano}`}
                  style={{
                    padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                    textDecoration: 'none', flexShrink: 0,
                    background: ano === anoFiltro ? '#3b82f6' : 'white',
                    color: ano === anoFiltro ? 'white' : '#64748b',
                    border: `1px solid ${ano === anoFiltro ? '#3b82f6' : '#e2e8f0'}`,
                  }}
                >
                  {ano}
                </a>
              ))}
            </div>
          )}

          {/* Resumo do ano */}
          <div style={{
            background: 'white', borderRadius: '14px', padding: '14px 16px',
            border: '1px solid #f1f5f9', marginBottom: '14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                {anoFiltro} — {pagosAno} de {anoFiltro === anoAtual ? mesAtual : 12} meses
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                {pagosAno} pago{pagosAno !== 1 ? 's' : ''}
              </p>
            </div>
            <p style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#16a34a' }}>
              R$ {totalAno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Grade 12 meses */}
          <div style={{
            background: 'white', borderRadius: '14px', padding: '16px',
            border: '1px solid #f1f5f9', marginBottom: '14px',
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px',
            }}>
              {grade.map(({ mes, tithe, isFuture }) => {
                const isCurrentMonth = mes === mesAtual && anoFiltro === anoAtual
                let bg = '#f8fafc'
                let color = '#cbd5e1'
                let icon = '·'

                if (isFuture) {
                  bg = '#f8fafc'; color = '#e2e8f0'
                } else if (tithe?.status === 'PAID') {
                  bg = '#dcfce7'; color = '#16a34a'; icon = '✓'
                } else if (tithe?.status === 'EXEMPT') {
                  bg = '#f1f5f9'; color = '#64748b'; icon = '—'
                } else if (tithe?.status === 'PENDING') {
                  bg = '#fef9c3'; color = '#a16207'; icon = '⏳'
                } else {
                  // Sem registro, mês já passou
                  bg = '#fff1f2'; color = '#fca5a5'; icon = '·'
                }

                return (
                  <div key={mes} style={{
                    background: bg, borderRadius: '10px', padding: '8px 4px',
                    textAlign: 'center',
                    outline: isCurrentMonth ? `2px solid #3b82f6` : 'none',
                  }}>
                    <p style={{ margin: '0 0 3px', fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                      {MESES[mes - 1]}
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', color }}>{icon}</p>
                  </div>
                )
              })}
            </div>

            {/* Legenda */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
              {[
                { bg: '#dcfce7', color: '#16a34a', label: 'Pago' },
                { bg: '#fef9c3', color: '#a16207', label: 'Pendente' },
                { bg: '#fff1f2', color: '#fca5a5', label: 'Sem registro' },
                { bg: '#f1f5f9', color: '#64748b', label: 'Isento' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.bg, border: `1px solid ${l.color}20` }} />
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lista detalhada do ano */}
          {tithesAno.length > 0 && (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
              {[...tithesAno].map((t, i) => {
                const s = STATUS_MAP[t.status as keyof typeof STATUS_MAP] || STATUS_MAP.PENDING
                const isCurrent = t.month === mesAtual && t.year === anoAtual
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderBottom: i < tithesAno.length - 1 ? '1px solid #f8fafc' : 'none',
                    background: isCurrent ? '#f0f9ff' : 'white',
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
                          {MESES_FULL[t.month - 1]}
                          {isCurrent && (
                            <span style={{ marginLeft: '6px', fontSize: '10px', color: '#3b82f6', fontWeight: '700' }}>ATUAL</span>
                          )}
                        </p>
                        {t.paidAt && (
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                            Pago em {new Date(t.paidAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 3px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
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
          )}

          {tithesAno.length === 0 && (
            <div style={{
              padding: '32px 20px', textAlign: 'center',
              background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9',
            }}>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
                Nenhum registro em {anoFiltro}.
              </p>
            </div>
          )}
        </div>
      )}

      {tithesAll.length === 0 && (
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

const sectionLabel: React.CSSProperties = {
  margin: '0 0 10px', fontSize: '11px', fontWeight: '700',
  color: '#94a3b8', letterSpacing: '0.5px',
}
