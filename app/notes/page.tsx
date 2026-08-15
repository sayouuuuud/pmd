import { StickyNote } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'

export default function NotesPage() {
  return (
    <PageShell
      title="الملاحظات"
      description="دوّن أفكارك بسرعة، صنّفها، وثبّت المهم منها"
      icon={StickyNote}
    />
  )
}
