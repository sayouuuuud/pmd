import { Moon } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { ReligiousWorkspace } from '@/components/religious/religious-workspace'

export const metadata = {
  title: 'القسم الديني | مركز القيادة الشخصي',
  description: 'متابعة الصلاة والورد والأذكار داخل نظام التشغيل الشخصي العربي.',
}

export default function ReligiousPage() {
  return (
    <PageShell title="القسم الديني" description="تتبع الصلوات، الورد، والأذكار بهدوء واستمرارية." icon={Moon}>
      <ReligiousWorkspace />
    </PageShell>
  )
}
