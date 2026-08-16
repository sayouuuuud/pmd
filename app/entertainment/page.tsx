import { Clapperboard } from 'lucide-react'
import { EntertainmentWorkspaceLazy } from '@/components/entertainment/entertainment-workspace-lazy'
import { PageShell } from '@/components/layout/page-shell'

export default function EntertainmentPage() {
  return (
    <PageShell
      title="الترفيه"
      description="اختار وقت راحتك وسجّل التجارب التي تستحق أن تفتكرها."
      icon={Clapperboard}
    >
      <EntertainmentWorkspaceLazy />
    </PageShell>
  )
}
