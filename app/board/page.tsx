import { LayoutPanelLeft } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'

export default function BoardPage() {
  return (
    <PageShell
      title="السبورة"
      description="مساحة حرة تحط فيها Sticky Notes وترتب أفكارك بصريًا"
      icon={LayoutPanelLeft}
    />
  )
}
