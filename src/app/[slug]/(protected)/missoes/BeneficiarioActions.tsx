'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  slug: string
  beneficiarioId: string
  nome: string
}

export default function BeneficiarioActions({ slug, beneficiarioId, nome }: Props) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Apagar beneficiário "${nome}"?\n\nEsta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/missions/beneficiaries/${beneficiarioId}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Link href={`/${slug}/missoes/beneficiarios/${beneficiarioId}`}
        style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none' }}>
        Ver
      </Link>
      <button onClick={handleDelete}
        style={{ fontSize: '13px', color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        Apagar
      </button>
    </div>
  )
}
