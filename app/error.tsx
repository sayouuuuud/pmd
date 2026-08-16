'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center p-6">
      <section className="w-full rounded-3xl bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">!</div>
        <h1 className="mt-5 text-2xl font-semibold">حصل عطل مؤقت</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">لم نتمكن من تحميل هذه المساحة الآن. جرّب إعادة المحاولة، وستظل بياناتك المحلية محفوظة.</p>
        <button type="button" onClick={() => reset()} className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">إعادة المحاولة</button>
      </section>
    </main>
  )
}
