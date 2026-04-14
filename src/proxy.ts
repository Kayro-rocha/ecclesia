import { NextRequest, NextResponse } from 'next/server'

export async function proxy(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const url = req.nextUrl.clone()

  const mainDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000'
  const isMainDomain = host === mainDomain || host === `www.${mainDomain}`
  const isAdmin = host.startsWith('admin.')
  const isLocalhost = host.includes('localhost')
  const isIPAddress = /^\d{1,3}(\.\d{1,3}){3}/.test(host)

  if (isLocalhost || isMainDomain || isAdmin || isIPAddress) {
    return NextResponse.next()
  }

  const slug = host.split('.')[0]

  if (!slug) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // /cadastro não existe em subdomínio de igreja
  if (url.pathname === '/cadastro' || url.pathname.startsWith('/cadastro/')) {
    return new NextResponse(null, { status: 404 })
  }

  // Evita duplo prefixo se o path já começa com o slug
  if (url.pathname === `/${slug}` || url.pathname.startsWith(`/${slug}/`)) {
    return NextResponse.next()
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
