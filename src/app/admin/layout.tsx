import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/igrejas', label: 'Igrejas', icon: '⛪' },
  { href: '/admin/usuarios', label: 'Usuários', icon: '👤' },
  { href: '/admin/planos', label: 'Planos', icon: '💳' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  // Login page não precisa de autenticação
  // O redirect acontece nas páginas individuais

  const isLoginPage = false // layout é shared, proteção nas páginas

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#0f172a', color: 'white' }}>
        {session?.user?.role === 'MASTER' ? (
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{ width: '220px', background: '#1e293b', borderRight: '1px solid #334155', position: 'fixed', top: 0, left: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px 20px', borderBottom: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#3b82f6', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>MarketControll</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Painel Admin</div>
              </div>
              <nav style={{ padding: '16px 12px', flex: 1 }}>
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', textDecoration: 'none', color: '#94a3b8', fontSize: '14px', marginBottom: '2px', transition: 'all 0.15s' }}
                    className="admin-nav-item"
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px' }}>{session.user.name}</p>
                <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>MASTER</p>
              </div>
            </aside>

            {/* Main */}
            <main style={{ marginLeft: '220px', flex: 1, minHeight: '100vh', background: '#0f172a' }}>
              <style>{`
                .admin-nav-item:hover { background: #0f172a !important; color: white !important; }
                .admin-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }
                .admin-table { width: 100%; border-collapse: collapse; }
                .admin-table th { text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 16px; border-bottom: 1px solid #334155; }
                .admin-table td { padding: 12px 16px; border-bottom: 1px solid #1e293b; font-size: 14px; color: #e2e8f0; }
                .admin-table tr:hover td { background: #1e293b; }
                .admin-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
                .badge-active { background: #052e16; color: #4ade80; }
                .badge-inactive { background: #450a0a; color: #f87171; }
                .badge-pro { background: #1e1b4b; color: #a5b4fc; }
                .badge-basic { background: #0c1a2e; color: #60a5fa; }
                .admin-btn { padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; border: none; cursor: pointer; }
                .admin-btn-primary { background: #3b82f6; color: white; }
                .admin-btn-danger { background: transparent; border: 1px solid #991b1b; color: #f87171; }
                .admin-btn-ghost { background: #1e293b; color: #94a3b8; border: 1px solid #334155; }
                .admin-input { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 9px 12px; font-size: 14px; color: white; outline: none; }
                .admin-input:focus { border-color: #3b82f6; }
              `}</style>
              {children}
            </main>
          </div>
        ) : (
          <>{children}</>
        )}
      </body>
    </html>
  )
}
