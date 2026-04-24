'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_RECEIVED') router.refresh()
    }
    navigator.serviceWorker?.addEventListener('message', onMessage)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      navigator.serviceWorker?.removeEventListener('message', onMessage)
    }
  }, [router])

  return null
}
