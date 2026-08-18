import { Activity } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { ActivityWorkspace } from '@/components/activity/activity-workspace'

export default function ActivityPage() {
  return <PageShell title="النشاط" description="راجع وقتك على التطبيقات بجامع Windows تجريبي محلي وآمن." icon={Activity}><ActivityWorkspace /></PageShell>
}
