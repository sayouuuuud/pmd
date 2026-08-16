import { Archive as ArchiveIcon } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { ArchiveWorkspace } from '@/components/archive/archive-workspace'

export default function ArchivePage() {
  return (
    <PageShell icon={ArchiveIcon} title="الأرشيف" description="مساحة آمنة للعناصر التي لم تعد تحتاجها الآن، مع إمكانية استعادتها لاحقًا.">
      <ArchiveWorkspace />
    </PageShell>
  )
}
