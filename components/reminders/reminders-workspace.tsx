'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarClock, Check, Clock3, Plus, Sparkles, X } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { ReminderKind, useCommandCenter } from '@/lib/command-center-store'

const kindLabels: Record<ReminderKind, string> = {
  task: 'مهمة',
  habit: 'عادة',
  prayer: 'صلاة',
  quran: 'ورد',
  finance: 'مالية',
}

const REMINDER_PREFERENCES_KEY = 'personal-command-center-reminder-preferences-v1'

const kindStyles: Record<ReminderKind, string> = {
  task: 'bg-accent text-accent-foreground',
  habit: 'bg-secondary text-secondary-foreground',
  prayer: 'bg-primary/10 text-primary',
  quran: 'bg-chart-2/15 text-chart-2',
  finance: 'bg-chart-4/15 text-chart-4',
}

type ReminderSuggestion = {
  title: string
  kind: ReminderKind
  dueAt: string
  sourceId: string
  repeatLabel?: string
}

function sourceHref(sourceId?: string) {
  if (!sourceId) return undefined
  if (sourceId.startsWith('task-')) return `/tasks#${sourceId}`
  if (sourceId.startsWith('habit-')) return `/habits#${sourceId}`
  if (sourceId.startsWith('plan-')) return `/daily-plan#plan-item-${sourceId}`
  if (sourceId.startsWith('finance-')) return `/money#${sourceId}`
  if (sourceId === 'prayer-tracker' || sourceId === 'quran-progress') return `/religious#${sourceId}`
  return undefined
}

export function RemindersWorkspace() {
  const { reminders, planItems, habits, financeEntries, addReminder, toggleReminder, snoozeReminder, archiveReminder } = useCommandCenter()
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('اليوم، ١٨:٠٠')
  const [kind, setKind] = useState<ReminderKind>('task')
  const [repeatLabel, setRepeatLabel] = useState('')
  const [quietMode, setQuietMode] = useState(true)
  const [preferencesHydrated, setPreferencesHydrated] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(REMINDER_PREFERENCES_KEY)
    if (stored) {
      try {
        const preferences = JSON.parse(stored) as { quietMode?: unknown }
        if (typeof preferences.quietMode === 'boolean') setQuietMode(preferences.quietMode)
      } catch {
        window.localStorage.removeItem(REMINDER_PREFERENCES_KEY)
      }
    }
    setPreferencesHydrated(true)
  }, [])

  useEffect(() => {
    if (!preferencesHydrated) return
    window.localStorage.setItem(REMINDER_PREFERENCES_KEY, JSON.stringify({ quietMode }))
  }, [preferencesHydrated, quietMode])

  const visibleReminders = useMemo(() => {
    const items = filter === 'active' ? reminders.filter((reminder) => reminder.status !== 'done') : reminders
    return [...items].sort((first, second) => Number(first.status === 'done') - Number(second.status === 'done'))
  }, [filter, reminders])

  const suggestions = useMemo<ReminderSuggestion[]>(() => {
    const existingSources = new Set(reminders.map((reminder) => reminder.sourceId).filter(Boolean))
    const planSuggestions: ReminderSuggestion[] = planItems
      .filter((item) => item.status === 'pending' && !existingSources.has(item.id))
      .map((item) => ({ title: `خطة اليوم: ${item.title}`, kind: item.kind === 'habit' ? 'habit' : item.kind === 'quran' ? 'quran' : item.kind === 'prayer' ? 'prayer' : 'task', dueAt: item.time, sourceId: item.id }))
    const habitSuggestions = habits
      .filter((habit) => !habit.doneToday && !existingSources.has(habit.id))
      .map((habit) => ({ title: `عادة: ${habit.title}`, kind: 'habit' as const, dueAt: 'اليوم', sourceId: habit.id, repeatLabel: habit.frequency === 'weekly' ? 'أسبوعيًا' : 'يوميًا' }))
    const financeSuggestions = financeEntries
      .filter((entry) => entry.recurrence !== 'none' && !existingSources.has(entry.id))
      .map((entry) => ({ title: `مالية: ${entry.title}`, kind: 'finance' as const, dueAt: 'موعد الاستحقاق القادم', sourceId: entry.id, repeatLabel: entry.recurrence === 'monthly' ? 'شهريًا' : 'أسبوعيًا' }))
    return [...planSuggestions, ...habitSuggestions, ...financeSuggestions].slice(0, quietMode ? 3 : 6)
  }, [financeEntries, habits, planItems, quietMode, reminders])

  const pendingCount = reminders.filter((reminder) => reminder.status === 'pending').length

  function generateSuggestions() {
    suggestions.forEach((suggestion) => addReminder(suggestion))
  }

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
        <Button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center justify-center gap-2"><Plus className="h-4 w-4" /> تذكير جديد</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-card p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">المستحق الآن</span><Bell className="h-4 w-4 text-primary" /></div><p className="mt-3 text-3xl font-semibold">{pendingCount}</p><p className="mt-1 text-xs text-muted-foreground">تذكيرات تحتاج انتباهك</p></div>
        <div className="rounded-3xl bg-card p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">تم اليوم</span><Check className="h-4 w-4 text-chart-2" /></div><p className="mt-3 text-3xl font-semibold">{reminders.filter((reminder) => reminder.status === 'done').length}</p><p className="mt-1 text-xs text-muted-foreground">خطوات صغيرة اتقفلت</p></div>
        <div className="rounded-3xl bg-card p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">التذكيرات المتكررة</span><CalendarClock className="h-4 w-4 text-chart-4" /></div><p className="mt-3 text-3xl font-semibold">{reminders.filter((reminder) => reminder.repeatLabel).length}</p><p className="mt-1 text-xs text-muted-foreground">تتراجع بشكل دوري</p></div>
      </div>

      {suggestions.length > 0 && <div className="rounded-3xl border border-primary/15 bg-primary/5 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h2 className="text-lg font-semibold">اقتراحات هادئة من يومك</h2></div><p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">نحوّل العناصر المفتوحة إلى تذكيرات قابلة للتأجيل، من غير تكرار ما له تذكير موجود بالفعل. الوضع الهادئ يعرض حتى ثلاثة اقتراحات في المرة.</p></div>
          <div className="flex shrink-0 flex-wrap items-center gap-2"><Button type="button" variant={quietMode ? 'secondary' : 'ghost'} size="sm" onClick={() => setQuietMode((value) => !value)}>{quietMode ? 'الوضع الهادئ مفعّل' : 'عرض اقتراحات أكثر'}</Button><Button type="button" size="sm" onClick={generateSuggestions}>إضافة الاقتراحات</Button></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{suggestions.map((suggestion) => <span key={suggestion.sourceId} className="rounded-full bg-card px-3 py-2 text-xs text-foreground shadow-sm">{suggestion.title}</span>)}</div>
      </div>}

      <div className="rounded-3xl bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-semibold">قائمة التذكيرات</h2><p className="mt-1 text-xs text-muted-foreground">التأجيل يغيّر الحالة فقط ولا يحذف العنصر من يومك.</p></div>
          <div className="flex rounded-2xl bg-muted p-1 text-xs"><Button type="button" variant={filter === 'active' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('active')}>المفتوحة</Button><Button type="button" variant={filter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('all')}>الكل</Button></div>
        </div>
        <div className="mt-5 space-y-2">
          {visibleReminders.length === 0 && <EmptyState icon={Bell} title="اليوم هادي" description="مفيش تذكيرات مفتوحة حاليًا." />}
          {visibleReminders.map((reminder) => {
            const contextHref = sourceHref(reminder.sourceId)
            return <article key={reminder.id} id={`reminder-${reminder.id}`} className={`scroll-mt-24 flex flex-col gap-3 rounded-2xl border border-border p-4 transition-opacity sm:flex-row sm:items-center ${reminder.status === 'done' ? 'opacity-55' : ''}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${kindStyles[reminder.kind]}`}><Bell className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className={`text-sm font-semibold ${reminder.status === 'done' ? 'line-through' : ''}`}>{reminder.title}</h3><span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{kindLabels[reminder.kind]}</span>{reminder.repeatLabel && <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{reminder.repeatLabel}</span>}{contextHref && <a href={contextHref} className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/15">فتح السياق</a>}</div><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> {reminder.dueAt}</p></div>
            <div className="flex items-center gap-2 sm:shrink-0"><Button type="button" size="sm" onClick={() => toggleReminder(reminder.id)}>{reminder.status === 'done' ? 'إعادة فتح' : 'تم'}</Button>{reminder.status !== 'done' && <Button type="button" variant="secondary" size="sm" onClick={() => snoozeReminder(reminder.id)}>تأجيل</Button>}<Button type="button" variant="ghost" size="icon" aria-label="أرشفة التذكير" onClick={() => archiveReminder(reminder.id)}><X className="h-4 w-4" /></Button></div>
          </article>
          })}
        </div>
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="تذكير جديد"
        description="خليه واضح وقابل للتنفيذ."
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAddOpen(false)
                setRepeatLabel('')
              }}
            >
              إلغاء
            </Button>
            <Button type="submit" form="new-reminder-form">
              حفظ التذكير
            </Button>
          </>
        }
      >
        <form id="new-reminder-form" onSubmit={submit}>
          <label htmlFor="reminder-title" className="block text-sm font-medium">عنوان التذكير</label>
          <Input id="reminder-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2" placeholder="مثال: دفع الاشتراك" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">النوع
              <Select value={kind} onChange={(event) => setKind(event.target.value as ReminderKind)} className="mt-2">
                <option value="task">مهمة</option>
                <option value="habit">عادة</option>
                <option value="prayer">صلاة</option>
                <option value="quran">ورد</option>
                <option value="finance">مالية</option>
              </Select>
            </label>
            <label className="text-sm font-medium">الموعد
              <Input value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-2" placeholder="اليوم، ١٨:٠٠" />
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium">التكرار
            <Select value={repeatLabel} onChange={(event) => setRepeatLabel(event.target.value)} className="mt-2">
              <option value="">بدون تكرار</option>
              <option value="يوميًا">يوميًا</option>
              <option value="أسبوعيًا">أسبوعيًا</option>
              <option value="شهريًا">شهريًا</option>
            </Select>
          </label>
        </form>
      </Dialog>
    </section>
  )
}
