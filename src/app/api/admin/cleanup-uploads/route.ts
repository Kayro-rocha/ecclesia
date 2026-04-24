import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat, unlink } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { deleteUpload } from '@/lib/delete-upload'

const CLEANUP_SECRET = process.env.CLEANUP_SECRET
const ORPHAN_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000 // 90 dias
const EXPIRED_GRACE_MS  =  7 * 24 * 60 * 60 * 1000 //  7 dias após a data

/**
 * Coleta todos os imageUrl atualmente referenciados no banco.
 * Retorna um Set com chaves no formato "slug/arquivo.ext"
 */
async function getReferencedImages(): Promise<Set<string>> {
  const [events, announcements] = await Promise.all([
    prisma.event.findMany({ select: { imageUrl: true } }),
    prisma.announcement.findMany({ select: { imageUrl: true } }),
  ])

  const referenced = new Set<string>()
  for (const r of [...events, ...announcements]) {
    if (!r.imageUrl) continue
    const key = r.imageUrl
      .replace(/^\/api\/uploads\//, '')
      .replace(/^\/uploads\//, '')
    referenced.add(key)
  }
  return referenced
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!CLEANUP_SECRET || authHeader !== `Bearer ${CLEANUP_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const now = new Date()
  const cutoff = new Date(now.getTime() - EXPIRED_GRACE_MS)

  // ── 1. Deletar eventos cuja data passou há mais de 7 dias ────────────────
  const expiredEvents = await prisma.event.findMany({
    where: { date: { lt: cutoff } },
    select: { id: true, imageUrl: true },
  })

  const deletedEvents: string[] = []
  for (const ev of expiredEvents) {
    await prisma.eventAttendee.deleteMany({ where: { eventId: ev.id } })
    await prisma.event.delete({ where: { id: ev.id } })
    await deleteUpload(ev.imageUrl ?? null)
    deletedEvents.push(ev.id)
  }

  // ── 2. Deletar comunicados enviados cujo sentAt passou há mais de 7 dias ─
  const expiredAnnouncements = await prisma.announcement.findMany({
    where: { sentAt: { lt: cutoff } },
    select: { id: true, imageUrl: true },
  })

  const deletedAnnouncements: string[] = []
  for (const an of expiredAnnouncements) {
    await prisma.announcement.delete({ where: { id: an.id } })
    await deleteUpload(an.imageUrl ?? null)
    deletedAnnouncements.push(an.id)
  }

  // ── 3. Deletar arquivos órfãos no disco com mais de 90 dias ──────────────
  const referenced = await getReferencedImages()
  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads')
  const deletedOrphans: string[] = []
  const orphanErrors: string[] = []

  let slugDirs: string[]
  try {
    slugDirs = await readdir(uploadsRoot)
  } catch {
    slugDirs = []
  }

  for (const slugDir of slugDirs) {
    const slugPath = path.join(uploadsRoot, slugDir)
    let files: string[]
    try {
      files = await readdir(slugPath)
    } catch {
      continue
    }

    for (const file of files) {
      const key = `${slugDir}/${file}`
      if (referenced.has(key)) continue

      try {
        const info = await stat(path.join(slugPath, file))
        if (now.getTime() - info.mtimeMs > ORPHAN_MAX_AGE_MS) {
          await unlink(path.join(slugPath, file))
          deletedOrphans.push(key)
        }
      } catch (err) {
        orphanErrors.push(`${key}: ${String(err)}`)
      }
    }
  }

  return NextResponse.json({
    deletedEvents,
    deletedAnnouncements,
    deletedOrphans,
    orphanErrors,
    summary: {
      events: deletedEvents.length,
      announcements: deletedAnnouncements.length,
      orphans: deletedOrphans.length,
    },
  })
}
