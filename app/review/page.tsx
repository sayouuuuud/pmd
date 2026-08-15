import { ClipboardCheck } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { WeeklyReviewWorkspace } from '@/components/review/weekly-review-workspace'

export default function ReviewPage() {
  return <PageShell title="مراجعة الأسبوع" description="حوّل أرقام الأسبوع إلى قرارات واضحة للأسبوع القادم." icon={ClipboardCheck}><WeeklyReviewWorkspace /></PageShell>
}
