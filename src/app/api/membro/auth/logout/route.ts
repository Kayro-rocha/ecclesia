import { NextResponse } from 'next/server'
import { MEMBRO_COOKIE } from '@/lib/membro-auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(MEMBRO_COOKIE, '', { maxAge: 0, path: '/' })
  return res
}
