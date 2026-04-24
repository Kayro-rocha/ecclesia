import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import FinanceiroClient from './FinanceiroClient'

export const metadata = { title: 'Financeiro' }


interface Props {
  params: Promise<{ slug: string }>
}

export default async function FinanceiroPage({ params }: Props) {
  const { slug } = await params

  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  return <FinanceiroClient slug={slug} />
}
