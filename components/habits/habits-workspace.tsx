'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Check, Flame, Link2, Plus, Repeat, Sparkles, X } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
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

export function HabitsWorkspace() {
  const { habits, tasks, projects, goals, toggleHabit, addHabit } = useCommandCenter()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('20 دقيقة')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [taskId, setTaskId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [goalId, setGoalId] = useState('')
  const recentDates = useMemo(() => getRecentDates(35), [])
  const completed = habits.filter((habit) => habit.doneToday).length
  const completionPercent = Math.round((completed / Math.max(habits.length, 1)) * 100)

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
    <ContentCard className="lg:col-span-8" title="عادات النهاردة" description={`${completed} من ${habits.length} عادات مكتملة`} action={<button type="button" onClick={() => setShowForm((visible) => !visible)} aria-expanded={showForm} className="flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="h-3.5 w-3.5" /> عادة جديدة</button>}>
      {showForm && <form onSubmit={submitHabit} className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4" aria-label="إضافة عادة جديدة">
        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">أضف عادة تناسب يومك</p><button type="button" onClick={() => setShowForm(false)} aria-label="إغلاق نموذج العادة" className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium"><span>اسم العادة</span><input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus required maxLength={100} placeholder="مثل: المشي" className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
          <label className="space-y-1 text-xs font-medium"><span>هدفها</span><input value={target} onChange={(event) => setTarget(event.target.value)} maxLength={80} placeholder="مثل: 20 دقيقة" className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-xs font-medium"><span>مهمة مرتبطة</span><select value={taskId} onChange={(event) => setTaskId(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">بدون مهمة</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
          <label className="space-y-1 text-xs font-medium"><span>مشروع مرتبط</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">بدون مشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
          <label className="space-y-1 text-xs font-medium"><span>هدف مرتبط</span><select value={goalId} onChange={(event) => setGoalId(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">بدون هدف</option>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-xs font-medium">التكرار:</span><button type="button" onClick={() => setFrequency('daily')} aria-pressed={frequency === 'daily'} className={`rounded-full px-3 py-1.5 text-xs ${frequency === 'daily' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>يوميًا</button><button type="button" onClick={() => setFrequency('weekly')} aria-pressed={frequency === 'weekly'} className={`rounded-full px-3 py-1.5 text-xs ${frequency === 'weekly' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>أسبوعيًا</button><button type="submit" className="ms-auto rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">حفظ العادة</button></div>
      </form>}
      {habits.length === 0 ? <EmptyState icon={Repeat} title="لا توجد عادات بعد" description="ابدأ بعادة صغيرة مرتبطة بهدف أو مشروع حتى يظهر أثرها في خطة اليوم." action={<button type="button" onClick={() => setShowForm(true)} className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">أضف أول عادة</button>} /> : <div className="grid gap-3 sm:grid-cols-2">{habits.map((habit) => {
        const task = habit.taskId ? tasks.find((item) => item.id === habit.taskId) : undefined
        const project = habit.projectId ? projects.find((item) => item.id === habit.projectId) : task?.projectId ? projects.find((item) => item.id === task.projectId) : undefined
        const goal = habit.goalId ? goals.find((item) => item.id === habit.goalId) : project?.goalId ? goals.find((item) => item.id === project.goalId) : undefined
        return <div key={habit.id} id={habit.id} className="scroll-mt-24 rounded-2xl border border-border/70 bg-muted/60 p-4 transition-all hover:-translate-y-0.5 hover:bg-card">
          <button type="button" onClick={() => toggleHabit(habit.id)} aria-pressed={habit.doneToday} className="flex w-full items-center gap-3 text-right"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${habit.doneToday ? 'bg-positive text-positive-foreground' : 'bg-card text-muted-foreground'}`}>{habit.doneToday ? <Check className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}</span><span className="min-w-0 flex-1"><span className={`block text-sm font-semibold ${habit.doneToday ? 'text-muted-foreground line-through' : ''}`}>{habit.title}</span><span className="mt-1 block text-xs text-muted-foreground">هدف {habit.frequency === 'weekly' ? 'الأسبوع' : 'اليوم'}: {habit.target}</span></span><span className="flex items-center gap-1 text-xs font-semibold text-warning-foreground"><Flame className="h-4 w-4" />{habit.streak}</span></button>
          {(task || project || goal) && <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]"><span className="inline-flex items-center gap-1 text-muted-foreground"><Link2 className="h-3 w-3 text-primary" />مرتبط بـ</span>{task && <Link href={`/tasks#task-${task.id}`} className="rounded-full bg-accent px-2 py-1 text-accent-foreground hover:underline">مهمة: {task.title}</Link>}{project && <Link href={`/projects#${project.id}`} className="rounded-full bg-card px-2 py-1 hover:underline">مشروع: {project.title}</Link>}{goal && <Link href={`/goals#${goal.id}`} className="rounded-full bg-primary/10 px-2 py-1 text-primary hover:underline">هدف: {goal.title}</Link>}</div>}
          <HabitHeatmap dates={recentDates} history={habit.history ?? {}} title={habit.title} />
        </div>
      })}</div>}
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-accent p-4"><Sparkles className="h-5 w-5 text-accent-foreground" /><p className="text-xs leading-6 text-accent-foreground">العادة لا تحتاج يومًا مثاليًا؛ فقط ارجع للمسار في الخطوة التالية.</p></div>
    </ContentCard>
    <ContentCard className="lg:col-span-4" title="استمراريتك" description="الصورة الأكبر لآخر خمسة أسابيع"><div className="flex items-end gap-3"><span className="text-5xl font-semibold">{completionPercent}%</span><span className="mb-2 text-xs text-muted-foreground">إنجاز اليوم</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completionPercent}%` }} /></div><div className="mt-5 grid grid-cols-7 gap-1.5">{['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map((day, index) => <div key={day} className="text-center"><span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[10px] ${index < Math.min(completed, 5) ? 'bg-positive text-positive-foreground' : 'bg-muted text-muted-foreground'}`}>{index < Math.min(completed, 5) ? <Check className="h-3 w-3" /> : day}</span><span className="mt-1 block text-[10px] text-muted-foreground">{day}</span></div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">كل مربع في سجل العادة يمثل يومًا مكتملًا، وتبقى البيانات المحلية مفيدة حتى عند غياب قاعدة البيانات.</p></ContentCard>
  </div>
}

function HabitHeatmap({ dates, history, title }: { dates: string[]; history: Record<string, boolean>; title: string }) {
  const completed = dates.filter((date) => history[date]).length
  return <div className="mt-4 border-t border-border/60 pt-3" aria-label={`شبكة إنجاز ${title}`}>
    <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground"><span>آخر 35 يومًا</span><span>{completed} يوم مكتمل</span></div>
    <div className="grid grid-cols-7 gap-1" dir="ltr">{dates.map((date) => <span key={date} title={`${formatShortDate(date)}: ${history[date] ? 'مكتمل' : 'غير مكتمل'}`} aria-label={`${formatShortDate(date)}، ${history[date] ? 'مكتمل' : 'غير مكتمل'}`} className={`h-3 w-full rounded-[3px] ${history[date] ? 'bg-primary' : 'bg-muted'}`} />)}</div>
  </div>
}
