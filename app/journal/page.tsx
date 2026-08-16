import { BookHeart } from 'lucide-react'
import { JournalWorkspaceLazy } from '@/components/journal/journal-workspace-lazy'
import { PageShell } from '@/components/layout/page-shell'

export default function JournalPage() {
  return (
    <PageShell
      title="اليوميات"
      description="دوّن يومك ومزاجك، وارجع لأي يوم فات وقتما تحب"
      icon={BookHeart}
    >
      <JournalWorkspaceLazy />
    </PageShell>
  )
}
