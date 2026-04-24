import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata = { title: 'Membros' }


interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ busca?: string; grupo?: string; status?: string }>
}

export default async function MembrosPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { busca, grupo, status } = await searchParams

  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const membros = await prisma.member.findMany({
    where: {
      churchId: church.id,
      ...(status === 'inativo' ? { active: false } : { active: true }),
      ...(grupo ? { group: grupo } : {}),
      ...(busca ? {
        OR: [
          { name: { contains: busca } },
          { phone: { contains: busca } },
        ]
      } : {}),
    },
    orderBy: { name: 'asc' },
  })

  const grupos = await prisma.member.findMany({
    where: { churchId: church.id },
    select: { group: true },
    distinct: ['group'],
  })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/${slug}/dashboard`} style={{ color: '#a0aec0', textDecoration: 'none', fontSize: '14px' }}>← Painel</Link>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '16px' }}>Membros</span>
        </div>
        <Link href={`/${slug}/membros/novo`} className="btn-primary">
          + Novo membro
        </Link>
      </div>

      <div className="page-content">
        <form method="GET" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input name="busca" defaultValue={busca} placeholder="Buscar por nome ou telefone..."
            style={{ flex: 1, minWidth: '200px' }} />
          <select name="grupo" defaultValue={grupo} style={{ width: '180px' }}>
            <option value="">Todos os grupos</option>
            {grupos.map((g) => g.group && (
              <option key={g.group} value={g.group}>{g.group}</option>
            ))}
          </select>
          <select name="status" defaultValue={status} style={{ width: '140px' }}>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
          <button type="submit" style={{
            background: '#1a1a2e', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
          }}>
            Filtrar
          </button>
        </form>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #edf2f7' }}>
            <span style={{ fontSize: '13px', color: '#a0aec0' }}>{membros.length} membros encontrados</span>
          </div>

          {membros.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '12px' }}>Nenhum membro encontrado</p>
              <Link href={`/${slug}/membros/novo`} style={{ color: 'var(--primary)', fontSize: '14px' }}>
                Cadastrar primeiro membro
              </Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Grupo</th>
                  <th>Função</th>
                  <th>Dízimo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {membros.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'var(--primary-light)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: 'var(--primary)', fontSize: '13px', fontWeight: '600', flexShrink: 0,
                        }}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '500' }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#718096' }}>{m.phone}</td>
                    <td style={{ color: '#718096' }}>{m.group || '—'}</td>
                    <td><span className="badge-gray">{m.role}</span></td>
                    <td>
                      {m.isTither
                        ? <span className="badge-green">Dizimista</span>
                        : <span className="badge-gray">Não</span>
                      }
                    </td>
                    <td>
                      <Link href={`/${slug}/membros/${m.id}`}
                        style={{ color: 'var(--primary)', fontSize: '13px', textDecoration: 'none' }}>
                        Editar
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