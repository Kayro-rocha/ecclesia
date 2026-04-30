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
    include: { _count: { select: { members: true, tithes: true, events: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const now = new Date()
  const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1)
  const mesAtual = now.getMonth() + 1
  const anoAtual = now.getFullYear()

  const allIds = [userChurchId, ...filiais.map(f => f.id)]

  const [eventosMesAll, dizimosMesAll, lastEventsAll, sedeMembros] = await Promise.all([
    prisma.event.groupBy({
      by: ['churchId'],
      where: { churchId: { in: allIds }, createdAt: { gte: mesInicio } },
      _count: { id: true },
    }),
    prisma.tithe.groupBy({
      by: ['churchId'],
      where: { churchId: { in: allIds }, month: mesAtual, year: anoAtual, status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.event.findMany({
      where: { churchId: { in: allIds } },
      orderBy: { createdAt: 'desc' },
      select: { churchId: true, createdAt: true },
      distinct: ['churchId'],
    }),
    prisma.member.count({ where: { churchId: userChurchId, active: true } }),
  ])

  function getStats(churchId: string) {
    const ev = eventosMesAll.find(e => e.churchId === churchId)
    const tz = dizimosMesAll.find(t => t.churchId === churchId)
    const la = lastEventsAll.find(e => e.churchId === churchId)
    return {
      eventosMes: ev?._count.id ?? 0,
      dizimosMes: tz?._sum.amount ?? 0,
      lastActivity: la?.createdAt.toISOString() ?? null,
    }
  }

  // Consolidado: sede + filiais
  const sedeDizimos = dizimosMesAll.find(t => t.churchId === userChurchId)?._sum.amount ?? 0
  const sedeEventos = eventosMesAll.find(e => e.churchId === userChurchId)?._count.id ?? 0
  const totalMembros = sedeMembros + filiais.reduce((s, f) => s + f._count.members, 0)
  const totalDizimos = allIds.reduce((s, id) => {
    const t = dizimosMesAll.find(t => t.churchId === id)
    return s + (t?._sum.amount ?? 0)
  }, 0)
  const totalEventos = allIds.reduce((s, id) => {
    const e = eventosMesAll.find(e => e.churchId === id)
    return s + (e?._count.id ?? 0)
  }, 0)

  const canAddFilial = filiais.length < 3

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Network size={22} color="var(--primary)" />
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>Rede de Igrejas</h1>
          </div>
          <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>
            {filiais.length} {filiais.length === 1 ? 'filial' : 'filiais'} · {totalMembros} membros no total
          </p>
        </div>
        {canAddFilial ? (
          <Link href={`/${slug}/rede/nova`} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Nova filial
          </Link>
        ) : (
          <div style={{ fontSize: '13px', color: '#a0aec0', background: '#f7fafc', padding: '8px 16px', borderRadius: '8px', border: '1px solid #edf2f7' }}>
            Limite de 3 filiais atingido
          </div>
        )}
      </div>

      {/* Consolidado da rede */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>
          Consolidado da rede — {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Membros totais', value: totalMembros, sub: `${sedeMembros} sede · ${totalMembros - sedeMembros} filiais`, color: 'var(--primary)' },
            { label: 'Dízimos no mês', value: `R$ ${totalDizimos.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, sub: `R$ ${sedeDizimos.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} sede`, color: '#22c55e' },
            { label: 'Eventos no mês', value: totalEventos, sub: `${sedeEventos} sede · ${totalEventos - sedeEventos} filiais`, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px' }}>
              <p style={{ fontSize: '20px', fontWeight: '700', color: s.color, margin: '0 0 2px' }}>{s.value}</p>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', margin: '0 0 2px' }}>{s.label}</p>
              <p style={{ fontSize: '11px', color: '#a0aec0', margin: 0 }}>{s.sub}</p>
            </div>
          ))}
        </div>
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
            <FilialCard
              key={filial.id}
              filial={filial}
              index={index}
              sedeSlug={slug}
              stats={getStats(filial.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
