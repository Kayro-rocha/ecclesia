import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { churchName, slug, pastorName, email, password, phone, cpfCnpj, postalCode, birthDate, incomeValue } = body

    if (!churchName || !slug || !pastorName || !email || !password || !phone || !cpfCnpj) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // Verifica slugs reservados e unicidade
    if (RESERVED_SLUGS.has(slug)) {
      return NextResponse.json({ error: 'Este subdomínio é reservado. Escolha outro.' }, { status: 409 })
    }
    const existing = await prisma.church.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Este subdomínio já está em uso' }, { status: 409 })
    }

    // Verifica se o e-mail já está cadastrado
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado. Use outro e-mail.' }, { status: 409 })
    }

    // Verifica se o CPF/CNPJ já está em uso
    const cpfClean = cpfCnpj.replace(/\D/g, '')
    const existingCpf = await prisma.church.findUnique({ where: { cpfCnpj: cpfClean } })
    if (existingCpf) {
      return NextResponse.json({ error: 'Este CPF/CNPJ já está cadastrado.' }, { status: 409 })
    }

    // Cria a igreja no banco
    const church = await prisma.church.create({
      data: {
        name: churchName,
        slug,
        cpfCnpj: cpfClean,
      },
    })

    // Cria o usuário pastor vinculado à igreja
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        churchId: church.id,
        name: pastorName,
        email,
        password: hashedPassword,
        role: 'PASTOR',
      },
    })

    // Marca token como usado
    if (body.token) {
      await prisma.onboardingToken.updateMany({
        where: { token: body.token, usedAt: null },
        data: { usedAt: new Date() },
      })
    }

    // Email de boas-vindas (não bloqueia resposta se falhar)
    sendWelcomeEmail(email, churchName, slug).catch(err =>
      console.error('[onboarding] Erro ao enviar email de boas-vindas:', err)
    )

    return NextResponse.json({ slug: church.slug }, { status: 201 })
  } catch (err) {
    console.error('Erro no onboarding:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

const RESERVED_SLUGS = new Set([
  'membro', 'login', 'logout', 'cadastro', 'api', 'admin', 'app',
  'www', 'static', 'public', 'dashboard', 'webhook', 'webhooks',
  'auth', 'oauth', 'signup', 'register', 'onboarding', 'billing',
  'support', 'suporte', 'ajuda', 'help', 'status', 'health',
  'ecclesia', 'sistema', 'painel',
])

// Verifica disponibilidade do slug em tempo real
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug || slug.length < 3) return NextResponse.json({ available: false })

  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({ available: false, reserved: true })
  }

  const existing = await prisma.church.findUnique({ where: { slug } })
  return NextResponse.json({ available: !existing })
}
