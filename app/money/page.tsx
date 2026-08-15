import { Wallet } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'

export default function MoneyPage() {
  return (
    <PageShell
      title="الفلوس"
      description="سجّل مصاريفك وشوف فلوسك بتروح فين، وحدد ميزانية شهرية"
      icon={Wallet}
    />
  )
}
