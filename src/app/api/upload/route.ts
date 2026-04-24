import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const slug = formData.get('slug') as string | null

  if (!file || !slug) return NextResponse.json({ error: 'Arquivo e slug obrigatórios' }, { status: 400 })

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Slug inválido' }, { status: 400 })
  }

  const user = session.user as any
  if (user.role !== 'MASTER') {
    const church = await import('@/lib/prisma').then(m =>
      m.prisma.church.findUnique({ where: { slug }, select: { id: true } })
    )
    if (!church || church.id !== user.churchId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Apenas imagens são permitidas' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Imagem deve ter no máximo 5MB' }, { status: 400 })
  }

  const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: 'Extensão não permitida. Use jpg, jpeg, png, gif ou webp.' }, { status: 400 })
  }
  const filename = `${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', slug)

  await mkdir(uploadDir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/api/uploads/${slug}/${filename}` })
}
