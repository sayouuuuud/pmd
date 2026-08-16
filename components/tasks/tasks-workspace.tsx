'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Archive, Check, ChevronDown, Filter, Link2, ListPlus, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { useCommandCenter, type Task } from '@/lib/command-center-store'

const filters = [
  { id: 'all', label: 'الكل' },
  { id: 'today', label: 'النهاردة' },
  { id: 'open', label: 'مفتوحة' },
  { id: 'done', label: 'مكتملة' },
]

export function TasksWorkspace() {
  const { tasks, projects, goals, toggleTask, addTask, archiveTask, addSubtask, toggleSubtask, removeSubtask } = useCommandCenter()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [newTitle, setNewTitle] = useState('')

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const normalizedQuery = query.trim()
    const matchesQuery = !normalizedQuery || task.title.includes(normalizedQuery) || task.category.includes(normalizedQuery)
    const matchesFilter = filter === 'all' || (filter === 'today' && task.dueLabel === 'النهاردة') || (filter === 'open' && task.status !== 'done') || (filter === 'done' && task.status === 'done')
    return matchesQuery && matchesFilter
  }), [tasks, filter, query])

  function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newTitle.trim()) return
    addTask({ title: newTitle.trim(), priority, dueLabel: 'النهاردة', category: 'عام' })
    setNewTitle('')
  }

  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
    <ContentCard className="lg:col-span-8" title="قائمة المهام" description={`${tasks.filter((task) => task.status !== 'done').length} مهام مفتوحة`} action={<div className="flex items-center gap-2 text-xs text-muted-foreground"><SlidersHorizontal className="h-4 w-4" /> مرتبة حسب الأولوية</div>}>
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="البحث في المهام" className="h-11 w-full rounded-2xl border border-input bg-background pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="ابحث في المهام..." /></div><div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-muted p-1">{filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs ${filter === item.id ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}>{item.label}</button>)}</div></div>
      <div className="mt-5 space-y-2">{visibleTasks.map((task) => { const project = projects.find((item) => item.id === task.projectId); const goal = project?.goalId ? goals.find((item) => item.id === project.goalId) : undefined; return <TaskRow key={task.id} task={task} projectId={project?.id} projectTitle={project?.title} goalId={goal?.id} goalTitle={goal?.title} onToggle={() => toggleTask(task.id)} onArchive={() => archiveTask(task.id)} onAddSubtask={(title) => addSubtask(task.id, title)} onToggleSubtask={(subtaskId) => toggleSubtask(task.id, subtaskId)} onRemoveSubtask={(subtaskId) => removeSubtask(task.id, subtaskId)} /> })}{visibleTasks.length === 0 && (tasks.length === 0 && !query.trim() && filter === 'all' ? <EmptyState icon={ListPlus} title="ابدأ بقائمة مهامك" description="أضف أول خطوة واضحة، وستظهر هنا مع الأولوية والسياق والموعد." /> : <div className="rounded-2xl bg-muted px-4 py-12 text-center text-sm text-muted-foreground">مفيش مهام مطابقة للبحث الحالي.</div>)}</div>
    </ContentCard>

    <div className="space-y-4 lg:col-span-4">
      <ContentCard title="مهمة جديدة" description="أصغر خطوة واضحة أفضل من قائمة طويلة."><form onSubmit={createTask}><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} aria-label="عنوان المهمة الجديدة" className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="اكتب اسم المهمة..." /><div className="mt-3 flex gap-2">{(['high', 'medium', 'low'] as Task['priority'][]).map((item) => <button key={item} type="button" onClick={() => setPriority(item)} className={`flex-1 rounded-xl border px-2 py-2 text-xs ${priority === item ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground'}`}>{item === 'high' ? 'عالية' : item === 'medium' ? 'متوسطة' : 'منخفضة'}</button>)}</div><button type="submit" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> إضافة المهمة</button></form></ContentCard>
      <ContentCard title="فلتر سريع" description="نظرة على توزيع الشغل"><div className="space-y-3"><MiniStat label="مفتوحة" value={tasks.filter((task) => task.status !== 'done').length} /><MiniStat label="عالية الأولوية" value={tasks.filter((task) => task.priority === 'high' && task.status !== 'done').length} /><MiniStat label="مكتملة" value={tasks.filter((task) => task.status === 'done').length} /><MiniStat label="خطوات فرعية" value={tasks.reduce((total, task) => total + (task.subtasks?.length ?? 0), 0)} /></div></ContentCard>
    </div>
  </div>
}

type TaskRowProps = {
  task: Task
  projectId?: string
  projectTitle?: string
  goalId?: string
  goalTitle?: string
  onToggle: () => void
  onArchive: () => void
  onAddSubtask: (title: string) => void
  onToggleSubtask: (id: string) => void
  onRemoveSubtask: (id: string) => void
}

function TaskRow({ task, projectId, projectTitle, goalId, goalTitle, onToggle, onArchive, onAddSubtask, onToggleSubtask, onRemoveSubtask }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [newSubtask, setNewSubtask] = useState('')
  const priorityLabel = task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'
  const subtasks = task.subtasks ?? []
  const completedSubtasks = subtasks.filter((subtask) => subtask.done).length

  function submitSubtask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newSubtask.trim()) return
    onAddSubtask(newSubtask)
    setNewSubtask('')
  }

  return <div id={`task-${task.id}`} className="group rounded-2xl border border-transparent bg-muted/60 px-3 py-3 transition-colors hover:border-border hover:bg-card"><div className="flex items-center gap-3"><button type="button" onClick={onToggle} aria-label={task.status === 'done' ? 'إعادة فتح المهمة' : 'إكمال المهمة'} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${task.status === 'done' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>{task.status === 'done' && <Check className="h-3.5 w-3.5" />}</button><div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${task.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>{task.title}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground"><span>{task.dueLabel}</span><span>•</span><span>{task.category}</span>{task.recurring && <><span>•</span><span className="text-primary">متكررة</span></>}{subtasks.length > 0 && <><span>•</span><span>{completedSubtasks}/{subtasks.length} خطوات</span></>}{projectTitle && projectId && <Link href={`/projects#${projectId}`} className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-accent-foreground hover:underline"><Link2 className="h-3 w-3" />{projectTitle}</Link>}{goalTitle && goalId && <Link href={`/goals#${goalId}`} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary hover:underline"><Link2 className="h-3 w-3" />{goalTitle}</Link>}</div></div><span className={`hidden rounded-full px-2 py-1 text-[10px] font-semibold sm:inline-flex ${task.priority === 'high' ? 'bg-warning text-warning-foreground' : task.priority === 'medium' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{priorityLabel}</span><button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-label={expanded ? 'إخفاء الخطوات الفرعية' : 'عرض الخطوات الفرعية'} className={`rounded-full p-2 text-muted-foreground transition-transform hover:bg-accent ${expanded ? 'rotate-180' : ''}`}><ChevronDown className="h-4 w-4" /></button><button type="button" onClick={onArchive} aria-label="أرشفة المهمة" className="rounded-full p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-warning group-hover:opacity-100 focus:opacity-100"><Archive className="h-4 w-4" /></button></div>{expanded && <div className="mt-3 border-t border-border/70 pt-3"><div className="space-y-2">{subtasks.map((subtask) => <div key={subtask.id} className="flex items-center gap-2 rounded-xl bg-background/70 px-2 py-2"><button type="button" onClick={() => onToggleSubtask(subtask.id)} aria-label={subtask.done ? 'إعادة فتح الخطوة الفرعية' : 'إنجاز الخطوة الفرعية'} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${subtask.done ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{subtask.done && <Check className="h-3 w-3" />}</button><span className={`min-w-0 flex-1 text-xs ${subtask.done ? 'text-muted-foreground line-through' : ''}`}>{subtask.title}</span><button type="button" onClick={() => onRemoveSubtask(subtask.id)} aria-label="حذف الخطوة الفرعية" className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div>)}{subtasks.length === 0 && <p className="text-xs text-muted-foreground">أضف أول خطوة صغيرة لتقسيم المهمة.</p>}</div><form onSubmit={submitSubtask} className="mt-3 flex gap-2"><input value={newSubtask} onChange={(event) => setNewSubtask(event.target.value)} aria-label={`إضافة خطوة فرعية إلى ${task.title}`} className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" placeholder="خطوة فرعية..." /><button type="submit" aria-label="إضافة خطوة فرعية" className="flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><ListPlus className="h-3.5 w-3.5" /> إضافة</button></form></div>}</div>
}

function MiniStat({ label, value }: { label: string; value: number }) { return <div className="flex items-center justify-between rounded-2xl bg-muted px-3 py-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div> }

void Filter
