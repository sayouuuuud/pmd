import { ListChecks } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'

export default function TasksPage() {
  return (
    <PageShell
      title="المهام"
      description="نظّم مهامك بأولويات وتواريخ ومهام فرعية، وتابع تقدمك يوم بيوم"
      icon={ListChecks}
    />
  )
}
