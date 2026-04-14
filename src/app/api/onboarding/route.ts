import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAsaasSubaccount, registerAsaasWebhook } from '@/lib/asaas'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { churchName, slug, pastorName, email, password, phone, cpfCnpj, postalCode, birthDate, incomeValue } = body

    if (!churchName || !slug || !pastorName || !email || !password || !phone || !cpfCnpj) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // Verifica se o slug já existe
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

    // Cria subconta no Asaas (dinheiro dos dízimos cai na conta da igreja)
    let asaasAccountId: string | null = null
    let asaasApiKey: string | null = null

    try {
      const subconta = await createAsaasSubaccount({
        name: churchName,
        email,
        cpfCnpj,
        mobilePhone: phone,
        postalCode,
        birthDate,
        incomeValue: incomeValue ? parseFloat(incomeValue) : 0,
      })
      asaasAccountId = subconta.id
      asaasApiKey = subconta.apiKey

      // Registra webhook na subconta para receber eventos de pagamento
      const webhookUrl = `https://${process.env.NEXT_PUBLIC_APP_DOMAIN}/api/webhooks/asaas`
      await registerAsaasWebhook(subconta.apiKey, webhookUrl, process.env.ASAAS_WEBHOOK_TOKEN || undefined)
    } catch (err) {
      // Em sandbox pode falhar por CPF inválido — não bloqueia o cadastro
      console.error('Erro ao criar subconta Asaas:', err)
    }

    // Cria a igreja no banco
    const church = await prisma.church.create({
      data: {
        name: churchName,
        slug,
        cpfCnpj: cpfClean,
        asaasAccountId,
        asaasApiKey,
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

    return NextResponse.json({ slug: church.slug }, { status: 201 })
  } catch (err) {
    console.error('Erro no onboarding:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Verifica disponibilidade do slug em tempo real
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ available: false })

  const existing = await prisma.church.findUnique({ where: { slug } })
  return NextResponse.json({ available: !existing })
}
