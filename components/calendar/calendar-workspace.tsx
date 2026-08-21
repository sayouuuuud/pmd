'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCommandCenter, type CalendarEvent, type ProjectPricing } from '@/lib/command-center-store'
import { contextHref } from '@/lib/context-links'
import { taskDueAt } from '@/lib/task-dates'

const LOCAL_KEY = 'personal-command-center-calendar-events-v1'
const eventKinds = [
  { value: 'general', label: 'عام' },
  { value: 'task', label: 'مهمة' },
  { value: 'reminder', label: 'تذكير' },
  { value: 'pricing', label: 'دفعة' },
  { value: 'plan', label: 'خطة اليوم' },
]

type CalendarItem = CalendarEvent & { source: 'custom' | 'task' | 'reminder' | 'plan' | 'pricing'; href?: string; accent: string }

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value: string | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function dateFromKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 9, 0, 0)
}

function isDateKey(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(year, month - 1, day, 9, 0, 0)
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
}

function displayTime(value: string) {
  const parsed = parseDate(value)
  if (!parsed) return 'بدون وقت'
  return new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: '2-digit' }).format(parsed)
}

function normalizeArabicDigits(value: string) {
  return value.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
}

function reminderDate(value: string) {
  const parsed = parseDate(value)
  if (parsed) return parsed
  const normalized = normalizeArabicDigits(value).trim()
  const match = normalized.match(/^(اليوم|غدًا|غداً|بعد غد|لاحقًا اليوم)\s*[،,]?\s*(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const offset = match[1] === 'غدًا' || match[1] === 'غداً' ? 1 : match[1] === 'بعد غد' ? 2 : 0
  const base = dateFromKey(cairoToday())
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, Number(match[2]), Number(match[3]))
}

function cairoToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(date)
}

function makeId() {
  return `calendar-local-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`
}

export function CalendarWorkspace() {
  const searchParams = useSearchParams()
  const linkedDateParam = searchParams.get('date')
  const linkedDate = isDateKey(linkedDateParam) ? linkedDateParam : null
  const { tasks, reminders, planItems, projectPricings, archiveCalendarEvent } = useCommandCenter()
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([])
  const [storageLoaded, setStorageLoaded] = useState(false)
  const [month, setMonth] = useState(() => new Date(2000, 0, 1))
  const [selectedDate, setSelectedDate] = useState(linkedDate ?? '2000-01-01')
  const [today, setToday] = useState('2000-01-01')
  const [showForm, setShowForm] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ title: '', description: '', kind: 'general', date: '', start: '09:00', end: '' })

  useEffect(() => {
    const nextDate = linkedDate ?? cairoToday()
    const selected = dateFromKey(nextDate)
    setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
    setSelectedDate(nextDate)
    setToday(cairoToday())
    setForm((current) => current.date ? current : { ...current, date: nextDate })
  }, [linkedDate])

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as CalendarEvent[]
      if (Array.isArray(parsed)) setCustomEvents(parsed)
    } catch {
      setCustomEvents([])
    } finally {
      setStorageLoaded(true)
    }
    void fetch('/api/calendar-events', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error('backend-unavailable')
      const payload = await response.json() as { items?: CalendarEvent[] }
      const remote = (payload.items ?? []).map((item) => ({ ...item, source: 'remote' as const }))
      setCustomEvents((current) => [...remote, ...current.filter((item) => item.id.startsWith('calendar-local-'))])
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!storageLoaded) return
    const localOnly = customEvents.filter((item) => item.id.startsWith('calendar-local-'))
    localStorage.setItem(LOCAL_KEY, JSON.stringify(localOnly))
  }, [customEvents, storageLoaded])

  const items = useMemo<CalendarItem[]>(() => {
    const custom: CalendarItem[] = customEvents.map((event) => ({ ...event, source: 'custom', accent: 'border-primary/40 bg-primary/5' }))
    const taskItems: CalendarItem[] = tasks.flatMap((task) => {
      const startsAt = taskDueAt(task)
      if (!startsAt) return []
      return [{ id: `task-${task.id}`, title: task.title, description: task.description, kind: 'task', startsAt, endsAt: null, timezone: task.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, sourceType: 'task', sourceId: task.id, status: task.status === 'done' ? 'done' : 'planned', source: 'task', accent: task.priority === 'high' ? 'border-destructive/40 bg-destructive/5' : 'border-chart-4/40 bg-chart-4/5', href: contextHref('task', task.id) }]
    })
    const reminderItems: CalendarItem[] = reminders.flatMap((reminder) => {
      const parsed = reminderDate(reminder.dueAt)
      if (!parsed) return []
      return [{ id: `reminder-${reminder.id}`, title: reminder.title, description: 'تذكير من مساحة التذكيرات', kind: 'reminder', startsAt: parsed.toISOString(), endsAt: null, timezone: 'Africa/Cairo', sourceType: 'reminder', sourceId: reminder.id, status: reminder.status === 'done' ? 'done' : 'planned', source: 'reminder', accent: 'border-chart-2/40 bg-chart-2/5', href: '/reminders' }]
    })
    const plan: CalendarItem[] = planItems.flatMap((item) => {
      if (!item.localDate) return []
      const time = /^\d{1,2}:\d{2}$/.test(item.time) ? item.time : '09:00'
      return [{ id: `plan-${item.id}`, title: item.title, description: 'عنصر من خطة اليوم', kind: 'plan', startsAt: `${item.localDate}T${time}:00`, endsAt: null, timezone: 'Africa/Cairo', sourceType: 'plan', sourceId: item.id, status: item.status === 'done' ? 'done' : 'planned', source: 'plan', accent: 'border-accent-foreground/20 bg-accent/40', href: '/daily-plan' }]
    })
    const pricing: CalendarItem[] = projectPricings.flatMap((item: ProjectPricing) => {
      if (!item.expectedDate) return []
      const date = parseDate(item.expectedDate)
      if (!date) return []
      return [{ id: `pricing-${item.id}`, title: item.title, description: `دفعة متوقعة · ${item.amount} ${item.currency}`, kind: 'pricing', startsAt: date.toISOString(), endsAt: null, timezone: 'Africa/Cairo', sourceType: 'pricing', sourceId: item.id, status: item.status === 'received' ? 'done' : item.status === 'cancelled' ? 'cancelled' : 'planned', source: 'pricing', accent: 'border-chart-5/40 bg-chart-5/5', href: '/projects' }]
    })
    return [...custom, ...taskItems, ...reminderItems, ...plan, ...pricing].sort((left, right) => left.startsAt.localeCompare(right.startsAt))
  }, [customEvents, planItems, projectPricings, reminders, tasks])

  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
    const leading = firstDay.getDay()
    return Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - leading + 1))
  }, [month])
  const selectedItems = items.filter((item) => dateKey(new Date(item.startsAt)) === selectedDate)
  function shiftMonth(amount: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  function openCreate(date = selectedDate) {
    setEditingEventId(null)
    setForm({ title: '', description: '', kind: 'general', date, start: '09:00', end: '' })
    setError('')
    setNotice('')
    setShowForm(true)
  }

  function openEdit(item: CalendarItem) {
    if (item.source !== 'custom') return
    const startsAt = item.startsAt.slice(0, 16)
    const endsAt = item.endsAt?.slice(0, 16) ?? ''
    setEditingEventId(item.id)
    setForm({ title: item.title, description: item.description ?? '', kind: item.kind, date: startsAt.slice(0, 10), start: startsAt.slice(11, 16), end: endsAt ? endsAt.slice(11, 16) : '' })
    setError('')
    setNotice('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingEventId(null)
    setError('')
    setNotice('')
  }

  async function saveEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) { setError('اكتب عنوان الحدث أولًا.'); return }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) { setError('اختر تاريخًا صالحًا.'); return }
    if (!/^\d{2}:\d{2}$/.test(form.start)) { setError('اختر وقت بداية صالحًا.'); return }
    if (form.end && !/^\d{2}:\d{2}$/.test(form.end)) { setError('وقت النهاية غير صالح.'); return }
    const startsAt = `${form.date}T${form.start}:00`
    const endsAt = form.end ? `${form.date}T${form.end}:00` : null
    if (endsAt && endsAt < startsAt) { setError('النهاية يجب أن تكون بعد البداية.'); return }
    setSaving(true)
    const payload = { title, description: form.description.trim() || undefined, kind: form.kind as CalendarEvent['kind'], startsAt, endsAt, timezone: 'Africa/Cairo' }
    const currentEditingId = editingEventId
    if (currentEditingId) {
      setCustomEvents((current) => current.map((item) => item.id === currentEditingId ? { ...item, ...payload } : item))
      setSelectedDate(form.date)
      setMonth(dateFromKey(form.date))
      closeForm()
      setNotice('تم تحديث الحدث محليًا.')
      if (!currentEditingId.startsWith('calendar-local-')) {
        try {
          const response = await fetch(`/api/calendar-events/${currentEditingId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
          if (response.ok) {
            const remotePayload = await response.json() as { item?: CalendarEvent }
            if (remotePayload.item) setCustomEvents((current) => current.map((item) => item.id === currentEditingId ? remotePayload.item! : item))
          }
        } catch {
          // يحتفظ التقويم بالتعديل محليًا عند غياب قاعدة البيانات.
        }
      }
      setSaving(false)
      return
    }

    const localEvent: CalendarEvent = { id: makeId(), ...payload, sourceType: 'manual', status: 'planned' }
    setCustomEvents((current) => [...current, localEvent])
    setSelectedDate(form.date)
    setMonth(dateFromKey(form.date))
    closeForm()
    setNotice('تم حفظ الحدث محليًا.')
    try {
      const response = await fetch('/api/calendar-events', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(localEvent) })
      if (response.ok) {
        const remotePayload = await response.json() as { item?: CalendarEvent }
        if (remotePayload.item) setCustomEvents((current) => current.map((item) => item.id === localEvent.id ? remotePayload.item! : item))
      }
    } catch {
      // يحتفظ التقويم بالحدث محليًا عند غياب قاعدة البيانات.
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(item: CalendarItem, status: 'planned' | 'done') {
    if (item.source !== 'custom') return
    setCustomEvents((current) => current.map((event) => event.id === item.id ? { ...event, status } : event))
    setNotice(status === 'done' ? 'تم تعليم الحدث كمكتمل.' : 'تمت إعادة فتح الحدث.')
    if (!item.id.startsWith('calendar-local-')) {
      try { await fetch(`/api/calendar-events/${item.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) }) } catch { /* الحالة المحلية تظل مصدر العرض الاحتياطي */ }
    }
  }

  async function removeEvent(item: CalendarItem) {
    if (item.source !== 'custom') return
    archiveCalendarEvent(item)
    setCustomEvents((current) => current.filter((event) => event.id !== item.id))
    setNotice('تم نقل الحدث إلى الأرشيف.')
  }

  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
    <ContentCard className="lg:col-span-8" title="التقويم الموحد" description="نظرة واحدة على ما له موعد، مع إبقاء خطة اليوم والمهام والتذكيرات في سياقها الأصلي.">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/50 p-3">
        <div className="flex items-center gap-2"><Button type="button" variant="ghost" size="icon-sm" aria-label="الشهر السابق" onClick={() => shiftMonth(-1)}><ChevronRight className="h-4 w-4" /></Button><p className="min-w-36 text-center text-sm font-semibold">{monthLabel(month)}</p><Button type="button" variant="ghost" size="icon-sm" aria-label="الشهر التالي" onClick={() => shiftMonth(1)}><ChevronLeft className="h-4 w-4" /></Button></div>
        <div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={() => { setMonth(dateFromKey(today)); setSelectedDate(today) }}>اليوم</Button><Button type="button" size="sm" onClick={() => openCreate()}><Plus className="ml-1 h-4 w-4" />حدث جديد</Button></div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">{['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map((label) => <span key={label} className="py-2">{label}</span>)}</div>
      <div className="grid grid-cols-7 gap-1" dir="ltr">{days.map((day) => { const key = dateKey(day); const dayItems = items.filter((item) => dateKey(new Date(item.startsAt)) === key); const outside = day.getMonth() !== month.getMonth(); return <button key={key} type="button" onClick={() => setSelectedDate(key)} className={`min-h-20 rounded-2xl border p-2 text-left transition-colors ${outside ? 'border-transparent bg-muted/20 text-muted-foreground/50' : 'border-border/70 bg-card'} ${key === selectedDate ? 'ring-2 ring-primary ring-offset-1' : ''}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${key === today ? 'bg-primary text-primary-foreground' : ''}`}>{day.getDate()}</span><span className="mt-2 flex flex-wrap gap-1">{dayItems.slice(0, 3).map((item) => <span key={item.id} className={`h-1.5 w-1.5 rounded-full ${item.status === 'done' ? 'bg-positive' : 'bg-primary'}`} aria-label={item.title} />)}{dayItems.length > 3 && <span className="text-[9px] text-muted-foreground">+{dayItems.length - 3}</span>}</span></button> })}</div>
    </ContentCard>
    <div className="space-y-4 lg:col-span-4">
      <ContentCard title={`أحداث ${new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long' }).format(dateFromKey(selectedDate))}`} description={`${selectedItems.length} عناصر مرتبطة بهذا اليوم.`}>
        {selectedItems.length === 0 ? <EmptyState icon={CalendarDays} title="اليوم فاضي" description="أضف حدثًا يدويًا أو اربط موعدًا من إحدى المساحات." action={<Button type="button" onClick={() => openCreate()}><Plus className="ml-1 h-4 w-4" />أضف حدثًا</Button>} /> : <div className="space-y-2">{selectedItems.map((item) => <div key={item.id} className={`rounded-2xl border p-3 ${item.accent}`}><div className="flex items-start justify-between gap-2"><div><p className={`text-sm font-semibold ${item.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>{item.title}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Clock3 className="h-3 w-3" />{displayTime(item.startsAt)} · {eventKinds.find((kind) => kind.value === item.kind)?.label ?? 'عام'}</p></div>{item.source === 'custom' && <div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon-sm" aria-label="تعديل الحدث" onClick={() => openEdit(item)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label="حذف الحدث" onClick={() => void removeEvent(item)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></div>}</div>{item.description && <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.description}</p>}<div className="mt-3 flex flex-wrap items-center gap-2">{item.href && <Link href={item.href} className="inline-flex items-center gap-1 rounded-xl bg-muted px-2.5 py-1.5 text-[11px] font-medium hover:bg-accent"><ExternalLink className="h-3 w-3" />فتح المصدر</Link>}{item.source === 'custom' && <Button type="button" size="sm" variant={item.status === 'done' ? 'outline' : 'secondary'} onClick={() => void updateStatus(item, item.status === 'done' ? 'planned' : 'done')}>{item.status === 'done' ? 'إعادة فتح' : 'تم'}</Button>}</div></div>)}</div>}
      </ContentCard>
      <ContentCard title="مصادر التقويم" description="كل لون يوضح نوع المصدر، وليس أولوية جديدة."><div className="space-y-2 text-xs text-muted-foreground"><Legend color="bg-primary" label="أحداث يدوية" /><Legend color="bg-destructive" label="مهام" /><Legend color="bg-chart-2" label="تذكيرات" /><Legend color="bg-accent-foreground" label="خطة اليوم" /><Legend color="bg-chart-5" label="دفعات المشاريع" /></div>      </ContentCard>
      {notice && <p role="status" aria-live="polite" aria-atomic="true" className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">{notice}</p>}
    </div>
    {showForm && <ContentCard className="lg:col-span-12" title={editingEventId ? 'تعديل حدث' : 'إضافة حدث'} description="سيُحفظ على الخادم عند توفره، ويظل محليًا عند غياب الاتصال."><form onSubmit={saveEvent} noValidate className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><label className="lg:col-span-2 text-sm font-medium">العنوان<Input autoFocus value={form.title} onChange={(event) => { setForm((current) => ({ ...current, title: event.target.value })); if (error) setError('') }} aria-label="عنوان الحدث" aria-invalid={Boolean(error)} aria-describedby={error ? 'calendar-event-error' : undefined} className="mt-2 rounded-2xl" placeholder="مثال: جلسة تركيز" /></label><label className="text-sm font-medium">النوع<Select value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))} className="mt-2 rounded-2xl">{eventKinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</Select></label><label className="text-sm font-medium">التاريخ<Input type="date" value={form.date} onChange={(event) => { setForm((current) => ({ ...current, date: event.target.value })); if (error) setError('') }} aria-label="تاريخ الحدث" aria-invalid={Boolean(error)} aria-describedby={error ? 'calendar-event-error' : undefined} className="mt-2 rounded-2xl" /></label><label className="text-sm font-medium">من<Input type="time" value={form.start} onChange={(event) => { setForm((current) => ({ ...current, start: event.target.value })); if (error) setError('') }} aria-label="وقت بداية الحدث" aria-invalid={Boolean(error)} aria-describedby={error ? 'calendar-event-error' : undefined} className="mt-2 rounded-2xl" /></label><label className="text-sm font-medium">إلى <span className="font-normal text-muted-foreground">(اختياري)</span><Input type="time" value={form.end} onChange={(event) => { setForm((current) => ({ ...current, end: event.target.value })); if (error) setError('') }} aria-label="وقت نهاية الحدث" aria-invalid={Boolean(error)} aria-describedby={error ? 'calendar-event-error' : undefined} className="mt-2 rounded-2xl" /></label><label className="sm:col-span-2 lg:col-span-4 text-sm font-medium">وصف مختصر<Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-20 rounded-2xl" placeholder="تفاصيل تساعدك عندما ترى الحدث لاحقًا" /></label><div className="flex items-end gap-2 lg:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ...' : editingEventId ? 'حفظ التعديل' : 'حفظ الحدث'}</Button><Button type="button" variant="outline" onClick={closeForm}><X className="ml-1 h-4 w-4" />إلغاء</Button></div>{error && <p id="calendar-event-error" className="sm:col-span-2 lg:col-span-6 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert" aria-live="assertive" aria-atomic="true">{error}</p>}</form></ContentCard>}
  </div>
}

function Legend({ color, label }: { color: string; label: string }) {
  return <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</div>
}
