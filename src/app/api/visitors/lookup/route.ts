import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Token assinado: HMAC-SHA256(visitorId + expire, NEXTAUTH_SECRET) — válido por 5 min
function signToken(visitorId: string): string {
  const expire = Math.floor(Date.now() / 1000) + 300 // 5 min
  const payload = `${visitorId}:${expire}`
  const sig = createHmac('sha256', process.env.NEXTAUTH_SECRET!)
    .update(payload)
    .digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split(':')
    if (parts.length !== 3) return null
    const [visitorId, expireStr, sig] = parts
    const expire = parseInt(expireStr, 10)
    if (Math.floor(Date.now() / 1000) > expire) return null
    const expected = createHmac('sha256', process.env.NEXTAUTH_SECRET!)
      .update(`${visitorId}:${expire}`)
      .digest('hex')
    if (sig !== expected) return null
    return visitorId
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const name = searchParams.get('name')

  if (!slug || !name || name.trim().length < 3) {
    return NextResponse.json({ found: false })
  }

  const church = await prisma.church.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (!church) return NextResponse.json({ found: false })

  const normalized = normalizeName(name)

  const visitors = await prisma.visitor.findMany({
    where: { churchId: church.id, flowActive: true },
    select: { id: true, name: true, phone: true },
  })

  const match = visitors.find(v => normalizeName(v.name) === normalized)
  if (!match) return NextResponse.json({ found: false })

  const digits = match.phone.replace(/\D/g, '')
  const phoneTail = digits.slice(-4)

  // Retorna token assinado em vez do ID — o checkin valida o token server-side
  const token = signToken(match.id)

  return NextResponse.json({ found: true, token, phoneTail })
}
