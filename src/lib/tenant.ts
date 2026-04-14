import { prisma } from './prisma'
import { Church } from '@prisma/client'

export async function getChurchBySlug(slug: string): Promise<Church | null> {
  try {
    const church = await prisma.church.findUnique({
      where: { slug, active: true },
    })
    return church
  } catch {
    return null
  }
}

export async function getChurchFromRequest(
  slug: string | null
): Promise<Church | null> {
  if (!slug) return null
  return getChurchBySlug(slug)
}