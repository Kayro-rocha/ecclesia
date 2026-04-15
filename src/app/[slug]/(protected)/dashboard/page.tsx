import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function DashboardPage({ params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const totalMembers = await prisma.member.count({
    where: { churchId: church.id, active: true },
  })
  const totalVisitors = await prisma.visitor.count({
    where: { churchId: church.id },
  })
  const totalSchedules = await prisma.schedule.count({
    where: { churchId: church.id },
  })
  const totalTithe = await prisma.tithe.aggregate({
    where: {
      churchId: church.id,
      status: 'PAID',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
    _sum: { amount: true },
  })

  const menus = [
    { label: 'Membros', desc: 'Cadastro e gestão', href: `/${slug}/membros`, icon: '👥' },
    { label: 'Dízimo', desc: 'PIX e cobranças', href: `/${slug}/dizimo`, icon: '💰' },
    { label: 'Escalas', desc: 'Voluntários', href: `/${slug}/escalas`, icon: '📅' },
    { label: 'Visitantes', desc: 'Acompanhamento', href: `/${slug}/visitantes`, icon: '🙋' },
    { label: 'Comunicados', desc: 'Notificação push', href: `/${slug}/comunicados`, icon: '📢' },
    { label: 'Missões', desc: 'Ações sociais', href: `/${slug}/missoes`, icon: '🤝' },
  ]

  return (
    <div style={{ padding: '32px' }}>
      <style>{`
        .menu-card:hover { border-color: var(--primary) !important; transform: translateY(-1px); }
        .menu-card { transition: all 0.2s; }
        .stat-card { transition: all 0.2s; }
      `}</style>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a2e' }}>
          Bom dia, {session.user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: '14px', color: '#a0aec0', marginTop: '4px' }}>
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
          })}
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px', marginBottom: '32px'
      }}>
        {[
          { label: 'Membros ativos', value: totalMembers, color: '#667eea' },
          { label: 'Visitantes', value: totalVisitors, color: '#48bb78' },
          { label: 'Dízimo do mês', value: `R$ ${(totalTithe._sum.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: '#ed8936' },
          { label: 'Escalas', value: totalSchedules, color: '#9f7aea' },
        ].map((card) => (
          <div key={card.label} className="stat-card card"
            style={{ borderLeft: `4px solid ${card.color}` }}>
            <p style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '8px', fontWeight: '500' }}>
              {card.label}
            </p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a2e' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {menus.map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div className="menu-card card" style={{
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <span style={{ fontSize: '28px' }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{item.label}</p>
                <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '2px' }}>{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}