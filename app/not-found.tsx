'use client'

import Link from 'next/link'
import { ArrowRight, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center p-6">
      <section className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm" role="status" aria-labelledby="not-found-title">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-5 text-sm font-semibold text-primary">404</p>
        <h1 id="not-found-title" className="mt-2 text-2xl font-semibold">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">يبدو أن الرابط تغيّر أو أن الصفحة لم تعد متاحة. يمكنك العودة إلى مساحتك ومتابعة يومك.</p>
        <Link href="/" className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          العودة للرئيسية
        </Link>
      </section>
    </main>
  )
}
