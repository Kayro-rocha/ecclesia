import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DizimoClient from './DizimoClient'

export const metadata = { title: 'Dízimo' }

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ mes?: string; ano?: string }>
}

export default async function DizimoPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { mes, ano } = await searchParams

  const session = await getServerSession(authOptions)
  if (!session) redirect(`/${slug}/login`)

  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) redirect('/')

  const hoje = new Date()
  const month = mes ? parseInt(mes) : hoje.getMonth() + 1
  const year = ano ? parseInt(ano) : hoje.getFullYear()

  return <DizimoClient slug={slug} initialMonth={month} initialYear={year} />
}
