import { UserRound } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { AccountWorkspace } from '@/components/account/account-workspace'

export default function AccountPage() {
  return (
    <PageShell title="حسابي وإعداداتي" description="ظبّط مساحتك الشخصية بالطريقة التي تناسب يومك." icon={UserRound}>
      <AccountWorkspace />
    </PageShell>
  )
}
