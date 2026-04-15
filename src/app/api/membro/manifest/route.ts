import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || 'app'

  const church = await prisma.church.findUnique({
    where: { slug },
    select: { name: true, primaryColor: true },
  })

  const name = church?.name || 'Ecclesia'
  const color = church?.primaryColor || '#1a1a2e'

  const manifest = {
    name,
    short_name: name,
    description: `App do membro — ${name}`,
    start_url: `/${slug}/membro`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: color,
    lang: 'pt-BR',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    categories: ['lifestyle', 'social'],
  }

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
