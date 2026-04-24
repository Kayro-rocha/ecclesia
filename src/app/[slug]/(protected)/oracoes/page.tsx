import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import OracoesClient from './OracoesClient'

export const metadata = { title: 'Pedidos de Oração' }


interface Props { params: Promise<{ slug: string }> }

export default async function OracoesPage({ params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const pedidos = await prisma.prayerRequest.findMany({
    where: { churchId: church.id },
    orderBy: { createdAt: 'desc' },
    include: { member: { select: { name: true, group: true } } },
  })

  const pendentes = pedidos.filter(p => p.status === 'PENDING').length

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
            🙏 Pedidos de Oração
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} recebido{pedidos.length !== 1 ? 's' : ''}
            {pendentes > 0 && (
              <span style={{
                marginLeft: '8px', background: '#ede9fe', color: '#7c3aed',
                borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                padding: '2px 10px',
              }}>
                {pendentes} novo{pendentes !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="page-content">
        {pedidos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🙏</div>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', margin: '0 0 8px' }}>
              Nenhum pedido ainda
            </p>
            <p style={{ fontSize: '14px', margin: 0 }}>
              Os membros podem enviar pedidos de oração pelo aplicativo.
            </p>
          </div>
        ) : (
          <OracoesClient initial={pedidos.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
          }))} />
        )}
      </div>
    </>
  )
}
