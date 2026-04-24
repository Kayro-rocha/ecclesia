import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LoginForm from './LoginForm'

export const metadata = { title: 'Entrar' }


interface Props { params: Promise<{ slug: string }> }

export default async function LoginPage({ params }: Props) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  if (session) redirect(`/${slug}/dashboard`)

  const church = await prisma.church.findUnique({
    where: { slug },
    select: { name: true, primaryColor: true, secondaryColor: true, logoUrl: true },
  })
  if (!church) redirect('/')

  return (
    <LoginForm
      slug={slug}
      churchName={church.name}
      primaryColor={church.primaryColor || '#2563eb'}
      secondaryColor={church.secondaryColor || '#1e40af'}
      logoUrl={church.logoUrl ?? null}
    />
  )
}
