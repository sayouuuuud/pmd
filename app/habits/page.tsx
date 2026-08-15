import { Repeat } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'

export default function HabitsPage() {
  return (
    <PageShell
      title="العادات"
      description="تابع عاداتك اليومية بـ Streaks وإحصائيات أسبوعية"
      icon={Repeat}
    />
  )
}
