'use client'

import { useMemo, useState } from 'react'
import { Bell, CalendarClock, Check, Clock3, Plus, X } from 'lucide-react'
import { ReminderKind, useCommandCenter } from '@/lib/command-center-store'

const kindLabels: Record<ReminderKind, string> = {
  task: 'مهمة',
  habit: 'عادة',
  prayer: 'صلاة',
  quran: 'ورد',
  finance: 'مالية',
}

const kindStyles: Record<ReminderKind, string> = {
  task: 'bg-accent text-accent-foreground',
  habit: 'bg-secondary text-secondary-foreground',
  prayer: 'bg-primary/10 text-primary',
  quran: 'bg-chart-2/15 text-chart-2',
  finance: 'bg-chart-4/15 text-chart-4',
}

export function RemindersWorkspace() {
  const { reminders, addReminder, toggleReminder, snoozeReminder, archiveReminder } = useCommandCenter()
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('اليوم، ١٨:٠٠')
  const [kind, setKind] = useState<ReminderKind>('task')
  const [repeatLabel, setRepeatLabel] = useState('')

  const visibleReminders = useMemo(() => {
    const items = filter === 'active' ? reminders.filter((reminder) => reminder.status !== 'done') : reminders
    return [...items].sort((first, second) => Number(first.status === 'done') - Number(second.status === 'done'))
  }, [filter, reminders])

  const pendingCount = reminders.filter((reminder) => reminder.status === 'pending').length

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    addReminder({ title: title.trim(), kind, dueAt: dueAt.trim() || 'لاحقًا اليوم', repeatLabel: repeatLabel || undefined })
    setTitle('')
    setRepeatLabel('')
    setAddOpen(false)
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">إشعاراتك الهادية</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">التذكيرات</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">خلي الحاجات المهمة قدامك من غير زحمة. التذكيرات هنا مرتبطة بيومك وتفضل قابلة للتأجيل بدل ما تختفي.</p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> تذكير جديد</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-card p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">المستحق الآن</span><Bell className="h-4 w-4 text-primary" /></div><p className="mt-3 text-3xl font-semibold">{pendingCount}</p><p className="mt-1 text-xs text-muted-foreground">تذكيرات تحتاج انتباهك</p></div>
        <div className="rounded-3xl bg-card p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">تم اليوم</span><Check className="h-4 w-4 text-chart-2" /></div><p className="mt-3 text-3xl font-semibold">{reminders.filter((reminder) => reminder.status === 'done').length}</p><p className="mt-1 text-xs text-muted-foreground">خطوات صغيرة اتقفلت</p></div>
        <div className="rounded-3xl bg-card p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">التذكيرات المتكررة</span><CalendarClock className="h-4 w-4 text-chart-4" /></div><p className="mt-3 text-3xl font-semibold">{reminders.filter((reminder) => reminder.repeatLabel).length}</p><p className="mt-1 text-xs text-muted-foreground">تتراجع بشكل دوري</p></div>
      </div>

      <div className="rounded-3xl bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-semibold">قائمة التذكيرات</h2><p className="mt-1 text-xs text-muted-foreground">التأجيل يغيّر الحالة فقط ولا يحذف العنصر من يومك.</p></div>
          <div className="flex rounded-2xl bg-muted p-1 text-xs"><button type="button" onClick={() => setFilter('active')} className={`rounded-xl px-3 py-2 ${filter === 'active' ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}>المفتوحة</button><button type="button" onClick={() => setFilter('all')} className={`rounded-xl px-3 py-2 ${filter === 'all' ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}>الكل</button></div>
        </div>
        <div className="mt-5 space-y-2">
          {visibleReminders.length === 0 && <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center"><p className="text-sm font-semibold">اليوم هادي</p><p className="mt-2 text-xs text-muted-foreground">مفيش تذكيرات مفتوحة حاليًا.</p></div>}
          {visibleReminders.map((reminder) => <article key={reminder.id} className={`flex flex-col gap-3 rounded-2xl border border-border p-4 transition-opacity sm:flex-row sm:items-center ${reminder.status === 'done' ? 'opacity-55' : ''}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${kindStyles[reminder.kind]}`}><Bell className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className={`text-sm font-semibold ${reminder.status === 'done' ? 'line-through' : ''}`}>{reminder.title}</h3><span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{kindLabels[reminder.kind]}</span>{reminder.repeatLabel && <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{reminder.repeatLabel}</span>}</div><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> {reminder.dueAt}</p></div>
            <div className="flex items-center gap-2 sm:shrink-0"><button type="button" onClick={() => toggleReminder(reminder.id)} className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">{reminder.status === 'done' ? 'إعادة فتح' : 'تم'}</button>{reminder.status !== 'done' && <button type="button" onClick={() => snoozeReminder(reminder.id)} className="rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground hover:text-foreground">تأجيل</button>}<button type="button" aria-label="أرشفة التذكير" onClick={() => archiveReminder(reminder.id)} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div>
          </article>)}
        </div>
      </div>

      {addOpen && <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/30 p-4 pt-24 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="إضافة تذكير"><form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-card p-5 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">تذكير جديد</h2><p className="mt-1 text-xs text-muted-foreground">خليه واضح وقابل للتنفيذ.</p></div><button type="button" aria-label="إغلاق" onClick={() => setAddOpen(false)} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div><label htmlFor="reminder-title" className="mt-5 block text-sm font-medium">عنوان التذكير</label><input id="reminder-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="مثال: دفع الاشتراك" /><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">النوع<select value={kind} onChange={(event) => setKind(event.target.value as ReminderKind)} className="mt-2 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none"><option value="task">مهمة</option><option value="habit">عادة</option><option value="prayer">صلاة</option><option value="quran">ورد</option><option value="finance">مالية</option></select></label><label className="text-sm font-medium">الموعد<input value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none" placeholder="اليوم، ١٨:٠٠" /></label></div><label className="mt-4 block text-sm font-medium">التكرار<select value={repeatLabel} onChange={(event) => setRepeatLabel(event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none"><option value="">بدون تكرار</option><option value="يوميًا">يوميًا</option><option value="أسبوعيًا">أسبوعيًا</option><option value="شهريًا">شهريًا</option></select></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => { setAddOpen(false); setRepeatLabel('') }} className="rounded-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">إلغاء</button><button type="submit" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">حفظ التذكير</button></div></form></div>}
    </section>
  )
}
