import { StickyNote } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { NotesWorkspace } from '@/components/notes/notes-workspace'

export default function NotesPage() {
  return <PageShell title="الملاحظات" description="التقط أفكارك بسرعة وارجع لها وقت ما تحتاج." icon={StickyNote}><NotesWorkspace /></PageShell>
}
