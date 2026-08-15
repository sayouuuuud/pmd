import { Repeat } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { HabitsWorkspace } from '@/components/habits/habits-workspace'

export default function HabitsPage() {
  return <PageShell title="العادات" description="ابنِ استمرارية صغيرة تتراكم إلى تغيير كبير." icon={Repeat}><HabitsWorkspace /></PageShell>
}
