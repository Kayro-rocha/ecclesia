import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import EscalaActions from './EscalaActions'

export const metadata = { title: 'Escalas' }


interface Props {
  params: Promise<{ slug: string }>
}

export default async function EscalasPage({ params }: Props) {
  const { slug } = await params

  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const escalas = await prisma.schedule.findMany({
    where: { churchId: church.id },
    include: { items: { include: { member: true } } },
    orderBy: { date: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${slug}/dashboard`} className="text-gray-400 hover:text-gray-600 text-sm">← Painel</Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-900">Escalas</span>
        </div>
        <Link
          href={`/${slug}/escalas/nova`}
          className="text-white text-sm px-4 py-2 rounded-lg hover:opacity-90"
          style={{ background: church.primaryColor }}
        >
          + Nova escala
        </Link>
      </div>

      <div className="p-6">
        {escalas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-sm mb-2">Nenhuma escala criada ainda</p>
            <Link href={`/${slug}/escalas/nova`} className="text-blue-600 text-sm hover:underline">
              Criar primeira escala
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {escalas.map((e) => {
              const confirmados = e.items.filter(i => i.confirmed).length
              return (
                <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{e.title}</p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {new Date(e.date).toLocaleDateString('pt-BR', {
                          weekday: 'long', day: '2-digit', month: 'long'
                        })} · {e.department}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.sentViaWhatsapp && (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
                          Enviado
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                        {confirmados}/{e.items.length} confirmados
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {e.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.confirmed ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-700">{item.member.name}</span>
                        <span className="text-xs text-gray-400">· {item.role}</span>
                      </div>
                    ))}
                  </div>
                  <EscalaActions
                    slug={slug}
                    escalaId={e.id}
                    foiEnviada={e.sentViaWhatsapp}
                    temVoluntarios={e.items.length > 0}
                    title={e.title}
                    date={e.date.toISOString()}
                    department={e.department}
                    membros={e.items.map(i => i.member.name)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
