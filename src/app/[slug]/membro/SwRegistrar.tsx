'use client'

import { useEffect } from 'react'

export default function SwRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/api/sw', { scope: '/' }).catch(() => {})
    }
  }, [])
  return null
}
