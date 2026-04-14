import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getChurchApiKey, createOrFindAsaasCustomer, createPixCharge, getPixQrCode } from '@/lib/asaas'
import { isValidCpfCnpj } from '@/lib/cpf'

export async function POST(req: NextRequest) {
  const { slug, mes, ano } = await req.json()

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })

  const apiKey = getChurchApiKey(church)
  if (!apiKey) return NextResponse.json({ error: 'Igreja sem chave Asaas configurada' }, { status: 400 })

  const dizimistas = await prisma.member.findMany({
    where: { churchId: church.id, isTither: true, active: true },
  })

  const existentes = await prisma.tithe.findMany({
    where: { churchId: church.id, month: mes, year: ano },
    select: { memberId: true },
  })
  const existentesIds = new Set(existentes.map(t => t.memberId))
  const pendentes = dizimistas.filter(m => !existentesIds.has(m.id))

  const erros: string[] = []
  let gerados = 0

  // Último dia do mês
  const dueDate = new Date(ano, mes, 0).toISOString().split('T')[0]

  for (const member of pendentes) {
    try {
      if (member.cpfCnpj && !isValidCpfCnpj(member.cpfCnpj)) {
        erros.push(`${member.name}: CPF/CNPJ inválido — corrija no cadastro do membro`)
        continue
      }

      const customerId = await createOrFindAsaasCustomer(apiKey, {
        name: member.name,
        phone: member.phone,
        cpfCnpj: member.cpfCnpj,
        email: member.email,
      })

      const charge = await createPixCharge(
        apiKey,
        customerId,
        member.suggestedTithe || 100,
        `Dízimo de ${member.name} — ${mes}/${ano}`,
        dueDate
      )

      // Salva o dízimo imediatamente com o chargeId — QR Code é opcional
      const tithe = await prisma.tithe.create({
        data: {
          churchId: church.id,
          memberId: member.id,
          amount: member.suggestedTithe || 100,
          month: mes,
          year: ano,
          status: 'PENDING',
          asaasChargeId: charge.id,
        },
      })

      // Tenta buscar o QR Code (não bloqueia se falhar)
      try {
        const qr = await getPixQrCode(apiKey, charge.id)
        await prisma.tithe.update({
          where: { id: tithe.id },
          data: { qrCodeBase64: qr.encodedImage },
        })
      } catch {
        // QR Code indisponível agora — pode ser buscado depois
      }

      gerados++
    } catch (err) {
      erros.push(`${member.name}: ${err instanceof Error ? err.message : 'erro'}`)
    }
  }

  return NextResponse.json({ gerados, erros })
}
