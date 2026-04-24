import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Nova Missão' }
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
