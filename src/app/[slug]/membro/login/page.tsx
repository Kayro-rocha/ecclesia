import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getMembroSession } from '@/lib/membro-auth'
import MembroLoginForm from './MembroLoginForm'

export const metadata = { title: 'Entrar' }


interface Props { params: Promise<{ slug: string }> }

export default async function MembroLoginPage({ params }: Props) {
  const { slug } = await params
  const session = await getMembroSession()
  if (session && session.slug === slug) redirect(`/${slug}/membro/home`)

  const church = await prisma.church.findUnique({
    where: { slug },
    select: { name: true, primaryColor: true, secondaryColor: true, logoUrl: true },
  })
  if (!church) redirect('/')

  return (
    <MembroLoginForm
      slug={slug}
      churchName={church.name}
      primaryColor={church.primaryColor || '#3b82f6'}
      secondaryColor={church.secondaryColor || '#1e40af'}
      logoUrl={church.logoUrl ?? null}
    />
  )
}
