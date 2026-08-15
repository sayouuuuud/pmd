import { FolderKanban } from 'lucide-react'
import { ProjectsWorkspace } from '@/components/projects/projects-workspace'
import { PageShell } from '@/components/layout/page-shell'

export default function ProjectsPage() {
  return <PageShell title="المشاريع" description="تابع مشاريعك بلوحة كانبان وشوف حالة كل مشروع بسهولة" icon={FolderKanban}>
    <ProjectsWorkspace />
  </PageShell>
}
