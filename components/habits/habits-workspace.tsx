'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Archive, Check, Flame, Link2, Plus, Repeat, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useCommandCenter } from '@/lib/command-center-store'

function cairoToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
}

function getRecentDates(count: number) {
  const today = cairoToday()
  const base = new Date(`${today}T12:00:00Z`)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(base)
    date.setUTCDate(base.getUTCDate() - (count - index - 1))
    return date.toISOString().slice(0, 10)
  })
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', timeZone: 'Africa/Cairo' }).format(new Date(`${date}T12:00:00Z`))
}

function formatWeekday(date: string) {
  return new Intl.DateTimeFormat('ar-EG', { weekday: 'short', timeZone: 'Africa/Cairo' }).format(new Date(`${date}T12:00:00Z`))
}

export function HabitsWorkspace() {
  const { habits, tasks, projects, goals, toggleHabit, archiveHabit, addHabit } = useCommandCenter()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('20 دقيقة')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [taskId, setTaskId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [goalId, setGoalId] = useState('')
  const recentDates = useMemo(() => getRecentDates(35), [])
  const today = recentDates[recentDates.length - 1]
  const weekDates = recentDates.slice(-7)
  const completed = habits.filter((habit) => habit.doneToday).length
  const completionPercent = Math.round((completed / Math.max(habits.length, 1)) * 100)
  const isDoneOn = (habit: (typeof habits)[number], date: string) => date === today ? habit.doneToday : Boolean(habit.history?.[date])
  const weeklyCompleted = habits.reduce((total, habit) => total + (habit.frequency === 'weekly' ? (weekDates.some((date) => isDoneOn(habit, date)) ? 1 : 0) : weekDates.filter((date) => isDoneOn(habit, date)).length), 0)
  const weeklyTarget = habits.reduce((total, habit) => total + (habit.frequency === 'weekly' ? 1 : 7), 0)
  const weeklyPercent = Math.round((weeklyCompleted / Math.max(weeklyTarget, 1)) * 100)
  const weeklyDayScores = weekDates.map((date) => ({ date, completed: habits.filter((habit) => isDoneOn(habit, date)).length }))

  function submitHabit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    addHabit({ title, target, frequency, icon: 'عادة', taskId: taskId || undefined, projectId: projectId || undefined, goalId: goalId || undefined })
    setTitle('')
    setTarget('20 دقيقة')
    setFrequency('daily')
    setTaskId('')
    setProjectId('')
    setGoalId('')
    setShowForm(false)
  }

  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
    <ContentCard className="lg:col-span-8" title="عادات النهاردة" description={`${completed} من ${habits.length} عادات مكتملة`} action={<Button type="button" onClick={() => setShowForm((visible) => !visible)} aria-expanded={showForm} size="sm" className="gap-2 rounded-full text-xs font-semibold"><Plus className="h-3.5 w-3.5" /> عادة جديدة</Button>}>
      {showForm && <form onSubmit={submitHabit} className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4" aria-label="إضافة عادة جديدة">
        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">أضف عادة تناسب يومك</p><Button type="button" onClick={() => setShowForm(false)} aria-label="إغلاق نموذج العادة" variant="ghost" size="icon" className="rounded-lg text-muted-foreground"><X className="h-4 w-4" /></Button></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium"><span>اسم العادة</span><Input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus required maxLength={100} placeholder="مثل: المشي" /></label>
          <label className="space-y-1 text-xs font-medium"><span>هدفها</span><Input value={target} onChange={(event) => setTarget(event.target.value)} maxLength={80} placeholder="مثل: 20 دقيقة" /></label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-xs font-medium"><span>مهمة مرتبطة</span><Select value={taskId} onChange={(event) => setTaskId(event.target.value)}><option value="">بدون مهمة</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</Select></label>
          <label className="space-y-1 text-xs font-medium"><span>مشروع مرتبط</span><Select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">بدون مشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</Select></label>
          <label className="space-y-1 text-xs font-medium"><span>هدف مرتبط</span><Select value={goalId} onChange={(event) => setGoalId(event.target.value)}><option value="">بدون هدف</option>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</Select></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-xs font-medium">التكرار:</span><Button type="button" onClick={() => setFrequency('daily')} aria-pressed={frequency === 'daily'} variant={frequency === 'daily' ? 'default' : 'secondary'} size="sm" className="rounded-full px-3 py-1.5 text-xs">يوميًا</Button><Button type="button" onClick={() => setFrequency('weekly')} aria-pressed={frequency === 'weekly'} variant={frequency === 'weekly' ? 'default' : 'secondary'} size="sm" className="rounded-full px-3 py-1.5 text-xs">أسبوعيًا</Button><Button type="submit" size="sm" className="ms-auto rounded-xl px-4 py-2 text-xs font-semibold">حفظ العادة</Button></div>
      </form>}
      {habits.length === 0 ? <EmptyState icon={Repeat} title="لا توجد عادات بعد" description="ابدأ بعادة صغيرة مرتبطة بهدف أو مشروع حتى يظهر أثرها في خطة اليوم." action={<Button type="button" onClick={() => setShowForm(true)} size="sm" className="rounded-xl text-xs font-semibold">أضف أول عادة</Button>} /> : <div className="grid gap-3 sm:grid-cols-2">{habits.map((habit) => {
        const task = habit.taskId ? tasks.find((item) => item.id === habit.taskId) : undefined
        const project = habit.projectId ? projects.find((item) => item.id === habit.projectId) : task?.projectId ? projects.find((item) => item.id === task.projectId) : undefined
        const goal = habit.goalId ? goals.find((item) => item.id === habit.goalId) : project?.goalId ? goals.find((item) => item.id === project.goalId) : undefined
        return <div key={habit.id} id={habit.id} className="scroll-mt-24 rounded-2xl border border-border/70 bg-muted/60 p-4 transition-all hover:-translate-y-0.5 hover:bg-card">
          <div className="flex items-start gap-2">
            <Button type="button" onClick={() => toggleHabit(habit.id)} aria-pressed={habit.doneToday} variant="ghost" className="h-auto min-w-0 flex-1 justify-start gap-3 rounded-2xl p-0 text-right hover:bg-transparent"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${habit.doneToday ? 'bg-positive text-positive-foreground' : 'bg-card text-muted-foreground'}`}>{habit.doneToday ? <Check className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}</span><span className="min-w-0 flex-1"><span className={`block text-sm font-semibold ${habit.doneToday ? 'text-muted-foreground line-through' : ''}`}>{habit.title}</span><span className="mt-1 block text-xs text-muted-foreground">هدف {habit.frequency === 'weekly' ? 'الأسبوع' : 'اليوم'}: {habit.target}</span></span><span className="flex items-center gap-1 text-xs font-semibold text-warning-foreground"><Flame className="h-4 w-4" />{habit.streak}</span></Button>
            <Button type="button" onClick={() => archiveHabit(habit.id)} aria-label={`أرشفة ${habit.title}`} variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-warning/20 hover:text-warning-foreground"><Archive className="h-4 w-4" /></Button>
          </div>
          {(task || project || goal) && <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]"><span className="inline-flex items-center gap-1 text-muted-foreground"><Link2 className="h-3 w-3 text-primary" />مرتبط بـ</span>{task && <Link href={`/tasks#task-${task.id}`} className="rounded-full bg-accent px-2 py-1 text-accent-foreground hover:underline">مهمة: {task.title}</Link>}{project && <Link href={`/projects#${project.id}`} className="rounded-full bg-card px-2 py-1 hover:underline">مشروع: {project.title}</Link>}{goal && <Link href={`/goals#${goal.id}`} className="rounded-full bg-primary/10 px-2 py-1 text-primary hover:underline">هدف: {goal.title}</Link>}</div>}
          <HabitHeatmap dates={recentDates} history={{ ...(habit.history ?? {}), [today]: habit.doneToday }} title={habit.title} />
        </div>
      })}</div>}
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-accent p-4"><Sparkles className="h-5 w-5 text-accent-foreground" /><p className="text-xs leading-6 text-accent-foreground">العادة لا تحتاج يومًا مثاليًا؛ فقط ارجع للمسار في الخطوة التالية.</p></div>
    </ContentCard>
          <ContentCard className="lg:col-span-4" title="استمراريتك" description="مقارنة واضحة بين إنجاز اليوم والأسبوع"><div className="flex items-end gap-3"><span className="text-5xl font-semibold">{completionPercent}%</span><span className="mb-2 text-xs text-muted-foreground">إنجاز اليوم</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPercent}%` }} /></div><div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-2xl font-semibold">{weeklyPercent}%</p><p className="text-[10px] text-muted-foreground">إنجاز الأسبوع</p></div><p className="text-start text-[10px] leading-4 text-muted-foreground">{weeklyCompleted} من {weeklyTarget} إنجازًا مستهدفًا</p></div><div className="mt-4 grid grid-cols-7 gap-1.5">{weeklyDayScores.map(({ date, completed: dayCompleted }) => <div key={date} className="text-center" title={`${formatShortDate(date)}: ${dayCompleted} من ${habits.length}`}><span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[10px] ${dayCompleted > 0 ? 'bg-positive text-positive-foreground' : 'bg-muted text-muted-foreground'}`}>{dayCompleted > 0 ? <Check className="h-3 w-3" /> : '·'}</span><span className="mt-1 block text-[10px] text-muted-foreground">{formatWeekday(date)}</span></div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">كل مربع في سجل العادة يمثل يومًا مكتملًا، وتبقى البيانات المحلية مفيدة حتى عند غياب قاعدة البيانات.</p></ContentCard>

  </div>
}

function HabitHeatmap({ dates, history, title }: { dates: string[]; history: Record<string, boolean>; title: string }) {
  const completed = dates.filter((date) => history[date]).length
  return <div className="mt-4 border-t border-border/60 pt-3" aria-label={`شبكة إنجاز ${title}`}>
    <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground"><span>آخر 35 يومًا</span><span>{completed} يوم مكتمل</span></div>
    <div className="grid grid-cols-7 gap-1" dir="ltr">{dates.map((date) => <span key={date} title={`${formatShortDate(date)}: ${history[date] ? 'مكتمل' : 'غير مكتمل'}`} aria-label={`${formatShortDate(date)}، ${history[date] ? 'مكتمل' : 'غير مكتمل'}`} className={`h-3 w-full rounded-[3px] ${history[date] ? 'bg-primary' : 'bg-muted'}`} />)}</div>
  </div>
}
