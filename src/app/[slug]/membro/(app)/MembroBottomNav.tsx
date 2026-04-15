'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props { slug: string }

export default function MembroBottomNav({ slug }: Props) {
  const pathname = usePathname()

  const items = [
    { href: `/${slug}/membro/home`,         icon: '🏠', label: 'Início' },
    { href: `/${slug}/membro/escalas`,      icon: '📅', label: 'Escalas' },
    { href: `/${slug}/membro/comunicados`,  icon: '📢', label: 'Avisos' },
    { href: `/${slug}/membro/dizimo`,       icon: '💰', label: 'Dízimo' },
    { href: `/${slug}/membro/perfil`,       icon: '👤', label: 'Perfil' },
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
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '2px',
              textDecoration: 'none', color: active ? '#3b82f6' : '#94a3b8',
              fontSize: '10px', fontWeight: active ? '600' : '400',
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
