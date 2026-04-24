import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import VisitantesTabela from './VisitantesTabela'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ status?: string; busca?: string }>
}

export default async function VisitantesPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { status, busca } = await searchParams

  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const visitantes = await prisma.visitor.findMany({
    where: {
      churchId: church.id,
      ...(status && status !== 'todos' ? { status: status as any } : {}),
      ...(busca ? { name: { contains: busca } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${slug}/dashboard`} className="text-gray-400 hover:text-gray-600 text-sm">← Painel</Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-900">Visitantes</span>
        </div>
        <Link
          href={`/${slug}/visitantes/novo`}
          className="text-white text-sm px-4 py-2 rounded-lg hover:opacity-90"
          style={{ background: church.primaryColor }}
        >
          + Registrar visitante
        </Link>
      </div>

      <div className="p-6">
        <form method="GET" className="flex gap-3 mb-6 flex-wrap">
          <input name="busca" defaultValue={busca} placeholder="Buscar por nome..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:border-blue-400" />
          <select name="status" defaultValue={status || 'todos'}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="todos">Todos</option>
            <option value="NEW">Novos</option>
            <option value="RETURNED">Retornaram</option>
            <option value="MEMBER">Viraram membros</option>
            <option value="INACTIVE">Inativos</option>
          </select>
          <button type="submit" className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg">
            Filtrar
          </button>
        </form>

        <VisitantesTabela
          visitors={visitantes.map(v => ({ ...v, lastVisit: v.lastVisit.toISOString(), createdAt: v.createdAt.toISOString() }))}
          slug={slug}
        />
      </div>
    </div>
  )
}
