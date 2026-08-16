export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6" aria-busy="true" aria-label="جاري تحميل المساحة">
      <div className="h-16 animate-pulse rounded-3xl bg-muted" />
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="h-44 animate-pulse rounded-3xl bg-muted" />
        <div className="h-44 animate-pulse rounded-3xl bg-muted" />
        <div className="h-44 animate-pulse rounded-3xl bg-muted" />
      </div>
    </main>
  )
}
