import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const filePath = path.join(process.cwd(), 'public', 'uploads', ...segments)

  try {
    const buffer = await readFile(filePath)
    const ext = segments[segments.length - 1].split('.').pop()?.toLowerCase() || 'jpg'
    const mime: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg',
      png: 'image/png', webp: 'image/webp', gif: 'image/gif',
    }
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mime[ext] || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
