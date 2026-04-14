'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  slug: string
  comunicadoId: string
  foiEnviado: boolean
}

export default function ComunicadoActions({ slug, comunicadoId, foiEnviado }: Props) {
  const router = useRouter()

  async function handleDelete() {
    const msg = foiEnviado
      ? 'Este comunicado já foi enviado. Deseja apagar o registro mesmo assim?'
      : 'Deseja apagar este rascunho?'
    if (!confirm(msg)) return

    const res = await fetch(`/api/announcements/${comunicadoId}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
  }

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
      {!foiEnviado && (
        <Link href={`/${slug}/comunicados/${comunicadoId}`} className="btn-secondary"
          style={{ fontSize: '13px', padding: '6px 14px' }}>
          Editar
        </Link>
      )}
      <button onClick={handleDelete}
        style={{
          fontSize: '13px', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
          border: '1.5px solid #fed7d7', background: 'white', color: '#fc8181',
        }}>
        Apagar
      </button>
    </div>
  )
}
