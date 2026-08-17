import type { Metadata } from 'next'
import { Wallet } from 'lucide-react'
import { MoneyWorkspace } from '@/components/money/money-workspace'
import { PageShell } from '@/components/layout/page-shell'

export const metadata: Metadata = {
  title: 'الفلوس | مركز القيادة الشخصي',
  description: 'سجّل مصاريفك، راقب ميزانيتك، وافهم اتجاه إنفاقك.',
}

export default function MoneyPage() {
  return (
    <PageShell
      title="الفلوس"
      description="سجّل مصاريفك وشوف فلوسك بتروح فين، وحدد ميزانية شهرية"
      icon={Wallet}
    >
      <MoneyWorkspace />
    </PageShell>
  )
}
