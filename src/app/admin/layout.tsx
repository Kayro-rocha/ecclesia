import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { LayoutDashboard, Building2, Users, CreditCard } from 'lucide-react'
import AdminLogoutButton from './AdminLogoutButton'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Ecclesia' },
}

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { href: '/admin/igrejas',   label: 'Igrejas',    Icon: Building2       },
  { href: '/admin/usuarios',  label: 'Usuários',   Icon: Users           },
  { href: '/admin/planos',    label: 'Planos',     Icon: CreditCard      },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#0f172a', color: 'white' }}>
        {session?.user?.role === 'MASTER' ? (
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{ width: '220px', background: '#1e293b', borderRight: '1px solid #334155', position: 'fixed', top: 0, left: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
              {/* Logo */}
              <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src="/favicon.ico" alt="Ecclesia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Ecclesia</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Painel Master</div>
                </div>
              </div>

              {/* Nav */}
              <nav style={{ padding: '12px 8px', flex: 1 }}>
                <style>{`
                  .admin-nav-link {
                    display: flex; align-items: center; gap: 10px;
                    padding: 9px 12px; border-radius: 8px;
                    text-decoration: none; color: #94a3b8; font-size: 14px;
                    margin-bottom: 2px; transition: all 0.15s;
                  }
                  .admin-nav-link:hover { background: #0f172a; color: white; }
                `}</style>
                {navItems.map(({ href, label, Icon }) => (
                  <Link key={href} href={href} className="admin-nav-link">
                    <Icon size={16} />
                    {label}
                  </Link>
                ))}
              </nav>

              {/* Footer */}
              <div style={{ padding: '12px 8px', borderTop: '1px solid #334155' }}>
                <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                    {session.user.name?.[0]?.toUpperCase() ?? 'M'}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: '13px', color: 'white', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user.name}</p>
                    <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>MASTER</p>
                  </div>
                </div>
                <AdminLogoutButton />
              </div>
            </aside>

            {/* Main */}
            <main style={{ marginLeft: '220px', flex: 1, minHeight: '100vh', background: '#0f172a' }}>
              <style>{`
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
                .badge-igreja { background: #1e1b4b; color: #a5b4fc; }
                .badge-rede { background: #052e16; color: #4ade80; }
                .admin-btn { padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; border: none; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
                .admin-btn-primary { background: #3b82f6; color: white; }
                .admin-btn-danger { background: transparent; border: 1px solid #991b1b; color: #f87171; }
                .admin-btn-ghost { background: #0f172a; color: #94a3b8; border: 1px solid #334155; }
                .admin-btn-success { background: #052e16; color: #4ade80; border: 1px solid #166534; }
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
