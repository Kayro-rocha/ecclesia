'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, Wallet, BarChart2, Calendar,
  ClipboardCheck, UserPlus, Bell, Heart, CalendarDays,
  Sparkles, Settings, User, Home, ChevronLeft, ChevronRight, Shield, LogOut, Network, ArrowLeft,
} from 'lucide-react'

const LS_KEY = 'sidebar-collapsed'

const ALL_NAV_ITEMS = [
  { module: null,          label: 'Início',      Icon: LayoutDashboard, path: 'dashboard'   },
  { module: 'membros',     label: 'Membros',     Icon: Users,           path: 'membros'     },
  { module: 'celulas',     label: 'Células',     Icon: Home,            path: 'celulas'     },
  { module: 'dizimo',      label: 'Dízimo',      Icon: Wallet,          path: 'dizimo'      },
  { module: 'financeiro',  label: 'Financeiro',  Icon: BarChart2,       path: 'financeiro'  },
  { module: 'escalas',     label: 'Escalas',     Icon: Calendar,        path: 'escalas'     },
  { module: 'frequencia',  label: 'Frequência',  Icon: ClipboardCheck,  path: 'frequencia'  },
  { module: 'visitantes',  label: 'Visitantes',  Icon: UserPlus,        path: 'visitantes'  },
  { module: 'comunicados', label: 'Comunicados', Icon: Bell,            path: 'comunicados' },
  { module: 'missoes',     label: 'Missões',     Icon: Heart,           path: 'missoes'     },
  { module: 'eventos',     label: 'Eventos',     Icon: CalendarDays,    path: 'eventos'     },
  { module: 'oracoes',     label: 'Orações',     Icon: Sparkles,        path: 'oracoes'     },
]

interface Props {
  slug: string
  churchName: string
  primaryColor: string
  logoUrl: string | null
  userName: string
  userRole: string
  userPermissions: string[] | null
  isRedeChurch: boolean
  sedeSlug: string | null
  onCollapse: (collapsed: boolean) => void
  initialCollapsed: boolean
}

export default function Sidebar({ slug, churchName, primaryColor, logoUrl, userName, userRole, userPermissions, isRedeChurch, sedeSlug, onCollapse, initialCollapsed }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(initialCollapsed)

  const isPastor = userRole === 'PASTOR' || userRole === 'MASTER'

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY)
    if (saved !== null) {
      const val = saved === '1'
      setCollapsed(val)
      onCollapse(val)
    }
  }, [])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    onCollapse(next)
    localStorage.setItem(LS_KEY, next ? '1' : '0')
  }

  // Filtra itens conforme permissões: null = acesso total, array = só os permitidos
  const navItems = ALL_NAV_ITEMS
    .filter(({ module }) => !module || !userPermissions || userPermissions.includes(module))
    .map(({ label, Icon, path }) => ({
      href: `/${slug}/${path}`,
      label,
      Icon,
    }))

  const w = collapsed ? 64 : 220

  function linkStyle(href: string) {
    const active = pathname.startsWith(href)
    return {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: collapsed ? '9px 0' : '9px 10px',
      borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
      marginBottom: '2px', transition: 'all 0.15s',
      justifyContent: collapsed ? 'center' as const : undefined,
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? 'white' : '#94a3b8',
      fontWeight: active ? '600' : '400',
      borderLeft: active && !collapsed ? '3px solid rgba(255,255,255,0.4)' : '3px solid transparent',
    }
  }

  return (
    <aside style={{
      width: w, minWidth: w, background: '#0f172a',
      display: 'flex', flexDirection: 'column', position: 'fixed',
      top: 0, left: 0, bottom: 0, zIndex: 10,
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: collapsed ? '14px 0 10px' : '14px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: collapsed ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: collapsed ? '6px' : '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: collapsed ? 'unset' : 1 }}>
          <div style={{
            width: '34px', height: '34px', background: primaryColor, borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '700', fontSize: '15px', flexShrink: 0,
            overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            {logoUrl
              ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : churchName.charAt(0)
            }
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {churchName}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Painel de gestão</div>
            </div>
          )}
        </div>

        <button
          onClick={toggle}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          style={{
            width: '26px', height: '26px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
            background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#64748b', flexShrink: 0,
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map(({ href, label, Icon }) => (
          <Link key={href} href={href} title={collapsed ? label : undefined} style={linkStyle(href)}>
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Botão Voltar à sede (quando pastor geral acessa filial) */}
        {sedeSlug && (
          <Link
            href={`/${sedeSlug}/rede`}
            title={collapsed ? 'Voltar à sede' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: collapsed ? '9px 0' : '9px 10px',
              borderRadius: '8px', fontSize: '13px', textDecoration: 'none',
              marginBottom: '6px', transition: 'all 0.15s',
              justifyContent: collapsed ? 'center' as const : undefined,
              background: 'rgba(99,102,241,0.15)',
              color: '#a5b4fc',
              fontWeight: '500',
            }}
          >
            <ArrowLeft size={16} style={{ flexShrink: 0 }} />
            {!collapsed && 'Voltar à sede'}
          </Link>
        )}
        {/* Item Rede (somente sede com plano REDE) */}
        {isRedeChurch && isPastor && (
          <Link
            href={`/${slug}/rede`}
            title={collapsed ? 'Rede' : undefined}
            style={linkStyle(`/${slug}/rede`)}
          >
            <Network size={16} style={{ flexShrink: 0 }} />
            {!collapsed && 'Rede'}
          </Link>
        )}
        {isPastor && (
          <Link
            href={`/${slug}/gestores`}
            title={collapsed ? 'Gestores' : undefined}
            style={linkStyle(`/${slug}/gestores`)}
          >
            <Shield size={16} style={{ flexShrink: 0 }} />
            {!collapsed && 'Gestores'}
          </Link>
        )}
        {isPastor && (
          <Link
            href={`/${slug}/configuracoes`}
            title={collapsed ? 'Configurações' : undefined}
            style={linkStyle(`/${slug}/configuracoes`)}
          >
            <Settings size={16} style={{ flexShrink: 0 }} />
            {!collapsed && 'Configurações'}
          </Link>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: '8px', padding: collapsed ? '9px 0' : '9px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <User size={16} style={{ flexShrink: 0, color: '#475569' }} />
            {!collapsed && (
              <span style={{ fontSize: '13px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName.split(' ')[0]}
              </span>
            )}
          </div>
          <button
            onClick={async () => {
              await signOut({ redirect: false })
              window.location.href = `/${slug}/login`
            }}
            title="Sair"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#fc8181', display: 'flex', alignItems: 'center',
              padding: '2px', borderRadius: '4px', flexShrink: 0,
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
