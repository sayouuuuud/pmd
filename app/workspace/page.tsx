import { BriefcaseBusiness } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { WorkspaceWorkspace } from '@/components/workspace/workspace-workspace'

export default function WorkspacePage() {
  return (
    <PageShell
      title="مساحة العمل"
      description="نظّم عملاءك ومساحاتك المهنية بجانب نظامك الشخصي"
      icon={BriefcaseBusiness}
    >
      <WorkspaceWorkspace />
    </PageShell>
  )
}
