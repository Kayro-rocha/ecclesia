import { prisma } from '@/lib/prisma'
import SwRegistrar from './SwRegistrar'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const church = await prisma.church.findUnique({ where: { slug }, select: { name: true } })
  const name = church?.name ?? 'Ecclesia'
  return {
    title: { template: `%s | ${name}`, default: name },
    manifest: `/api/membro/manifest?slug=${slug}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: church?.name || 'Ecclesia',
      startupImage: '/icon-512.png',
    },
    icons: {
      apple: '/icon-192.png',
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  }
}

export default function MembroOuterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SwRegistrar />
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        input, select, textarea { font-family: inherit; }
      `}</style>
      {children}
    </>
  )
}
