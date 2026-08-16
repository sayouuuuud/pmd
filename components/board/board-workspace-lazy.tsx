'use client'

import dynamic from 'next/dynamic'
import { LoadingState } from '@/components/ui/loading-state'

const BoardWorkspace = dynamic(
  () => import('@/components/board/board-workspace').then((module) => module.BoardWorkspace),
  {
    loading: () => <LoadingState label="جاري تحميل السبورة" count={4} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" />,
  },
)

export function BoardWorkspaceLazy() {
  return <BoardWorkspace />
}
