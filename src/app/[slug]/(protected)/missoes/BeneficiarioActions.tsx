'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useModal } from '@/lib/useModal'

interface Props {
  slug: string
  beneficiarioId: string
  nome: string
}

export default function BeneficiarioActions({ slug, beneficiarioId, nome }: Props) {
  const router = useRouter()
  const { confirm, modalNode } = useModal()

  async function handleDelete() {
    if (!await confirm(`Apagar beneficiário "${nome}"?`, { title: 'Apagar beneficiário', confirmText: 'Apagar', variant: 'danger' })) return
    const res = await fetch(`/api/missions/beneficiaries/${beneficiarioId}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
  }

  return (
    <>
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
      {modalNode}
    </>
  )
}
