'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  slug: string
  escalaId: string
  foiEnviada: boolean
  temVoluntarios: boolean
  title: string
  date: string
  department: string
  membros: string[]
}

export default function EscalaActions({ slug, escalaId, foiEnviada, temVoluntarios, title, date, department, membros }: Props) {
  const router = useRouter()
  const [notifying, setNotifying] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleNotify() {
    const dataFormatada = new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    const membrosText = membros.length > 0 ? `\nEscalados: ${membros.slice(0, 3).join(', ')}${membros.length > 3 ? ` e mais ${membros.length - 3}` : ''}` : ''

    if (!confirm(`Enviar notificação push para os membros sobre a escala "${title}"?`)) return

    setNotifying(true)
    setResult(null)

    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        title: `📅 Escala: ${title}`,
        body: `${dataFormatada} · ${department}${membrosText}`,
        url: `/${slug}/escalas`,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      // Marca como notificado
      await fetch(`/api/schedules/${escalaId}`, { method: 'PATCH' })
      setResult(data.sent === 0 ? 'Nenhum membro com notificações ativas.' : `Notificado para ${data.sent} membro(s)!`)
      router.refresh()
    }

    setNotifying(false)
  }

  async function handleDelete() {
    const msg = foiEnviada
      ? 'Esta escala já foi notificada. Deseja apagar mesmo assim?'
      : 'Deseja apagar esta escala?'

    if (!confirm(msg)) return

    const res = await fetch(`/api/schedules/${escalaId}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
  }

  return (
    <div>
      <div className="flex gap-2">
        <Link
          href={`/${slug}/escalas/${escalaId}`}
          className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          Editar
        </Link>
        {!foiEnviada && temVoluntarios && (
          <button
            onClick={handleNotify}
            disabled={notifying}
            className="text-xs text-white px-3 py-1.5 rounded-lg hover:opacity-90"
            style={{ background: '#7c3aed', opacity: notifying ? 0.7 : 1 }}
          >
            {notifying ? 'Enviando...' : '🔔 Notificar membros'}
          </button>
        )}
        {foiEnviada && (
          <span className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg">
            ✓ Notificado
          </span>
        )}
        <button
          onClick={handleDelete}
          className="text-xs border border-red-100 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600"
        >
          Apagar
        </button>
      </div>
      {result && (
        <p className="text-xs text-gray-400 mt-2">{result}</p>
      )}
    </div>
  )
}
