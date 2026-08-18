import { UserRound } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { ClientProfileWorkspace } from '@/components/workspace/client-profile-workspace'

export default function ClientProfilePage() {
  return <PageShell title="ملف العميل" description="نظرة كاملة على العلاقة والمشاريع والدفعات والنشاط" icon={UserRound}>
    <ClientProfileWorkspace />
  </PageShell>
}
