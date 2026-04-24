'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function AdminLogoutButton() {
  return (
    <button
      onClick={async () => {
        await signOut({ redirect: false })
        window.location.href = '/admin/login'
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px', borderRadius: '8px', width: '100%',
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#f87171', fontSize: '14px', textAlign: 'left',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <LogOut size={16} />
      Sair
    </button>
  )
}
