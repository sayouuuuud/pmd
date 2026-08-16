'use client'

import dynamic from 'next/dynamic'
import { LoadingState } from '@/components/ui/loading-state'

const JournalWorkspace = dynamic(
  () => import('@/components/journal/journal-workspace').then((module) => module.JournalWorkspace),
  {
    loading: () => <LoadingState label="جاري تحميل اليوميات" count={2} className="grid gap-4 lg:grid-cols-2" />,
  },
)

export function JournalWorkspaceLazy() {
  return <JournalWorkspace />
}
