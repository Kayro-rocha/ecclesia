'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useModal } from '@/lib/useModal'

interface Props {
  slug: string
  missaoId: string
  titulo: string
}

export default function MissaoActions({ slug, missaoId, titulo }: Props) {
  const router = useRouter()
  const { confirm, modalNode } = useModal()

  async function handleDelete() {
    if (!await confirm(`Apagar campanha "${titulo}"?`, { title: 'Apagar campanha', confirmText: 'Apagar', variant: 'danger' })) return
    const res = await fetch(`/api/missions/${missaoId}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/${slug}/missoes/${missaoId}`}
          style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none' }}>
          Ver detalhes →
        </Link>
        <button onClick={handleDelete}
          style={{ fontSize: '13px', color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Apagar
        </button>
      </div>
      {modalNode}
    </>
  )
}
