'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Calendar, Bell, Wallet, User, Users } from 'lucide-react'

const LS_COMUNICADOS = 'lastReadComunicados'
const LS_ESCALAS = 'lastReadEscalas'

interface Props {
  slug: string
  latestComunicadoAt: string | null
  latestEscalaAt: string | null
  isLeader?: boolean
}

export default function MembroBottomNav({ slug, latestComunicadoAt, latestEscalaAt, isLeader }: Props) {
  const pathname = usePathname()
  const [hasUnreadComunicados, setHasUnreadComunicados] = useState(false)
  const [hasUnreadEscalas, setHasUnreadEscalas] = useState(false)

  useEffect(() => {
    if (latestComunicadoAt) {
      const last = localStorage.getItem(LS_COMUNICADOS)
      if (!last || new Date(latestComunicadoAt) > new Date(last)) setHasUnreadComunicados(true)
    }
    if (latestEscalaAt) {
      const last = localStorage.getItem(LS_ESCALAS)
      if (!last || new Date(latestEscalaAt) > new Date(last)) setHasUnreadEscalas(true)
    }
  }, [latestComunicadoAt, latestEscalaAt])

  useEffect(() => {
    if (pathname.includes('/comunicados')) {
      localStorage.setItem(LS_COMUNICADOS, new Date().toISOString())
      setHasUnreadComunicados(false)
    }
    if (pathname.includes('/escalas')) {
      localStorage.setItem(LS_ESCALAS, new Date().toISOString())
      setHasUnreadEscalas(false)
    }
  }, [pathname])

  const items = [
    { href: `/${slug}/membro/home`,        Icon: Home,     label: 'Início' },
    { href: `/${slug}/membro/escalas`,     Icon: Calendar, label: 'Escalas',  badge: hasUnreadEscalas },
    ...(isLeader ? [{ href: `/${slug}/membro/celula`, Icon: Users, label: 'Célula', badge: false }] : []),
    { href: `/${slug}/membro/comunicados`, Icon: Bell,     label: 'Avisos',   badge: hasUnreadComunicados },
    { href: `/${slug}/membro/dizimo`,      Icon: Wallet,   label: 'Dízimo' },
    { href: `/${slug}/membro/perfil`,      Icon: User,     label: 'Perfil' },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'white', borderTop: '1px solid #e2e8f0',
      display: 'flex', height: '62px',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map(item => {
        const active = pathname.startsWith(item.href)
        const color = active ? 'var(--church-primary)' : '#94a3b8'
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '3px',
              textDecoration: 'none', color,
              fontSize: '10px', fontWeight: active ? '600' : '400',
              transition: 'color 0.15s', position: 'relative',
            }}
          >
            <span style={{ position: 'relative', display: 'flex' }}>
              <item.Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              {item.badge && (
                <span style={{
                  position: 'absolute', top: '-2px', right: '-4px',
                  width: '9px', height: '9px', borderRadius: '50%',
                  background: '#ef4444', border: '1.5px solid white',
                }} />
              )}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
