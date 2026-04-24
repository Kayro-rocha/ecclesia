import { Suspense } from 'react'
import EcclesiaLoginForm from './EcclesiaLoginForm'

export const metadata = { title: 'Entrar' }


export default function MembroLoginGenericoPage() {
  return (
    <Suspense>
      <EcclesiaLoginForm />
    </Suspense>
  )
}
