import { LoadingState } from '@/components/ui/loading-state'

export default function Loading() {
  return (
    <main id="main-content" aria-labelledby="loading-title" className="mx-auto max-w-7xl p-4 md:p-6">
      <h1 id="loading-title" className="sr-only">جاري تحميل الصفحة</h1>
      <LoadingState label="جاري تحميل الصفحة" count={4} />
    </main>
  )
}
