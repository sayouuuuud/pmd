import { Library } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { LibraryWorkspace } from '@/components/library/library-workspace'

export default function LibraryPage() {
  return <PageShell title="المكتبة" description="اجمع روابطك وقوالبك وملفاتك واربطها بسياق العمل." icon={Library}><LibraryWorkspace /></PageShell>
}

