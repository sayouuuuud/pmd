'use client'

import { AlertCircle, CheckCircle2, CloudUpload, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useCommandCenter } from '@/lib/command-center-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function SyncStatus() {
  const { syncOperations, retryFailedSyncs } = useCommandCenter()
  const [retrying, setRetrying] = useState(false)
  const failed = syncOperations.filter((item) => item.status === 'failed')
  const pending = syncOperations.filter((item) => item.status === 'pending')

  async function retry() {
    setRetrying(true)
    try {
      await retryFailedSyncs()
    } finally {
      setRetrying(false)
    }
  }

  if (!syncOperations.length) {
    return (
      <Badge variant="positive" role="status" aria-live="polite">
        <CheckCircle2 data-icon="inline-start" />
        البيانات متزامنة
      </Badge>
    )
  }

  if (failed.length) {
    return (
      <div className="flex flex-wrap items-center gap-2" role="alert" aria-live="assertive">
        <Badge variant="destructive">
          <AlertCircle data-icon="inline-start" />
          {failed.length} تغييرات محفوظة محليًا ولم تتزامن
        </Badge>
        <Button type="button" size="sm" variant="outline" onClick={retry} disabled={retrying}>
          <RefreshCw data-icon="inline-start" className={retrying ? 'animate-spin' : undefined} />
          {retrying ? 'جارٍ إعادة المحاولة' : 'إعادة المحاولة'}
        </Button>
      </div>
    )
  }

  return (
    <Badge variant="warning" role="status" aria-live="polite">
      <CloudUpload data-icon="inline-start" />
      مزامنة {pending.length} تغييرات
    </Badge>
  )
}
