import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Logs de Auditoria' }
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
