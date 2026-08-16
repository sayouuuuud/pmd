'use client'

import { useEffect, useState } from 'react'
import { Download, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [updateReady, setUpdateReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const handleControllerChange = () => window.location.reload()

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    void navigator.serviceWorker.register('/service-worker.js', { scope: '/', updateViaCache: 'none' }).then((registration) => {
      const watchInstalling = () => {
        const worker = registration.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdateReady(true)
        })
      }
      watchInstalling()
      registration.addEventListener('updatefound', watchInstalling)
    }).catch(() => {
      // التطبيق يظل يعمل بالكامل من الشبكة أو localStorage عند تعذر التسجيل.
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  async function installApp() {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  function applyUpdate() {
    void navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
    })
  }

  if ((!installPrompt && !updateReady) || dismissed) return null

  return (
    <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm text-foreground shadow-lg" dir="rtl" role="status">
      <div className="flex-1">
        <p className="font-semibold">{updateReady ? 'تحديث جديد جاهز' : 'ثبّت مساحتي على جهازك'}</p>
        <p className="mt-1 text-xs text-muted-foreground">{updateReady ? 'طبّق التحديث الآن لتستخدم آخر تحسينات المنصة.' : 'افتحها بسرعة، واستمر في استخدام بياناتك المحلية عند ضعف الاتصال.'}</p>
      </div>
      <Button type="button" size="sm" onClick={updateReady ? applyUpdate : installApp}>
        {updateReady ? <RefreshCw className="ms-1 h-4 w-4" /> : <Download className="ms-1 h-4 w-4" />}
        {updateReady ? 'تحديث' : 'تثبيت'}
      </Button>
      <Button type="button" size="icon" variant="ghost" aria-label="إخفاء إشعار PWA" onClick={() => setDismissed(true)}>
        <X className="h-4 w-4" />
      </Button>
    </aside>
  )
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
}
