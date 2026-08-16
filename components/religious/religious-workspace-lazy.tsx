'use client'

import dynamic from 'next/dynamic'

const ReligiousWorkspace = dynamic(
  () => import('@/components/religious/religious-workspace').then((module) => module.ReligiousWorkspace),
  {
    loading: () => (
      <div className="grid gap-5 lg:grid-cols-2" aria-busy="true" aria-label="جاري تحميل القسم الديني">
        <div className="h-72 animate-pulse rounded-3xl bg-muted" />
        <div className="h-72 animate-pulse rounded-3xl bg-muted" />
      </div>
    ),
  },
)

export function ReligiousWorkspaceLazy() {
  return <ReligiousWorkspace />
}
