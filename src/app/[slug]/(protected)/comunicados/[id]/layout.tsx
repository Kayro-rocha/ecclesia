import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Editar Comunicado' }
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
