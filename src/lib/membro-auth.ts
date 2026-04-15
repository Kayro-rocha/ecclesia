import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'membro-secret-fallback')
export const MEMBRO_COOKIE = 'membro_token'

export interface MembroSession {
  memberId: string
  churchId: string
  slug: string
}

export async function signMembroToken(payload: MembroSession): Promise<string> {
  return new SignJWT({ ...payload } as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function getMembroSession(): Promise<MembroSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(MEMBRO_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as MembroSession
  } catch {
    return null
  }
}
