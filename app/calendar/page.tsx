import { CalendarDays } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { CalendarWorkspace } from '@/components/calendar/calendar-workspace'

export default function CalendarPage() {
  return <PageShell title="التقويم الموحد" description="كل ما له موعد في مكان واحد، مع روابط مباشرة إلى مصدره." icon={CalendarDays}><CalendarWorkspace /></PageShell>
}
