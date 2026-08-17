import { Moon } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { ReligiousWorkspaceLazy } from '@/components/religious/religious-workspace-lazy'

export const metadata = {
  title: 'القسم الديني | مساحتي',
  description: 'متابعة الصلاة والورد والأذكار داخل نظام التشغيل الشخصي العربي.',
}

export default function ReligiousPage() {
  return (
    <PageShell title="القسم الديني" description="تتبع الصلوات، الورد، والأذكار بهدوء واستمرارية." icon={Moon}>
      <ReligiousWorkspaceLazy />
    </PageShell>
  )
}
