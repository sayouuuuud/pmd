import { Target } from 'lucide-react'
import { GoalsWorkspace } from '@/components/goals/goals-workspace'
import { PageShell } from '@/components/layout/page-shell'

export default function GoalsPage() {
  return <PageShell title="الأهداف" description="أهدافك الكبيرة مقسّمة لمشاريع صغيرة، مع نسبة تقدم واضحة" icon={Target}>
    <GoalsWorkspace />
  </PageShell>
}
