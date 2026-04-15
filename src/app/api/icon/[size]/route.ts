import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1a1a2e"/>
  <text x="256" y="310" font-size="280" text-anchor="middle" font-family="serif">⛪</text>
</svg>`

export async function GET(_req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params
  const px = size === '512' ? 512 : 192

  const buf = await sharp(Buffer.from(SVG)).resize(px, px).png().toBuffer()
  const png = new Uint8Array(buf)

  return new NextResponse(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
