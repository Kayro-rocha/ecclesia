import { unlink } from 'fs/promises'
import path from 'path'

/**
 * Deleta uma imagem do disco a partir da URL salva no banco.
 * Aceita tanto /uploads/slug/file quanto /api/uploads/slug/file.
 * Falha silenciosa — não lança erro se o arquivo não existir.
 */
export async function deleteUpload(imageUrl: string | null) {
  if (!imageUrl) return

  // Normaliza: /api/uploads/slug/file → /uploads/slug/file
  const normalized = imageUrl.replace(/^\/api\/uploads\//, '/uploads/')

  if (!normalized.startsWith('/uploads/')) return

  const filePath = path.join(process.cwd(), 'public', normalized)
  await unlink(filePath).catch(() => {})
}
