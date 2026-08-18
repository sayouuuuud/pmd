import { LayoutDashboard } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { WorkDashboard } from '@/components/workspace/work-dashboard'

export default function WorkspaceDashboardPage() {
  return <PageShell title="لوحة العمل" description="صورة مركزة للعملاء والمشاريع والمهام والدفعات" icon={LayoutDashboard}>
    <WorkDashboard />
  </PageShell>
}
