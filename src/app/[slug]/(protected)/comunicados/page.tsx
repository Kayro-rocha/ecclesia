import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ComunicadosListGestor from './ComunicadosListGestor'

export const metadata = { title: 'Comunicados' }


interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ status?: string; busca?: string }>
}

export default async function ComunicadosPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { status, busca } = await searchParams

  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug }, select: { id: true, name: true } })
  if (!church) redirect('/')

  const comunicados = await prisma.announcement.findMany({
    where: {
      churchId: church.id,
      ...(busca ? { title: { contains: busca } } : {}),
      ...(status === 'enviado' ? { sentAt: { not: null } } : {}),
      ...(status === 'rascunho' ? { sentAt: null } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/dashboard`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Painel</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Comunicados</span>
        </div>
        <Link href={`/${slug}/comunicados/novo`} className="btn-primary">
          + Novo comunicado
        </Link>
      </div>

      <div className="page-content">
        {/* Filtros */}
        <form method="GET" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input name="busca" defaultValue={busca}
            placeholder="Buscar por título..."
            style={{ flex: 1, minWidth: '200px' }} />
          <select name="status" defaultValue={status || 'todos'}>
            <option value="todos">Todos</option>
            <option value="enviado">Enviados</option>
            <option value="rascunho">Rascunhos</option>
          </select>
          <button type="submit" className="btn-primary">Filtrar</button>
        </form>

        <ComunicadosListGestor comunicados={comunicados} slug={slug} churchName={church.name} />
      </div>
    </div>
  )
}
