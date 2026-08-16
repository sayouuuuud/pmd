'use client'

import Link from 'next/link'
import { ArrowRight, CloudOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center bg-background p-6">
      <section className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm" role="status" aria-labelledby="offline-title">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CloudOff className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 id="offline-title" className="mt-5 text-2xl font-semibold">أنت غير متصل بالإنترنت</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          لم نتمكن من فتح هذه الصفحة الآن. تحقّق من الاتصال ثم أعد المحاولة. ستظل بياناتك المحلية محفوظة ويمكنك العودة إلى المساحة الرئيسية عند توفرها.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> إعادة المحاولة
          </button>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
            <ArrowRight className="h-4 w-4" aria-hidden="true" /> العودة للمساحة الرئيسية
          </Link>
        </div>
      </section>
    </main>
  )
}
