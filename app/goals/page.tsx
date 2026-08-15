import { Target } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'

export default function GoalsPage() {
  return (
    <PageShell
      title="الأهداف"
      description="أهدافك الكبيرة مقسّمة لمهام صغيرة، مع نسبة تقدم واضحة"
      icon={Target}
    />
  )
}
