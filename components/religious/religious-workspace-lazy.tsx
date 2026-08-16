'use client'

import dynamic from 'next/dynamic'
import { LoadingState } from '@/components/ui/loading-state'

const ReligiousWorkspace = dynamic(
  () => import('@/components/religious/religious-workspace').then((module) => module.ReligiousWorkspace),
  {
    loading: () => <LoadingState label="جاري تحميل القسم الديني" count={2} className="grid gap-5 lg:grid-cols-2" />,
  },
)

export function ReligiousWorkspaceLazy() {
  return <ReligiousWorkspace />
}
