import { CheckSquare2 } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { TasksWorkspace } from '@/components/tasks/tasks-workspace'

export default function TasksPage() {
  return <PageShell title="المهام" description="رتّب شغلك إلى خطوات واضحة قابلة للإنجاز." icon={CheckSquare2}><TasksWorkspace /></PageShell>
}
