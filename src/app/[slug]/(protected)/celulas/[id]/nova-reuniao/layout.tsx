import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Nova Reunião' }
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
