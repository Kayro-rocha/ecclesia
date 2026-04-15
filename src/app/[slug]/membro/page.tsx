import { redirect } from 'next/navigation'

interface Props { params: Promise<{ slug: string }> }

export default async function MembroRootPage({ params }: Props) {
  const { slug } = await params
  // A checagem de auth acontece no (app)/layout.tsx
  redirect(`/${slug}/membro/home`)
}
