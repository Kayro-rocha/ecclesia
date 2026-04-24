import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Network } from 'lucide-react'
import FilialCard from './FilialCard'

interface Props {
  params: Promise<{ slug: string }>
}

export const metadata = { title: 'Rede de Igrejas' }

export default async function RedePage({ params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const userChurchId = (session.user as any).churchId as string
  const church = await prisma.church.findUnique({
    where: { id: userChurchId },
    select: { id: true, plan: true, slug: true },
  })

  if (!church || church.plan !== 'REDE' || church.slug !== slug) {
    redirect(`/${slug}/dashboard`)
  }

  const filiais = await prisma.church.findMany({
    where: { parentChurchId: userChurchId },
    include: {
      _count: { select: { members: true, tithes: true, events: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const totalMembers = filiais.reduce((s, f) => s + f._count.members, 0)
  const canAddFilial = filiais.length < 3

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Network size={22} color="var(--primary)" />
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>Rede de Igrejas</h1>
          </div>
          <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>
            {filiais.length} {filiais.length === 1 ? 'filial' : 'filiais'} · {totalMembers} membros no total
          </p>
        </div>
        {canAddFilial ? (
          <Link href={`/${slug}/rede/nova`} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            Nova filial
          </Link>
        ) : (
          <div style={{ fontSize: '13px', color: '#a0aec0', background: '#f7fafc', padding: '8px 16px', borderRadius: '8px', border: '1px solid #edf2f7' }}>
            Limite de 3 filiais atingido
          </div>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>Filiais utilizadas</span>
          <span style={{ fontSize: '13px', color: '#718096' }}>{filiais.length} de 3</span>
        </div>
        <div style={{ background: '#edf2f7', borderRadius: '9999px', height: '8px' }}>
          <div style={{ width: `${(filiais.length / 3) * 100}%`, background: 'var(--primary)', height: '8px', borderRadius: '9999px', transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* Lista de filiais */}
      {filiais.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Network size={40} color="#e2e8f0" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#4a5568', margin: '0 0 8px' }}>Nenhuma filial ainda</h3>
          <p style={{ fontSize: '14px', color: '#a0aec0', margin: '0 0 24px' }}>Adicione até 3 igrejas filiais à sua rede.</p>
          <Link href={`/${slug}/rede/nova`} className="btn-primary">Adicionar primeira filial</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filiais.map((filial, index) => (
            <FilialCard key={filial.id} filial={filial} index={index} sedeSlug={slug} />
          ))}
        </div>
      )}
    </div>
  )
}
