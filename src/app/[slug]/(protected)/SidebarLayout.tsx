'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

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
  children: React.ReactNode
}

export default function SidebarLayout({ slug, churchName, primaryColor, logoUrl, userName, userRole, userPermissions, isRedeChurch, sedeSlug, children }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const marginLeft = collapsed ? 64 : 220

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        slug={slug}
        churchName={churchName}
        primaryColor={primaryColor}
        logoUrl={logoUrl}
        userName={userName}
        userRole={userRole}
        userPermissions={userPermissions}
        isRedeChurch={isRedeChurch}
        sedeSlug={sedeSlug}
        initialCollapsed={false}
        onCollapse={setCollapsed}
      />
      <main style={{
        marginLeft,
        minHeight: '100vh',
        width: `calc(100% - ${marginLeft}px)`,
        transition: 'margin-left 0.2s ease, width 0.2s ease',
      }}>
        {children}
      </main>
    </div>
  )
}
