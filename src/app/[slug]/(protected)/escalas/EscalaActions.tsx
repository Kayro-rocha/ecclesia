'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  slug: string
  escalaId: string
  foiEnviada: boolean
  temVoluntarios: boolean
}

export default function EscalaActions({ slug, escalaId, foiEnviada, temVoluntarios }: Props) {
  const router = useRouter()

  async function handleDelete() {
    const msg = foiEnviada
      ? 'Esta escala já foi enviada via WhatsApp. Deseja apagar mesmo assim?'
      : 'Deseja apagar esta escala?'

    if (!confirm(msg)) return

    const res = await fetch(`/api/schedules/${escalaId}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
  }

  return (
    <div className="flex gap-2">
      <Link
        href={`/${slug}/escalas/${escalaId}`}
        className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
      >
        Editar
      </Link>
      {!foiEnviada && temVoluntarios && (
        <Link
          href={`/${slug}/escalas/${escalaId}/enviar`}
          className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600"
        >
          Enviar via WhatsApp
        </Link>
      )}
      <button
        onClick={handleDelete}
        className="text-xs border border-red-100 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600"
      >
        Apagar
      </button>
    </div>
  )
}
