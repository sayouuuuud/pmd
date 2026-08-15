import { Moon } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'

export default function ReligiousPage() {
  return (
    <PageShell
      title="القسم الديني"
      description="تتبع الصلوات، المصحف، المكتبة الصوتية، والأذكار"
      icon={Moon}
    />
  )
}
