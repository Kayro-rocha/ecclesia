import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

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

  const statusLabel: Record<string, string> = {
    NEW: 'Novo',
    RETURNED: 'Retornou',
    MEMBER: 'Virou membro',
    INACTIVE: 'Inativo',
  }

  const statusColor: Record<string, string> = {
    NEW: 'bg-blue-50 text-blue-600',
    RETURNED: 'bg-green-50 text-green-600',
    MEMBER: 'bg-purple-50 text-purple-600',
    INACTIVE: 'bg-gray-100 text-gray-400',
  }

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
          <button type="submit"
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg">
            Filtrar
          </button>
        </form>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-sm text-gray-500">{visitantes.length} visitantes</span>
          </div>

          {visitantes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm mb-2">Nenhum visitante registrado</p>
              <Link href={`/${slug}/visitantes/novo`} className="text-blue-600 text-sm hover:underline">
                Registrar primeiro visitante
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Nome</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Telefone</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Visitas</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Última visita</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Convidado por</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Status</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {visitantes.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold">
                          {v.name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-900">{v.name}</span>
                        {v.wantsHomeVisit && (
                          <span className="text-xs bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded">
                            Quer visita
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{v.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{v.visits}x</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(v.lastVisit).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{v.invitedBy || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor[v.status]}`}>
                        {statusLabel[v.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/${slug}/visitantes/${v.id}`}
                        className="text-xs text-blue-600 hover:underline">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
