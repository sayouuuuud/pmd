'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CalendarDays, Check, Clock3, FolderKanban, Link2, Moon, Pause, Pencil, Play, Repeat, SkipForward, Sparkles, Target, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { useCommandCenter } from '@/lib/command-center-store'
import { contextHref } from '@/lib/context-links'

function cairoToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
}

export function DailyPlanWorkspace() {
  const { planItems, tasks, habits, projects, goals, togglePlanItem, updatePlanItem, movePlanItem, snoozePlanItem, skipPlanItem, restorePlanItem } = useCommandCenter()
  const [viewDate, setViewDate] = useState('2000-01-01')
  const [moveDateId, setMoveDateId] = useState<string | null>(null)
  const [moveDate, setMoveDate] = useState('')
  useEffect(() => {
    setViewDate(cairoToday())
  }, [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingTime, setEditingTime] = useState('')
  const [editError, setEditError] = useState('')
  const [moveError, setMoveError] = useState('')
  const visiblePlanItems = planItems.filter((item) => (item.localDate ?? viewDate) === viewDate)
  const sortedVisiblePlanItems = sortPlanItems(visiblePlanItems, tasks)
  const completed = visiblePlanItems.filter((item) => item.status === 'done').length
  const activePlanItems = visiblePlanItems.filter((item) => item.status !== 'skipped')

  function beginEdit(item: { id: string; title: string; time: string }) {
    setEditingId(item.id)
    setEditingTitle(item.title)
    setEditingTime(item.time === '—' ? '' : item.time)
    setEditError('')
  }

  function saveEdit() {
    if (!editingId) return
    if (!editingTitle.trim()) {
      setEditError('اكتب عنوان العنصر أولًا.')
      return
    }
    setEditError('')
    updatePlanItem(editingId, { title: editingTitle.trim(), time: editingTime || '—' })
    setEditingId(null)
  }

  function beginMove(item: { id: string; localDate?: string }) {
    setMoveDateId(item.id)
    setMoveDate(item.localDate && item.localDate !== viewDate ? item.localDate : '')
    setMoveError('')
  }

  function saveMove() {
    if (!moveDateId) return
    if (!/^\d{4}-\d{2}-\d{2}$/.test(moveDate) || moveDate === viewDate) {
      setMoveError('اختر يومًا مختلفًا وصحيحًا للنقل أولًا.')
      return
    }
    setMoveError('')
    movePlanItem(moveDateId, moveDate)
    setMoveDateId(null)
    setMoveDate('')
  }

  return <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
    <ContentCard className="xl:col-span-8" title="Timeline اليوم" description="خطة مرنة، وليست جدولًا يعاقبك إذا تغيّر يومك. كل مهمة تقودك إلى سياقها عندما يكون متاحًا.">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/50 p-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground" htmlFor="daily-plan-date"><CalendarDays className="h-4 w-4 text-primary" />عرض يوم</label>
        <Input id="daily-plan-date" type="date" value={viewDate} onChange={(event) => setViewDate(event.target.value)} className="h-8 w-auto rounded-xl text-xs" />
      </div>
      <p className="mb-3 rounded-2xl border border-border/70 bg-muted/40 px-3 py-2 text-[11px] leading-5 text-muted-foreground">ترتيب مرن حسب وقت العنصر، ثم أولوية المهمة عند تساوي الوقت. لا يتم تغيير أي موعد تلقائيًا.</p>
      <div className="space-y-2">
        {visiblePlanItems.length === 0 ? <EmptyState icon={Sparkles} title="لا توجد عناصر في هذا اليوم" description="اختر يومًا آخر أو أضف عنصرًا جديدًا من قسم المهام، ثم انقله إلى هذا التاريخ عند الحاجة." action={<Link href="/tasks" className="inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">أضف أول مهمة</Link>} /> : sortedVisiblePlanItems.map((item) => <div key={item.id} id={`plan-item-${item.id}`} className={`scroll-mt-24 rounded-2xl border px-3 py-3 transition-colors ${item.status === 'done' ? 'border-positive bg-positive/40' : item.status === 'snoozed' || item.status === 'skipped' ? 'border-border bg-muted/50 opacity-60' : 'border-border/70 bg-card'}`}>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="w-12 shrink-0 text-xs font-semibold text-muted-foreground">{item.time}</span>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.status === 'done' ? 'bg-positive text-positive-foreground' : 'bg-accent text-accent-foreground'}`}><PlanKindIcon kind={item.kind} /></span>
            <Button type="button" variant="ghost" onClick={() => item.status === 'snoozed' || item.status === 'skipped' ? restorePlanItem(item.id) : togglePlanItem(item.id)} className={`h-auto min-w-48 flex-1 justify-start whitespace-normal rounded-xl px-2 py-2 text-right text-sm leading-6 ${item.status === 'done' || item.status === 'skipped' ? 'text-muted-foreground line-through hover:text-muted-foreground' : 'text-foreground'}`}>{item.title}</Button>
            {item.status !== 'done' && item.status !== 'snoozed' && item.status !== 'skipped' && <Button type="button" variant="ghost" size="icon-sm" aria-label="تأجيل" onClick={() => snoozePlanItem(item.id)} className="rounded-full text-muted-foreground hover:bg-muted"><Pause className="h-4 w-4" /></Button>}
            {item.status !== 'done' && item.status !== 'snoozed' && item.status !== 'skipped' && <Button type="button" variant="ghost" size="icon-sm" aria-label="تخطي" onClick={() => skipPlanItem(item.id)} className="rounded-full text-muted-foreground hover:bg-muted"><SkipForward className="h-4 w-4" /></Button>}
            {(item.status === 'snoozed' || item.status === 'skipped') && <Button type="button" variant="ghost" size="icon-sm" aria-label="إرجاع إلى الخطة" onClick={() => restorePlanItem(item.id)} className="rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"><Play className="h-4 w-4" /></Button>}
            {item.status !== 'done' && item.status !== 'snoozed' && item.status !== 'skipped' && <Button type="button" variant="ghost" size="icon-sm" aria-label="تعديل العنصر" onClick={() => beginEdit(item)} className="rounded-full text-muted-foreground hover:bg-muted"><Pencil className="h-4 w-4" /></Button>}
            {item.status !== 'done' && item.status !== 'snoozed' && item.status !== 'skipped' && <Button type="button" variant="ghost" size="icon-sm" aria-label="نقل إلى يوم آخر" onClick={() => beginMove(item)} className="rounded-full text-muted-foreground hover:bg-muted"><CalendarDays className="h-4 w-4" /></Button>}
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${item.status === 'done' ? 'border-primary bg-primary text-primary-foreground' : item.status === 'skipped' ? 'border-border bg-muted text-muted-foreground' : 'border-border'}`}>{item.status === 'done' ? <Check className="h-3.5 w-3.5" /> : item.status === 'skipped' ? <SkipForward className="h-3.5 w-3.5" /> : null}</span>
          </div>
          {moveDateId === item.id && <form onSubmit={(event) => { event.preventDefault(); saveMove() }} noValidate className="mt-3 grid gap-2 rounded-2xl bg-muted/60 p-3 sm:grid-cols-[1fr_auto_auto]"><label className="flex items-center gap-2 text-xs text-muted-foreground" htmlFor={`move-date-${item.id}`}>نقل إلى <Input id={`move-date-${item.id}`} type="date" value={moveDate} onChange={(event) => { setMoveDate(event.target.value); if (moveError) setMoveError('') }} aria-invalid={Boolean(moveError)} aria-describedby={moveError ? `move-date-${item.id}-error` : undefined} className="h-8 rounded-xl text-xs text-foreground" /></label>{moveError && <p id={`move-date-${item.id}-error`} role="alert" aria-live="assertive" aria-atomic="true" className="text-xs text-destructive sm:col-span-3">{moveError}</p>}<Button type="submit" size="icon-sm" aria-label="حفظ النقل" className="rounded-xl"><Check className="mx-auto h-4 w-4" /></Button><Button type="button" variant="outline" size="icon-sm" aria-label="إلغاء النقل" onClick={() => { setMoveDateId(null); setMoveError('') }} className="rounded-xl text-muted-foreground hover:bg-background"><X className="mx-auto h-4 w-4" /></Button></form>}
          {editingId === item.id && <form onSubmit={(event) => { event.preventDefault(); saveEdit() }} noValidate className="mt-3 grid gap-2 rounded-2xl bg-muted/60 p-3 sm:grid-cols-[1fr_120px_auto_auto]"><label className="sr-only" htmlFor={`plan-title-${item.id}`}>عنوان العنصر</label><Input id={`plan-title-${item.id}`} value={editingTitle} onChange={(event) => { setEditingTitle(event.target.value); if (editError) setEditError('') }} aria-invalid={Boolean(editError)} aria-describedby={editError ? `plan-title-${item.id}-error` : undefined} className="h-9 rounded-xl text-sm" />{editError && <p id={`plan-title-${item.id}-error`} role="alert" aria-live="assertive" aria-atomic="true" className="text-xs text-destructive sm:col-span-4">{editError}</p>}<label className="sr-only" htmlFor={`plan-time-${item.id}`}>وقت العنصر</label><Input id={`plan-time-${item.id}`} type="time" value={editingTime} onChange={(event) => setEditingTime(event.target.value)} className="h-9 rounded-xl text-sm" /><Button type="submit" size="icon-sm" aria-label="حفظ التعديل" className="rounded-xl"><Check className="mx-auto h-4 w-4" /></Button><Button type="button" variant="outline" size="icon-sm" aria-label="إلغاء التعديل" onClick={() => { setEditingId(null); setEditError('') }} className="rounded-xl text-muted-foreground hover:bg-background"><X className="mx-auto h-4 w-4" /></Button></form>}
          <PlanContext item={item} tasks={tasks} habits={habits} projects={projects} goals={goals} />
        </div>)}
      </div>
    </ContentCard>
    <div className="space-y-4 xl:col-span-4">
      <ContentCard title="تقدم اليوم" description="المهم هو الرجوع للخطة">
        <div className="flex items-end gap-3"><span className="text-5xl font-semibold">{Math.round((completed / Math.max(activePlanItems.length, 1)) * 100)}%</span><span className="mb-2 text-xs text-muted-foreground">من الخطة</span></div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completed / Math.max(activePlanItems.length, 1)) * 100}%` }} /></div>
        <p className="mt-3 text-xs text-muted-foreground">{completed} عناصر مكتملة من {activePlanItems.length} بعد استبعاد المتخطى</p>
      </ContentCard>
      <ContentCard className="bg-surface-dark text-surface-dark-foreground" title="تركيز الفترة الحالية" description="اقتراح قابل للتعديل">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary"><Play className="h-4 w-4 fill-current text-primary-foreground" /></span><div><p className="text-sm font-semibold">{planItems.find((item) => item.status === 'pending')?.title ?? 'وقت مفتوح'}</p><p className="mt-1 text-xs text-surface-dark-foreground/60">ابدأ بـ 25 دقيقة فقط</p></div></div>
        <div className="mt-5 flex items-center gap-2 text-xs text-surface-dark-foreground/60"><Sparkles className="h-4 w-4" /> لا تغيّر موعدك تلقائيًا</div>
      </ContentCard>
    </div>
  </div>
}

function sortPlanItems(items: { id: string; title: string; time: string; kind: string; status: string; sourceId?: string; localDate?: string }[], tasks: { id: string; priority: 'high' | 'medium' | 'low' }[]) {
  const priorityRank = { high: 0, medium: 1, low: 2 }
  return [...items].sort((left, right) => {
    const timeDifference = planTimeValue(left.time) - planTimeValue(right.time)
    if (timeDifference !== 0) return timeDifference
    const leftTask = left.kind === 'task' && left.sourceId ? tasks.find((task) => task.id === left.sourceId) : undefined
    const rightTask = right.kind === 'task' && right.sourceId ? tasks.find((task) => task.id === right.sourceId) : undefined
    return (leftTask ? priorityRank[leftTask.priority] : 3) - (rightTask ? priorityRank[rightTask.priority] : 3)
  })
}

function planTimeValue(time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time)
  return match ? Number(match[1]) * 60 + Number(match[2]) : Number.MAX_SAFE_INTEGER
}

function PlanContext({ item, tasks, habits, projects, goals }: { item: { kind: string; sourceId?: string }; tasks: { id: string; title: string; projectId?: string; goalId?: string }[]; habits: { id: string; title: string; projectId?: string; goalId?: string }[]; projects: { id: string; title: string; goalId?: string }[]; goals: { id: string; title: string }[] }) {
  const task = item.kind === 'task' && item.sourceId ? tasks.find((candidate) => candidate.id === item.sourceId) : undefined
  const habit = (item.kind === 'habit' || item.kind === 'quran') && item.sourceId ? habits.find((candidate) => candidate.id === item.sourceId) : undefined
  const projectId = task?.projectId ?? habit?.projectId
  const project = projectId ? projects.find((candidate) => candidate.id === projectId) : undefined
  const goalId = task?.goalId ?? habit?.goalId ?? project?.goalId
  const goal = goalId ? goals.find((candidate) => candidate.id === goalId) : undefined
  const prayer = item.kind === 'prayer'
  const quran = item.kind === 'quran'
  if (!task && !habit && !project && !goal && !prayer && !quran) return null

  return <div className="mt-2 flex flex-wrap items-center gap-2 pr-[3.75rem] text-[11px] text-muted-foreground">
    <span className="inline-flex items-center gap-1"><Link2 className="h-3 w-3 text-primary" />السياق</span>
    {task && <Link href={contextHref('task', task.id)} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 transition-colors hover:bg-accent/80 hover:text-accent-foreground">مهمة: {task.title}</Link>}
    {habit && <Link href={contextHref('habit', habit.id)} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 transition-colors hover:bg-accent/80 hover:text-accent-foreground">عادة: {habit.title}</Link>}
    {prayer && <Link href={contextHref('prayer')} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 transition-colors hover:bg-accent/80 hover:text-accent-foreground">المساحة الدينية: الصلاة</Link>}
    {quran && <Link href={contextHref('quran')} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 transition-colors hover:bg-accent/80 hover:text-accent-foreground">المساحة الدينية: الورد</Link>}
    {project && <Link href={contextHref('project', project.id)} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 transition-colors hover:bg-accent hover:text-accent-foreground"><FolderKanban className="h-3 w-3" /> مشروع: {project.title}</Link>}
    {goal && <Link href={contextHref('goal', goal.id)} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 transition-colors hover:bg-accent hover:text-accent-foreground"><Target className="h-3 w-3" /> هدف: {goal.title}</Link>}
  </div>
}

function PlanKindIcon({ kind }: { kind: string }) {
  if (kind === 'prayer') return <Moon className="h-4 w-4" />
  if (kind === 'habit' || kind === 'quran') return <Repeat className="h-4 w-4" />
  if (kind === 'rest') return <Clock3 className="h-4 w-4" />
  return <Check className="h-4 w-4" />
}
