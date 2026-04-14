import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function SlugLayout({ children, params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions)

  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const primaryColor = church.primaryColor || '#2563eb'

  return (
    <>
      <style>{`
        :root {
          --primary: ${primaryColor};
          --primary-dark: ${primaryColor}dd;
          --primary-light: ${primaryColor}18;
        }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fb; color: #1a1a2e; margin: 0; }
        input, select, textarea {
          color: #1a1a2e !important;
          background: #ffffff !important;
          border: 1.5px solid #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 10px 12px !important;
          font-size: 14px !important;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus, select:focus, textarea:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px var(--primary-light) !important;
        }
        input::placeholder, textarea::placeholder { color: #a0aec0 !important; }
        label { color: #4a5568; font-size: 13px; font-weight: 500; display: block; margin-bottom: 6px; }
        .card { background: white; border-radius: 12px; border: 1px solid #edf2f7; padding: 20px; }
        .nav-link { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; font-size: 13px; color: #4a5568; text-decoration: none; margin-bottom: 2px; transition: all 0.15s; }
        .nav-link:hover { background: #f7fafc; color: #1a1a2e; }
        .page-header { padding: 20px 32px; background: white; border-bottom: 1px solid #edf2f7; display: flex; align-items: center; justify-content: space-between; }
        .page-content { padding: 32px; }
        .btn-primary { background: var(--primary) !important; color: white !important; border: none !important; padding: 10px 20px !important; border-radius: 8px !important; font-size: 14px !important; font-weight: 500 !important; cursor: pointer !important; text-decoration: none; display: inline-block; }
        .btn-secondary { background: white !important; color: #4a5568 !important; border: 1.5px solid #e2e8f0 !important; padding: 10px 20px !important; border-radius: 8px !important; font-size: 14px !important; cursor: pointer !important; text-decoration: none; display: inline-block; }
        .badge-green { background: #f0fff4; color: #276749; font-size: 12px; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        .badge-yellow { background: #fffff0; color: #744210; font-size: 12px; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        .badge-red { background: #fff5f5; color: #742a2a; font-size: 12px; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        .badge-blue { background: var(--primary-light); color: var(--primary); font-size: 12px; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        .badge-gray { background: #f7fafc; color: #718096; font-size: 12px; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-size: 12px; color: #a0aec0; font-weight: 500; padding: 8px 16px; border-bottom: 1px solid #edf2f7; }
        td { padding: 12px 16px; border-bottom: 1px solid #f7fafc; font-size: 14px; color: #1a1a2e; }
        tr:hover td { background: #fafbfc; }
        .sidebar { width: 220px; background: white; border-right: 1px solid #edf2f7; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 10; }
        .main-content { margin-left: 220px; min-height: 100vh; }
        .main-content { margin-left: 220px; min-height: 100vh; width: calc(100% - 220px); }
.page-header { padding: 16px 32px; background: white; border-bottom: 1px solid #edf2f7; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 5; }
.page-content { padding: 32px; width: 100%; }
form { width: 100%; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside className="sidebar">
          <div style={{ padding: '20px 16px', borderBottom: '1px solid #edf2f7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px',
                background: primaryColor,
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '700', fontSize: '16px', flexShrink: 0,
              }}>
                {church.name.charAt(0)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {church.name}
                </div>
                <div style={{ fontSize: '11px', color: '#a0aec0' }}>Painel</div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
            {[
              { href: `/${slug}/dashboard`, label: 'Início', icon: '⊞' },
              { href: `/${slug}/membros`, label: 'Membros', icon: '👥' },
              { href: `/${slug}/dizimo`, label: 'Dízimo', icon: '💰' },
              { href: `/${slug}/financeiro`, label: 'Financeiro', icon: '📊' },
              { href: `/${slug}/escalas`, label: 'Escalas', icon: '📅' },
              { href: `/${slug}/frequencia`, label: 'Frequência', icon: '✅' },
              { href: `/${slug}/visitantes`, label: 'Visitantes', icon: '🙋' },
              { href: `/${slug}/comunicados`, label: 'Comunicados', icon: '📢' },
              { href: `/${slug}/missoes`, label: 'Missões', icon: '🤝' },
              { href: `/${slug}/eventos`, label: 'Eventos', icon: '🎉' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ padding: '12px 8px', borderTop: '1px solid #edf2f7' }}>
            <Link href={`/${slug}/configuracoes`} className="nav-link">
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>⚙️</span>
              Configurações
            </Link>
            <div style={{ padding: '9px 10px', fontSize: '13px', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>👤</span>
              {session.user?.name?.split(' ')[0]}
            </div>
          </div>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  )
}