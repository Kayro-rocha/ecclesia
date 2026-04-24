import { prisma } from '@/lib/prisma'
import NovoComunicadoForm from './NovoComunicadoForm'

export const metadata = { title: 'Novo Comunicado' }


interface Props { params: Promise<{ slug: string }> }

export default async function NovoComunicadoPage({ params }: Props) {
  const { slug } = await params
  const church = await prisma.church.findUnique({
    where: { slug },
    select: { name: true },
  })
  return <NovoComunicadoForm slug={slug} churchName={church?.name || 'Igreja'} />
}
