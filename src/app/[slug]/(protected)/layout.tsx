import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SidebarLayout from './SidebarLayout'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const church = await prisma.church.findUnique({ where: { slug }, select: { name: true } })
  const name = church?.name ?? 'Ecclesia'
  return { title: { template: `%s | ${name}`, default: name } }
}

export default async function SlugLayout({ children, params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions)

  if (!session) redirect(`/${slug}/login`)

  const userChurchId = (session.user as any).churchId as string | null

  const church = await prisma.church.findUnique({
    where: { slug },
    select: { id: true, name: true, primaryColor: true, logoUrl: true, active: true, plan: true, parentChurchId: true },
  })
  if (!church) redirect('/')

  // Verifica se o usuário tem acesso: própria igreja ou filial da sua rede
  const isOwnChurch = church.id === userChurchId
  const isOwnFilial = !!church.parentChurchId && church.parentChurchId === userChurchId
  if (!isOwnChurch && !isOwnFilial) redirect(`/${slug}/login`)

  const primaryColor = church.primaryColor || '#2563eb'
  const logoUrl = church.logoUrl ?? null

  if (!church.active) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '48px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #edf2f7' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px' }}>Conta suspensa</h1>
          <p style={{ color: '#718096', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
            O acesso ao painel foi suspenso por falta de pagamento da assinatura.<br />
            Regularize o pagamento para restaurar o acesso.
          </p>
          <p style={{ color: '#a0aec0', fontSize: '12px', margin: 0 }}>
            Dúvidas? Entre em contato com o suporte.
          </p>
        </div>
      </div>
    )
  }

  const userRole = (session.user as any).role as string
  const userPermissions = (session.user as any).permissions as string[] | null

  // Se o pastor geral está acessando uma filial, busca o slug da sede para o botão "Voltar"
  let sedeSlug: string | null = null
  if (isOwnFilial && userChurchId) {
    const sede = await prisma.church.findUnique({ where: { id: userChurchId }, select: { slug: true } })
    sedeSlug = sede?.slug ?? null
  }

  const isRedeChurch = church.plan === 'REDE' && isOwnChurch

  return (
    <>
      <style>{`
        :root {
          --primary: ${primaryColor};
          --primary-dark: ${primaryColor}dd;
          --primary-light: ${primaryColor}18;
        }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fb; color: #1a1a2e; margin: 0; }
        input, select, textarea {
          color: #1a1a2e !important;
          background: #ffffff !important;
          border: 1.5px solid #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 10px 12px !important;
          font-size: 14px !important;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus, select:focus, textarea:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px var(--primary-light) !important;
        }
        input::placeholder, textarea::placeholder { color: #a0aec0 !important; }
        label { color: #4a5568; font-size: 13px; font-weight: 500; display: block; margin-bottom: 6px; }
        .card { background: white; border-radius: 12px; border: 1px solid #edf2f7; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
        .nav-link { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; font-size: 13px; color: #4a5568; text-decoration: none; margin-bottom: 2px; transition: all 0.15s; white-space: nowrap; }
        .nav-link:hover { background: #f7fafc; color: #1a1a2e; }
        .page-header { padding: 16px 32px; background: white; border-bottom: 1px solid #edf2f7; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 5; box-shadow: 0 1px 6px rgba(0,0,0,0.04); }
        .page-content { padding: 32px; width: 100%; }
        .btn-primary { background: var(--primary) !important; color: white !important; border: none !important; padding: 10px 20px !important; border-radius: 8px !important; font-size: 14px !important; font-weight: 500 !important; cursor: pointer !important; text-decoration: none; display: inline-block; }
        .btn-secondary { background: white !important; color: #4a5568 !important; border: 1.5px solid #e2e8f0 !important; padding: 10px 20px !important; border-radius: 8px !important; font-size: 14px !important; cursor: pointer !important; text-decoration: none; display: inline-block; }
        .badge-green { background: #f0fff4; color: #276749; font-size: 12px; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        .badge-yellow { background: #fffff0; color: #744210; font-size: 12px; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        .badge-red { background: #fff5f5; color: #742a2a; font-size: 12px; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        .badge-blue { background: var(--primary-light); color: var(--primary); font-size: 12px; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        .badge-gray { background: #f7fafc; color: #718096; font-size: 12px; padding: 3px 10px; border-radius: 20px; display: inline-block; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-size: 12px; color: #a0aec0; font-weight: 500; padding: 8px 16px; border-bottom: 1px solid #edf2f7; }
        td { padding: 12px 16px; border-bottom: 1px solid #f7fafc; font-size: 14px; color: #1a1a2e; }
        tr:hover td { background: #fafbfc; }
        form { width: 100%; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      <SidebarLayout
        slug={slug}
        churchName={church.name}
        primaryColor={primaryColor}
        logoUrl={logoUrl}
        userName={session.user?.name || ''}
        userRole={userRole}
        userPermissions={userPermissions}
        isRedeChurch={isRedeChurch}
        sedeSlug={sedeSlug}
      >
        {children}
      </SidebarLayout>
    </>
  )
}