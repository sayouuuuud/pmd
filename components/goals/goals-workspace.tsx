'use client'

import { Archive, CalendarDays, CheckCircle2, ChevronDown, Circle, Pause, Pencil, Play, Plus, Save, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { useCommandCenter, type Goal, type GoalHorizon, type Project, type Task } from '@/lib/command-center-store'

const horizonLabels: Record<GoalHorizon, string> = {
  quarter: 'هذا الربع',
  year: 'هذه السنة',
  someday: 'لاحقًا',
}

export function GoalsWorkspace() {
  const { goals, projects, tasks, addGoal, updateGoal, archiveGoal, toggleTask, addTask } = useCommandCenter()

  function createGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    if (!title) return
    addGoal({
      title,
      description: String(form.get('description') ?? '').trim(),
      horizon: String(form.get('horizon') ?? 'quarter') as GoalHorizon,
      targetLabel: String(form.get('targetLabel') ?? '').trim() || 'بدون موعد محدد',
    })
    event.currentTarget.reset()
  }

  const activeGoals = goals.filter((goal) => goal.status !== 'completed')
  const linkedProjects = projects.filter((project) => project.goalId)
  const derivedProgress = useMemo(() => goals.map((goal) => {
    const goalProjects = projects.filter((project) => project.goalId === goal.id)
    const goalTasks = tasks.filter((task) => task.projectId && goalProjects.some((project) => project.id === task.projectId))
    if (!goalTasks.length) return { id: goal.id, progress: goal.progress, taskCount: 0, completedTasks: 0 }
    const completedTasks = goalTasks.filter((task) => task.status === 'done').length
    return { id: goal.id, progress: Math.round((completedTasks / goalTasks.length) * 100), taskCount: goalTasks.length, completedTasks }
  }), [goals, projects, tasks])

  return <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ContentCard className="lg:col-span-8" title="أهدافي الحالية" description="خلّي الصورة الكبيرة واضحة، وسيب المشاريع تحمل التنفيذ اليومي.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {activeGoals.map((goal) => {
            const goalProjects = projects.filter((project) => project.goalId === goal.id)
            const summary = derivedProgress.find((item) => item.id === goal.id) ?? { progress: goal.progress, taskCount: 0, completedTasks: 0 }
            return <GoalCard key={goal.id} goal={goal} projects={goalProjects} tasks={tasks} progress={summary.progress} taskCount={summary.taskCount} completedTasks={summary.completedTasks} onPause={() => updateGoal(goal.id, { status: goal.status === 'paused' ? 'active' : 'paused' })} onArchive={() => archiveGoal(goal.id)} onUpdate={(patch) => updateGoal(goal.id, patch)} onToggleTask={toggleTask} onAddTask={(projectId, title) => addTask({ title, priority: 'medium', dueLabel: 'بدون موعد', category: 'هدف', projectId })} />
          })}
          {activeGoals.length === 0 && <div className="md:col-span-2"><EmptyState icon={Target} title="مفيش أهداف نشطة لسه" description="ابدأ بهدف واحد واضح، وبعدها اربطه بمشاريع تحمل التنفيذ اليومي." /></div>}
        </div>
      </ContentCard>

      <ContentCard title="هدف جديد" description="اختار نتيجة قابلة للفهم، مش مجرد قائمة أمنيات.">
        <form onSubmit={createGoal} className="space-y-3">
          <input name="title" required className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="مثال: إطلاق النسخة الأولى" />
          <textarea name="description" className="min-h-20 w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="ليه الهدف ده مهم؟" />
          <div className="grid grid-cols-2 gap-2">
            <select name="horizon" defaultValue="quarter" className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="quarter">هذا الربع</option>
              <option value="year">هذه السنة</option>
              <option value="someday">لاحقًا</option>
            </select>
            <input name="targetLabel" className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="موعد تقريبي" />
          </div>
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> إضافة الهدف</button>
        </form>
      </ContentCard>
    </div>

    <ContentCard title="قراءة سريعة" description="الأهداف لا تتحرك وحدها؛ راجع المشاريع والمهام التي تحمل كل هدف.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat label="أهداف نشطة" value={activeGoals.length} />
        <MiniStat label="مشاريع مرتبطة" value={linkedProjects.length} />
        <MiniStat label="متوسط التقدم" value={`${derivedProgress.length ? Math.round(derivedProgress.reduce((sum, goal) => sum + goal.progress, 0) / derivedProgress.length) : 0}%`} />
      </div>
    </ContentCard>
  </div>
}

function GoalCard({ goal, projects, tasks, progress, taskCount, completedTasks, onPause, onArchive, onUpdate, onToggleTask, onAddTask }: { goal: Goal; projects: Project[]; tasks: Task[]; progress: number; taskCount: number; completedTasks: number; onPause: () => void; onArchive: () => void; onUpdate: (patch: Partial<Goal>) => void; onToggleTask: (id: string) => void; onAddTask: (projectId: string, title: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [description, setDescription] = useState(goal.description)
  const [targetLabel, setTargetLabel] = useState(goal.targetLabel)
  const [taskTitle, setTaskTitle] = useState('')
  const isPaused = goal.status === 'paused'
  const linkedTasks = tasks.filter((task) => task.projectId && projects.some((project) => project.id === task.projectId))
  const firstProject = projects[0]

  function saveDetails() {
    onUpdate({ description: description.trim(), targetLabel: targetLabel.trim() || 'بدون موعد محدد' })
    setEditing(false)
  }

  function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!firstProject || !taskTitle.trim()) return
    onAddTask(firstProject.id, taskTitle.trim())
    setTaskTitle('')
  }

  return <article className={`rounded-2xl border bg-muted/40 p-4 ${isPaused ? 'border-warning/60' : 'border-border'}`}>
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Target className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1"><h3 className="font-semibold">{goal.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{goal.description || 'بدون وصف إضافي'}</p></div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-label={expanded ? `إخفاء تفاصيل ${goal.title}` : `عرض تفاصيل ${goal.title}`} className="rounded-full p-2 text-muted-foreground hover:bg-accent"><ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>
        <button type="button" onClick={onArchive} aria-label={`أرشفة ${goal.title}`} className="rounded-full p-2 text-muted-foreground hover:bg-warning"><Archive className="h-4 w-4" /></button>
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{horizonLabels[goal.horizon]}</span><span>{projects.length} مشاريع · {completedTasks}/{taskCount || 0} مهام</span></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
    <div className="mt-2 flex items-center justify-between text-xs"><span className="font-semibold">{progress}%</span><button type="button" onClick={onPause} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground">{isPaused ? <><Play className="h-3 w-3" />استئناف</> : <><Pause className="h-3 w-3" />إيقاف مؤقت</>}</button><span className="text-muted-foreground">{goal.targetLabel}</span></div>

    {expanded && <div className="mt-4 space-y-4 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-2"><div><p className="text-sm font-semibold">تفاصيل الهدف</p><p className="mt-1 text-xs text-muted-foreground">التقدم محسوب من المهام المرتبطة بمشاريع هذا الهدف.</p></div><button type="button" onClick={() => setEditing((value) => !value)} className="inline-flex items-center gap-1 rounded-xl bg-muted px-3 py-2 text-xs font-medium hover:bg-accent"><Pencil className="h-3.5 w-3.5" /> تعديل</button></div>
      {editing && <div className="space-y-2 rounded-2xl bg-background p-3"><textarea value={description} onChange={(event) => setDescription(event.target.value)} aria-label="وصف الهدف" className="min-h-20 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" placeholder="وصف الهدف" /><input value={targetLabel} onChange={(event) => setTargetLabel(event.target.value)} aria-label="موعد الهدف" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" placeholder="موعد تقريبي" /><button type="button" onClick={saveDetails} className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Save className="h-3.5 w-3.5" />حفظ التعديلات</button></div>}
      <div className="space-y-2"><p className="text-xs font-semibold text-muted-foreground">المشاريع الحاملة للهدف</p>{projects.length ? projects.map((project) => <div key={project.id} className="flex items-center justify-between rounded-xl bg-background px-3 py-2 text-xs"><span className="font-medium">{project.title}</span><span className="text-muted-foreground">{project.progress}% · {project.status === 'done' ? 'مكتمل' : project.status === 'in-progress' ? 'شغال' : 'أفكار'}</span></div>) : <div className="rounded-xl bg-background px-3 py-3 text-xs text-muted-foreground">اربط مشروعًا بهذا الهدف من صفحة المشاريع.</div>}</div>
      <div className="space-y-2"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-muted-foreground">المهام المرتبطة</p><span className="text-xs text-muted-foreground">{linkedTasks.length} مهام</span></div>{linkedTasks.length ? linkedTasks.map((task) => <button type="button" key={task.id} onClick={() => onToggleTask(task.id)} className="flex w-full items-center gap-2 rounded-xl bg-background px-3 py-2 text-right text-xs hover:bg-accent">{task.status === 'done' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}<span className={task.status === 'done' ? 'text-muted-foreground line-through' : 'font-medium'}>{task.title}</span></button>) : <div className="rounded-xl bg-background px-3 py-3 text-xs text-muted-foreground">لا توجد مهام بعد لهذا الهدف.</div>}</div>
      {firstProject && <form onSubmit={createTask} className="flex gap-2"><input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} aria-label="مهمة جديدة للهدف" placeholder={`أضف مهمة إلى ${firstProject.title}`} className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" /><button type="submit" className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="h-3.5 w-3.5" />مهمة</button></form>}
    </div>}
  </article>
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="flex items-center justify-between rounded-2xl bg-muted px-3 py-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>
}
