import { FolderKanban } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'

export default function ProjectsPage() {
  return (
    <PageShell
      title="المشاريع"
      description="تابع مشاريعك بلوحة كانبان وشوف حالة كل مشروع بسهولة"
      icon={FolderKanban}
    />
  )
}
