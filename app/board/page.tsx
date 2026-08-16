import { LayoutPanelLeft } from 'lucide-react'
import { BoardWorkspaceLazy } from '@/components/board/board-workspace-lazy'
import { PageShell } from '@/components/layout/page-shell'

export default function BoardPage() {
  return (
    <PageShell
      title="السبورة"
      description="مساحة حرة تحط فيها Sticky Notes وترتب أفكارك بصريًا"
      icon={LayoutPanelLeft}
    >
      <BoardWorkspaceLazy />
    </PageShell>
  )
}
