'use client'

import { useEffect, useState } from 'react'
import { Check, UserRound } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { useCommandCenter } from '@/lib/command-center-store'
import { authClient } from '@/lib/auth-client'

export function AccountWorkspace() {
  const { profile, updateProfile } = useCommandCenter()
  const { data: session } = authClient.useSession()
  const [form, setForm] = useState(profile)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(profile)
  }, [profile])

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateProfile(form)
    setSaved(true)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
      <ContentCard className="h-fit" title="ملفي" description="بياناتك الأساسية وطريقة ظهورك داخل المساحة.">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/70 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-card">
            <span className="text-xl font-bold">{(form.name || 'م').slice(0, 1)}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{form.name || 'مساحتي'}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{session?.user?.email || 'الوضع المحلي — سجّل الدخول لربط البيانات'}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
          <UserRound className="h-4 w-4 shrink-0" />
          <span>{form.onboardingComplete ? 'تم إعداد مساحتك الشخصية.' : 'أكمل الإعداد الأولي لتخصيص يومك.'}</span>
        </div>
      </ContentCard>

      <ContentCard title="تفضيلات المساحة" description="عدّل الإعدادات التي تؤثر على خطة اليوم والاقتراحات الشخصية.">
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">الاسم
            <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block text-sm font-medium">المدينة
            <input value={form.city} onChange={(event) => updateField('city', event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block text-sm font-medium">بداية اليوم
            <input type="time" value={form.dayStart} onChange={(event) => updateField('dayStart', event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="block text-sm font-medium">فترة العمل
            <input value={form.workWindow} onChange={(event) => updateField('workWindow', event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="09:00 - 17:00" />
          </label>
          <label className="block text-sm font-medium sm:col-span-2">الهدف الرئيسي الحالي
            <textarea value={form.focusGoal} onChange={(event) => updateField('focusGoal', event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <p className="text-xs text-muted-foreground">تُحفظ محليًا فورًا، وتُرفع للـBackend عند وجود جلسة وقاعدة بيانات.</p>
            <button type="submit" className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              {saved && <Check className="h-4 w-4" />}
              {saved ? 'تم الحفظ' : 'حفظ التفضيلات'}
            </button>
          </div>
        </form>
      </ContentCard>
    </div>
  )
}
