import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Igrejas' }
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
