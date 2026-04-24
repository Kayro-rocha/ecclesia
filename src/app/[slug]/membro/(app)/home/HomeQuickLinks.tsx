'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Calendar, Gift, Bell, PartyPopper, ChevronRight } from 'lucide-react'

const LS_ESCALAS    = 'lastReadEscalas'
const LS_MISSOES    = 'lastReadMissoes'
const LS_EVENTOS    = 'lastReadEventos'
const LS_COMUNICADOS = 'lastReadComunicados'

interface Props {
  slug: string
  latestEscalaAt:    string | null
  latestMissaoAt:    string | null
  latestEventoAt:    string | null
  latestComunicadoAt: string | null
}

export default function HomeQuickLinks({
  slug,
  latestEscalaAt,
  latestMissaoAt,
  latestEventoAt,
  latestComunicadoAt,
}: Props) {
  const pathname = usePathname()
  const [unread, setUnread] = useState({ escalas: false, missoes: false, eventos: false, comunicados: false })

  // Verifica no mount se há itens não lidos
  useEffect(() => {
    function isUnread(ts: string | null, lsKey: string) {
      if (!ts) return false
      const last = localStorage.getItem(lsKey)
      return !last || new Date(ts) > new Date(last)
    }
    setUnread({
      escalas:    isUnread(latestEscalaAt,    LS_ESCALAS),
      missoes:    isUnread(latestMissaoAt,    LS_MISSOES),
      eventos:    isUnread(latestEventoAt,    LS_EVENTOS),
      comunicados: isUnread(latestComunicadoAt, LS_COMUNICADOS),
    })
  }, [latestEscalaAt, latestMissaoAt, latestEventoAt, latestComunicadoAt])

  // Marca como lido ao visitar cada página
  useEffect(() => {
    const now = new Date().toISOString()
    if (pathname.includes('/escalas'))    { localStorage.setItem(LS_ESCALAS,    now); setUnread(u => ({ ...u, escalas: false })) }
    if (pathname.includes('/missoes'))    { localStorage.setItem(LS_MISSOES,    now); setUnread(u => ({ ...u, missoes: false })) }
    if (pathname.includes('/eventos'))    { localStorage.setItem(LS_EVENTOS,    now); setUnread(u => ({ ...u, eventos: false })) }
    if (pathname.includes('/comunicados')){ localStorage.setItem(LS_COMUNICADOS, now); setUnread(u => ({ ...u, comunicados: false })) }
  }, [pathname])

  const items = [
    { href: `/${slug}/membro/escalas`,    Icon: Calendar,    color: '#3b82f6', bg: '#eff6ff', label: 'Minhas Escalas', sub: 'Ver todas as convocações', badge: unread.escalas },
    { href: `/${slug}/membro/missoes`,    Icon: Gift,        color: '#f97316', bg: '#fff7ed', label: 'Missões',        sub: 'Colabore com doações',   badge: unread.missoes },
    { href: `/${slug}/membro/comunicados`,Icon: Bell,        color: '#8b5cf6', bg: '#f5f3ff', label: 'Comunicados',   sub: 'Avisos da igreja',        badge: unread.comunicados },
    { href: `/${slug}/membro/eventos`,    Icon: PartyPopper, color: '#ec4899', bg: '#fdf2f8', label: 'Eventos',       sub: 'Próximos e passados',     badge: unread.eventos },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map(item => (
        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white', borderRadius: '14px', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: '14px',
            border: '1px solid #f1f5f9',
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: item.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: item.color,
              }}>
                <item.Icon size={20} />
              </div>
              {item.badge && (
                <span style={{
                  position: 'absolute', top: '-2px', right: '-2px',
                  width: '9px', height: '9px', borderRadius: '50%',
                  background: '#ef4444', border: '1.5px solid white',
                }} />
              )}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{item.sub}</p>
            </div>
            <ChevronRight size={18} color="#cbd5e1" style={{ marginLeft: 'auto' }} />
          </div>
        </Link>
      ))}
    </div>
  )
}
