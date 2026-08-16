'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return

    void navigator.serviceWorker.register('/service-worker.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
      // التطبيق يظل يعمل بالكامل من الشبكة أو localStorage عند تعذر التسجيل.
    })
  }, [])

  return null
}
