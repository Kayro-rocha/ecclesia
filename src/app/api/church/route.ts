import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })

  const church = await prisma.church.findUnique({
    where: { slug },
    select: {
      id: true, name: true, slug: true,
      primaryColor: true, secondaryColor: true, logoUrl: true,
      pixKey: true, whatsappInstance: true, phone: true, address: true,
      lat: true, lng: true, checkinRadiusM: true,
    },
  })

  if (!church) return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })
  return NextResponse.json(church)
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=br`
    const res = await fetch(url, { headers: { 'User-Agent': 'Ecclesia/1.0 (contato@ecclesiaa.com)' } })
    const data = await res.json()
    if (data?.[0]?.lat) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {}
  return null
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { slug, name, primaryColor, secondaryColor, logoUrl, pixKey, whatsappInstance, phone, address } = await req.json()

  // Geocodifica o endereço automaticamente via Nominatim
  let coords: { lat: number; lng: number } | undefined
  if (address) {
    const result = await geocode(address)
    if (result) coords = result
  }

  const church = await prisma.church.update({
    where: { slug },
    data: {
      name: name || undefined,
      primaryColor: primaryColor || undefined,
      secondaryColor: secondaryColor || undefined,
      logoUrl: logoUrl !== undefined ? (logoUrl || null) : undefined,
      pixKey: pixKey || null,
      whatsappInstance: whatsappInstance || null,
      phone: phone || null,
      address: address || null,
      lat: coords?.lat,
      lng: coords?.lng,
    },
    select: { id: true, lat: true, lng: true },
  })

  return NextResponse.json(church)
}
