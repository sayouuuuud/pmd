'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center p-6">
      <section className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm" role="alert" aria-labelledby="global-error-title">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertTriangle className="h-7 w-7" aria-hidden="true" /></div>
        <h1 id="global-error-title" className="mt-5 text-2xl font-semibold">حصل عطل مؤقت</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">لم نتمكن من تحميل هذه المساحة الآن. جرّب إعادة المحاولة، وإذا استمر العطل يمكنك العودة للوحة التحكم. ستظل بياناتك المحلية محفوظة.</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row"><Button type="button" onClick={() => reset()} size="lg" className="rounded-full"><RefreshCw className="h-4 w-4" aria-hidden="true" /> إعادة المحاولة</Button><Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"><ArrowRight className="h-4 w-4" aria-hidden="true" /> العودة للوحة التحكم</Link></div>
      </section>
    </main>
  )
}
