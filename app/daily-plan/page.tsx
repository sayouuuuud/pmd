import { CalendarCheck2 } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { DailyPlanWorkspace } from '@/components/daily-plan/daily-plan-workspace'

export default function DailyPlanPage() {
  return <PageShell title="خطة اليوم" description="Timeline مرن يجمع أهم ما تحتاجه في يوم واحد." icon={CalendarCheck2}><DailyPlanWorkspace /></PageShell>
}
