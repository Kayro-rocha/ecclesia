import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata = { title: 'Frequência' }


interface Props { params: Promise<{ slug: string }> }

export default async function FrequenciaPage({ params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const totalMembros = await prisma.member.count({ where: { churchId: church.id, active: true } })

  const records = await prisma.attendance.findMany({
    where: { churchId: church.id },
    orderBy: { date: 'desc' },
  })

  // Agrupa por data+tipo
  const grouped: Record<string, { date: Date; type: string; count: number }> = {}
  for (const r of records) {
    const key = `${r.date.toISOString().split('T')[0]}__${r.type}`
    if (!grouped[key]) grouped[key] = { date: r.date, type: r.type, count: 0 }
    grouped[key].count++
  }

  const eventos = Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime())

  const mediaPresenca = eventos.length > 0 && totalMembros > 0
    ? Math.round(eventos.reduce((acc, e) => acc + e.count, 0) / eventos.length)
    : 0

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>Frequência</h1>
        <Link href={`/${slug}/frequencia/novo`} className="btn-primary">+ Registrar culto</Link>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a2e' }}>{eventos.length}</div>
            <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>Cultos registrados</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a2e' }}>{totalMembros}</div>
            <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>Membros ativos</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a2e' }}>
              {totalMembros > 0 ? Math.round((mediaPresenca / totalMembros) * 100) : 0}%
            </div>
            <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>Média de presença</div>
          </div>
        </div>

        {/* Lista de cultos */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {eventos.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: '#a0aec0', fontSize: '14px', margin: '0 0 16px' }}>Nenhum culto registrado ainda.</p>
              <Link href={`/${slug}/frequencia/novo`} className="btn-primary">Registrar primeiro culto</Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo de culto</th>
                  <th>Presentes</th>
                  <th>% do total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => {
                  const pct = totalMembros > 0 ? Math.round((evento.count / totalMembros) * 100) : 0
                  const dataFormatada = evento.date.toLocaleDateString('pt-BR', {
                    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
                  })
                  return (
                    <tr key={`${evento.date.toISOString()}__${evento.type}`}>
                      <td style={{ fontWeight: '500' }}>{dataFormatada}</td>
                      <td>{evento.type}</td>
                      <td>
                        <span className="badge-blue">{evento.count} / {totalMembros}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            height: '6px', flex: 1, background: '#edf2f7',
                            borderRadius: '3px', overflow: 'hidden', maxWidth: '80px'
                          }}>
                            <div style={{
                              height: '100%', width: `${pct}%`,
                              background: pct >= 70 ? '#48bb78' : pct >= 40 ? '#ed8936' : '#fc8181',
                              borderRadius: '3px',
                            }} />
                          </div>
                          <span style={{ fontSize: '13px', color: '#718096' }}>{pct}%</span>
                        </div>
                      </td>
                      <td>
                        <Link
                          href={`/${slug}/frequencia/novo?data=${evento.date.toISOString().split('T')[0]}&tipo=${encodeURIComponent(evento.type)}`}
                          style={{ fontSize: '13px', color: '#4299e1', textDecoration: 'none' }}
                        >
                          Ver / Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
