import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PROTECTED_MODULES = [
  'membros', 'celulas', 'dizimo', 'financeiro', 'escalas',
  'frequencia', 'visitantes', 'comunicados', 'missoes', 'eventos', 'oracoes',
]
const PASTOR_ONLY = ['gestores', 'configuracoes']

async function isDenied(req: NextRequest, segment: string): Promise<boolean> {
  if (!PROTECTED_MODULES.includes(segment) && !PASTOR_ONLY.includes(segment)) return false

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return false // sem token → deixa o next-auth redirecionar para login

  const role = token.role as string | undefined
  if (role === 'PASTOR' || role === 'MASTER') return false

  if (PASTOR_ONLY.includes(segment)) return true

  const permissions = token.permissions as string[] | null | undefined
  return Array.isArray(permissions) && !permissions.includes(segment)
}

export async function proxy(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const url = req.nextUrl.clone()

  const mainDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000'
  const isMainDomain = host === mainDomain || host === `www.${mainDomain}`
  const isAdmin = host.startsWith('admin.')
  const isLocalhost = host.includes('localhost')
  const isIPAddress = /^\d{1,3}(\.\d{1,3}){3}/.test(host)

  if (isLocalhost || isMainDomain || isAdmin || isIPAddress) {
    // Acesso direto: URL no formato /{slug}/{segment}
    const parts = url.pathname.split('/')
    const slug = parts[1]
    const segment = parts[2]
    if (slug && segment && await isDenied(req, segment)) {
      return NextResponse.redirect(new URL(`/${slug}/dashboard`, req.url))
    }
    return NextResponse.next()
  }

  const slug = host.split('.')[0]

  if (!slug) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (url.pathname === '/cadastro' || url.pathname.startsWith('/cadastro/')) {
    return new NextResponse(null, { status: 404 })
  }

  // Já tem o slug no path (raro em subdomínio, mas evita duplicação)
  if (url.pathname === `/${slug}` || url.pathname.startsWith(`/${slug}/`)) {
    const segment = url.pathname.split('/')[2]
    if (segment && await isDenied(req, segment)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Acesso via subdomínio: segment é o primeiro segmento do path
  const segment = url.pathname.split('/')[1]
  if (segment && await isDenied(req, segment)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  url.pathname = `/${slug}${url.pathname}`
  const res = NextResponse.rewrite(url)
  res.headers.set('x-church-slug', slug)

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
