'use client'

import dynamic from 'next/dynamic'

const BoardWorkspace = dynamic(
  () => import('@/components/board/board-workspace').then((module) => module.BoardWorkspace),
  {
    loading: () => (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="جاري تحميل السبورة">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="min-h-[300px] animate-pulse rounded-3xl bg-muted" />
        ))}
      </div>
    ),
  },
)

export function BoardWorkspaceLazy() {
  return <BoardWorkspace />
}
