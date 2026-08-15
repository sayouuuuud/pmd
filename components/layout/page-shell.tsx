import type { LucideIcon } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'

export function PageShell({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: LucideIcon
  children?: React.ReactNode
}) {
  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      <TopNav />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-medium tracking-tight text-balance">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-6">
        {children ?? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-card px-6 py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
              <Icon className="h-6 w-6 text-accent-foreground" />
            </div>
            <p className="text-base font-medium">هذا القسم جاي في المرحلة الجاية</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              هنبني الواجهة الخاصة بالقسم ده بالتفصيل حسب خطة التنفيذ، وهيبقى بنفس نظام التصميم المستخدم في باقي اللوحة.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
