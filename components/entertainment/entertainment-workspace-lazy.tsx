'use client'

import dynamic from 'next/dynamic'
import { LoadingState } from '@/components/ui/loading-state'

const EntertainmentWorkspace = dynamic(
  () => import('@/components/entertainment/entertainment-workspace').then((module) => module.EntertainmentWorkspace),
  {
    loading: () => <LoadingState label="جاري تحميل الترفيه" count={3} className="grid gap-4 xl:grid-cols-3" />,
  },
)

export function EntertainmentWorkspaceLazy() {
  return <EntertainmentWorkspace />
}
