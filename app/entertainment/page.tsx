import { Clapperboard } from 'lucide-react'
import { EntertainmentWorkspace } from '@/components/entertainment/entertainment-workspace'
import { PageShell } from '@/components/layout/page-shell'

export default function EntertainmentPage() {
  return (
    <PageShell
      title="الترفيه"
      description="اختار وقت راحتك وسجّل التجارب التي تستحق أن تفتكرها."
      icon={Clapperboard}
    >
      <EntertainmentWorkspace />
    </PageShell>
  )
}
