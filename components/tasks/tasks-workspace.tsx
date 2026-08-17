'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { Archive, Check, ChevronDown, Filter, GripVertical, Link2, ListPlus, Pencil, Plus, Repeat2, Save, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useCommandCenter, type Task } from '@/lib/command-center-store'

const filters = [
  { id: 'all', label: 'الكل' },
  { id: 'today', label: 'النهاردة' },
  { id: 'open', label: 'مفتوحة' },
  { id: 'done', label: 'مكتملة' },
]

const taskTimeBuckets = [
  { id: 'today', label: 'النهاردة', dueLabel: 'النهاردة' },
  { id: 'tomorrow', label: 'بكرة', dueLabel: 'بكرة' },
  { id: 'week', label: 'الأسبوع ده', dueLabel: 'هذا الأسبوع' },
  { id: 'later', label: 'بعدين', dueLabel: 'بعدين' },
] as const

type TaskTimeBucketId = (typeof taskTimeBuckets)[number]['id']
type TaskRecurrence = 'none' | 'daily' | 'weekly'

function taskRecurrence(task: Pick<Task, 'recurring' | 'dueLabel'>): TaskRecurrence {
  if (!task.recurring) return 'none'
  return task.dueLabel === 'هذا الأسبوع' || task.dueLabel === 'الأسبوع ده' ? 'weekly' : 'daily'
}

function taskTimeBucketId(dueLabel: string): TaskTimeBucketId {
  if (dueLabel === 'النهاردة') return 'today'
  if (dueLabel === 'بكرة') return 'tomorrow'
  if (dueLabel === 'هذا الأسبوع' || dueLabel === 'الأسبوع ده') return 'week'
  return 'later'
}

export function TasksWorkspace() {
  const { tasks, projects, goals, toggleTask, addTask, updateTask, archiveTask, addSubtask, toggleSubtask, removeSubtask } = useCommandCenter()
  const [filter, setFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | Task['priority']>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all')
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [newRecurrence, setNewRecurrence] = useState<TaskRecurrence>('none')
  const [newTitle, setNewTitle] = useState('')
  const [newTaskError, setNewTaskError] = useState('')
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const draggedTaskRef = useRef<string | null>(null)

  const categories = useMemo(() => Array.from(new Set(tasks.map((task) => task.category.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right, 'ar')), [tasks])
  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const normalizedQuery = query.trim()
    const matchesQuery = !normalizedQuery || task.title.includes(normalizedQuery) || task.category.includes(normalizedQuery)
    const matchesFilter = filter === 'all' || (filter === 'today' && task.dueLabel === 'النهاردة') || (filter === 'open' && task.status !== 'done') || (filter === 'done' && task.status === 'done')
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter
    return matchesQuery && matchesFilter && matchesStatus && matchesPriority && matchesCategory
  }), [tasks, filter, query, statusFilter, priorityFilter, categoryFilter])
  const tasksByTimeBucket = useMemo(() => taskTimeBuckets.reduce<Record<TaskTimeBucketId, Task[]>>((groups, bucket) => { groups[bucket.id] = visibleTasks.filter((task) => taskTimeBucketId(task.dueLabel) === bucket.id); return groups }, { today: [], tomorrow: [], week: [], later: [] }), [visibleTasks])
  const quickTasks = useMemo(() => tasks.filter((task) => task.status !== 'done' && task.priority === 'low' && taskTimeBucketId(task.dueLabel) === 'today').slice(0, 5), [tasks])

  function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) {
      setNewTaskError('اكتب اسم المهمة أولًا قبل الإضافة.')
      return
    }
    setNewTaskError('')
    addTask({ title, priority, dueLabel: newRecurrence === 'weekly' ? 'هذا الأسبوع' : 'النهاردة', category: 'عام', recurring: newRecurrence !== 'none' })
    setNewTitle('')
    setNewRecurrence('none')
  }

  function dropTask(bucket: typeof taskTimeBuckets[number]) {
    const taskId = draggedTaskRef.current
    if (!taskId) return
    updateTask(taskId, { dueLabel: bucket.dueLabel })
    draggedTaskRef.current = null
    setDraggedTaskId(null)
  }

  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
    <ContentCard className="lg:col-span-8" title="قائمة المهام" description={`${tasks.filter((task) => task.status !== 'done').length} مهام مفتوحة`} action={<div className="flex items-center gap-2 text-xs text-muted-foreground"><SlidersHorizontal className="h-4 w-4" /> مرتبة حسب الأولوية</div>}>
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="البحث في المهام" className="h-11 w-full rounded-2xl border border-input bg-background pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="ابحث في المهام..." /></div><div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-muted p-1">{filters.map((item) => <Button key={item.id} type="button" variant={filter === item.id ? "secondary" : "ghost"} size="sm" onClick={() => setFilter(item.id)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs ${filter === item.id ? 'font-semibold shadow-sm' : 'text-muted-foreground'}`}>{item.label}</Button>)}</div></div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"><div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Filter className="h-4 w-4 text-primary" /> فلاتر إضافية</div><Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | Task['status'])} aria-label="فلترة حسب الحالة" className="h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"><option value="all">كل الحالات</option><option value="todo">لم تبدأ</option><option value="in-progress">جارية</option><option value="done">مكتملة</option></Select><Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as 'all' | Task['priority'])} aria-label="فلترة حسب الأولوية" className="h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"><option value="all">كل الأولويات</option><option value="high">أولوية عالية</option><option value="medium">أولوية متوسطة</option><option value="low">أولوية منخفضة</option></Select><Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="فلترة حسب التصنيف" className="h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"><option value="all">كل التصنيفات</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</Select>{(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && <Button type="button" variant="outline" size="sm" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter('all') }} className="h-10 rounded-xl border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">مسح الفلاتر</Button>}</div>
      {visibleTasks.length === 0 ? (tasks.length === 0 && !query.trim() && filter === 'all' ? <div className="mt-5"><EmptyState icon={ListPlus} title="ابدأ بقائمة مهامك" description="أضف أول خطوة واضحة، وستظهر هنا مع الأولوية والسياق والموعد." /></div> : <div className="mt-5 rounded-2xl bg-muted px-4 py-12 text-center text-sm text-muted-foreground">مفيش مهام مطابقة للبحث الحالي.</div>) : <div className="mt-5 grid min-w-0 gap-3 xl:grid-cols-4">{taskTimeBuckets.map((bucket) => <section key={bucket.id} onDragOver={(event) => event.preventDefault()} onDrop={() => dropTask(bucket)} aria-label={`مهام ${bucket.label}`} className={`min-w-0 min-h-40 rounded-2xl border p-2.5 transition-colors ${draggedTaskId ? 'border-dashed border-primary/50 bg-primary/5' : 'border-border bg-muted/30'}`}><div className="mb-2 flex items-center justify-between gap-2 px-1"><h3 className="text-xs font-semibold">{bucket.label}</h3><span className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{tasksByTimeBucket[bucket.id].length}</span></div><div className="space-y-2">{tasksByTimeBucket[bucket.id].map((task) => { const project = projects.find((item) => item.id === task.projectId); const goal = project?.goalId ? goals.find((item) => item.id === project.goalId) : undefined; return <div key={task.id} draggable onDragStart={() => { draggedTaskRef.current = task.id; setDraggedTaskId(task.id) }} onDragEnd={() => { draggedTaskRef.current = null; setDraggedTaskId(null) }} className="cursor-grab active:cursor-grabbing"><TaskRow task={task} projectId={project?.id} projectTitle={project?.title} goalId={goal?.id} goalTitle={goal?.title} onToggle={() => toggleTask(task.id)} onArchive={() => archiveTask(task.id)} onUpdate={(patch) => updateTask(task.id, patch)} onMove={(dueLabel) => updateTask(task.id, { dueLabel })} onAddSubtask={(title) => addSubtask(task.id, title)} onToggleSubtask={(subtaskId) => toggleSubtask(task.id, subtaskId)} onRemoveSubtask={(subtaskId) => removeSubtask(task.id, subtaskId)} /></div> })}{tasksByTimeBucket[bucket.id].length === 0 && <div className="rounded-xl border border-dashed border-border px-3 py-5 text-center text-[11px] text-muted-foreground">اسحب مهمة هنا</div>}</div></section>)}</div>}
    </ContentCard>

    <div className="space-y-4 lg:col-span-4">
      <ContentCard title="مهمة جديدة" description="أصغر خطوة واضحة أفضل من قائمة طويلة."><form onSubmit={createTask} noValidate><Input value={newTitle} onChange={(event) => { setNewTitle(event.target.value); if (newTaskError) setNewTaskError('') }} aria-label="عنوان المهمة الجديدة" aria-invalid={Boolean(newTaskError)} aria-describedby={newTaskError ? 'new-task-error' : undefined} className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="اكتب اسم المهمة..." />{newTaskError && <p id="new-task-error" role="alert" className="mt-2 text-xs text-destructive">{newTaskError}</p>}<div className="mt-3 flex gap-2">{(['high', 'medium', 'low'] as Task['priority'][]).map((item) => <Button key={item} type="button" variant={priority === item ? "secondary" : "outline"} size="sm" onClick={() => setPriority(item)} className={`flex-1 rounded-xl border px-2 py-2 text-xs ${priority === item ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground'}`}>{item === 'high' ? 'عالية' : item === 'medium' ? 'متوسطة' : 'منخفضة'}</Button>)}</div><div className="mt-3 rounded-2xl border border-border bg-muted/40 p-2"><p className="px-1 text-[11px] font-semibold text-muted-foreground">التكرار</p><div className="mt-2 flex gap-1">{(['none', 'daily', 'weekly'] as TaskRecurrence[]).map((item) => <Button key={item} type="button" variant={newRecurrence === item ? "default" : "ghost"} size="sm" onClick={() => setNewRecurrence(item)} className={`flex-1 rounded-xl px-2 py-2 text-[11px] ${newRecurrence === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>{item === 'none' ? 'بدون' : item === 'daily' ? 'يومي' : 'أسبوعي'}</Button>)}</div></div><Button type="submit" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> إضافة المهمة</Button></form></ContentCard>
      <ContentCard title="أقل من دقيقتين" description="خطوات صغيرة تقدر تخلصها فورًا."><div className="space-y-2">{quickTasks.map((task) => <div key={task.id} className="flex items-center gap-2 rounded-xl bg-muted/50 px-2.5 py-2"><Button type="button" variant="outline" size="icon-xs" onClick={() => toggleTask(task.id)} aria-label={`إكمال المهمة السريعة ${task.title}`} className="flex shrink-0 items-center justify-center rounded-full border-border bg-card hover:border-primary"><Check className="h-3.5 w-3.5 text-primary" /></Button><span className="min-w-0 flex-1 truncate text-xs">{task.title}</span></div>)}{quickTasks.length === 0 && <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">لا توجد خطوات سريعة اليوم.</p>}</div></ContentCard>
      <ContentCard title="فلتر سريع" description="نظرة على توزيع الشغل"><div className="space-y-3"><MiniStat label="إجمالي المهام" value={tasks.length} /><MiniStat label="مهام اليوم" value={tasks.filter((task) => task.dueLabel === 'النهاردة').length} /><MiniStat label="مفتوحة" value={tasks.filter((task) => task.status !== 'done').length} /><MiniStat label="عالية الأولوية" value={tasks.filter((task) => task.priority === 'high' && task.status !== 'done').length} /><MiniStat label="مكتملة" value={tasks.filter((task) => task.status === 'done').length} /><MiniStat label="خطوات فرعية" value={tasks.reduce((total, task) => total + (task.subtasks?.length ?? 0), 0)} /></div><div className="mt-4 rounded-2xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground"><div className="flex items-center gap-2 font-semibold text-foreground"><GripVertical className="h-3.5 w-3.5 text-primary" />تنظيم زمني سريع</div><p className="mt-1.5 leading-5">اسحب أي مهمة إلى عمود النهاردة أو بكرة أو الأسبوع ده أو بعدين لتحديث موعدها.</p></div></ContentCard>
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
  onUpdate: (patch: Partial<Pick<Task, 'title' | 'priority' | 'dueLabel' | 'category' | 'recurring'>>) => void
  onMove: (dueLabel: string) => void
  onAddSubtask: (title: string) => void
  onToggleSubtask: (id: string) => void
  onRemoveSubtask: (id: string) => void
}

function TaskRow({ task, projectId, projectTitle, goalId, goalTitle, onToggle, onArchive, onUpdate, onMove, onAddSubtask, onToggleSubtask, onRemoveSubtask }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDueLabel, setEditDueLabel] = useState(task.dueLabel)
  const [editCategory, setEditCategory] = useState(task.category)
  const [editPriority, setEditPriority] = useState(task.priority)
  const [editRecurrence, setEditRecurrence] = useState<TaskRecurrence>(taskRecurrence(task))
  const [newSubtask, setNewSubtask] = useState('')
  const [editError, setEditError] = useState('')
  const [subtaskError, setSubtaskError] = useState('')
  const priorityLabel = task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'
  const subtasks = task.subtasks ?? []
  const completedSubtasks = subtasks.filter((subtask) => subtask.done).length

  function submitSubtask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newSubtask.trim()) {
      setSubtaskError('اكتب الخطوة الفرعية أولًا.')
      return
    }
    setSubtaskError('')
    onAddSubtask(newSubtask.trim())
    setNewSubtask('')
  }

  function startEditing() {
    setEditTitle(task.title)
    setEditDueLabel(task.dueLabel)
    setEditCategory(task.category)
    setEditPriority(task.priority)
    setEditRecurrence(taskRecurrence(task))
    setEditError('')
    setEditing(true)
  }

  function saveEditing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editTitle.trim() || !editCategory.trim() || !editDueLabel.trim()) {
      setEditError('اكتب عنوان المهمة والموعد والتصنيف أولًا.')
      return
    }
    setEditError('')
    onUpdate({ title: editTitle.trim(), dueLabel: editRecurrence === 'weekly' ? 'هذا الأسبوع' : editRecurrence === 'daily' ? 'النهاردة' : editDueLabel.trim(), category: editCategory.trim(), priority: editPriority, recurring: editRecurrence !== 'none' })
    setEditing(false)
  }

  return <div id={`task-${task.id}`} className="group min-w-0 rounded-2xl border border-transparent bg-muted/60 px-3 py-3 transition-colors hover:border-border hover:bg-card"><div className="flex min-w-0 flex-wrap items-center gap-3"><Button type="button" variant={task.status === 'done' ? "default" : "outline"} size="icon-sm" onClick={onToggle} aria-label={task.status === 'done' ? 'إعادة فتح المهمة' : 'إكمال المهمة'} className={`shrink-0 rounded-full border-2 ${task.status === 'done' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>{task.status === 'done' && <Check className="h-3.5 w-3.5" />}</Button><div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${task.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>{task.title}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground"><span>{task.dueLabel}</span><span>•</span><span>{task.category}</span>{task.recurring && <><span>•</span><span className="inline-flex items-center gap-1 text-primary"><Repeat2 className="h-3 w-3" />{taskRecurrence(task) === 'weekly' ? 'أسبوعية' : 'يومية'}</span></>}{subtasks.length > 0 && <><span>•</span><span>{completedSubtasks}/{subtasks.length} خطوات</span></>}{projectTitle && projectId && <Link href={`/projects#${projectId}`} className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-accent-foreground hover:underline"><Link2 className="h-3 w-3" />{projectTitle}</Link>}{goalTitle && goalId && <Link href={`/goals#${goalId}`} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary hover:underline"><Link2 className="h-3 w-3" />{goalTitle}</Link>}</div></div><div role="group" aria-label={`نقل المهمة ${task.title}`} className="flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-border bg-background p-1"><span className="sr-only">نقل المهمة</span>{taskTimeBuckets.map((bucket) => { const active = taskTimeBucketId(task.dueLabel) === bucket.id; const label = bucket.id === 'today' ? 'اليوم' : bucket.id === 'tomorrow' ? 'بكرة' : bucket.id === 'week' ? 'أسبوع' : 'بعدين'; return <Button key={bucket.id} type="button" variant={active ? "default" : "ghost"} size="xs" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onMove(bucket.dueLabel) }} aria-label={`نقل المهمة ${task.title} إلى ${bucket.label}`} aria-pressed={active} className={`rounded-lg px-1.5 py-1 text-[10px] transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>{label}</Button> })}</div><span aria-label={`أولوية ${priorityLabel}`} className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${task.priority === 'high' ? 'border-warning/40 bg-warning/15 text-warning-foreground' : task.priority === 'medium' ? 'border-accent/50 bg-accent text-accent-foreground' : 'border-border bg-muted text-muted-foreground'}`}><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${task.priority === 'high' ? 'bg-warning-foreground' : task.priority === 'medium' ? 'bg-accent-foreground' : 'bg-muted-foreground'}`} />{priorityLabel}</span><Button type="button" variant="ghost" size="icon-sm" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-label={expanded ? 'إخفاء الخطوات الفرعية' : 'عرض الخطوات الفرعية'} className={`rounded-full p-2 text-muted-foreground transition-transform hover:bg-accent ${expanded ? 'rotate-180' : ''}`}><ChevronDown className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={startEditing} aria-label="تعديل المهمة" className="rounded-full p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 focus:opacity-100"><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={onArchive} aria-label="أرشفة المهمة" className="rounded-full p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-warning group-hover:opacity-100 focus:opacity-100"><Archive className="h-4 w-4" /></Button></div>{editing && <form onSubmit={saveEditing} noValidate className="mt-3 grid gap-2 border-t border-border/70 pt-3 sm:grid-cols-2"><Input value={editTitle} onChange={(event) => { setEditTitle(event.target.value); if (editError) setEditError('') }} aria-label={`عنوان المهمة ${task.title}`} aria-invalid={Boolean(editError)} aria-describedby={editError ? 'task-edit-error' : undefined} className="rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring sm:col-span-2" /><Input value={editDueLabel} onChange={(event) => { setEditDueLabel(event.target.value); if (editError) setEditError('') }} aria-label={`موعد المهمة ${task.title}`} aria-invalid={Boolean(editError)} aria-describedby={editError ? 'task-edit-error' : undefined} className="rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" placeholder="الموعد" /><div className="flex gap-1 rounded-xl border border-input bg-background p-1"><span className="sr-only">تكرار المهمة</span>{(['none', 'daily', 'weekly'] as TaskRecurrence[]).map((item) => <Button key={item} type="button" variant={editRecurrence === item ? "default" : "ghost"} size="xs" onClick={() => { setEditRecurrence(item); if (editError) setEditError('') }} className={`flex-1 rounded-lg px-2 py-1.5 text-[10px] ${editRecurrence === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>{item === 'none' ? 'بدون' : item === 'daily' ? 'يومي' : 'أسبوعي'}</Button>)}</div><Input value={editCategory} onChange={(event) => { setEditCategory(event.target.value); if (editError) setEditError('') }} aria-label={`تصنيف المهمة ${task.title}`} aria-invalid={Boolean(editError)} aria-describedby={editError ? 'task-edit-error' : undefined} className="rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" placeholder="التصنيف" />{editError && <p id="task-edit-error" role="alert" className="text-xs text-destructive sm:col-span-2">{editError}</p>}<div className="flex gap-2 sm:col-span-2">{(['high', 'medium', 'low'] as Task['priority'][]).map((item) => <Button key={item} type="button" variant={editPriority === item ? "secondary" : "outline"} size="sm" onClick={() => setEditPriority(item)} className={`flex-1 rounded-xl border px-2 py-2 text-xs ${editPriority === item ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground'}`}>{item === 'high' ? 'عالية' : item === 'medium' ? 'متوسطة' : 'منخفضة'}</Button>)}<Button type="submit" aria-label="حفظ تعديل المهمة" className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Save className="h-3.5 w-3.5" /> حفظ</Button><Button type="button" variant="outline" aria-label="إلغاء تعديل المهمة" onClick={() => setEditing(false)} className="inline-flex items-center gap-1 rounded-xl border-border px-3 py-2 text-xs text-muted-foreground"><X className="h-3.5 w-3.5" /> إلغاء</Button></div></form>}{expanded && <div className="mt-3 border-t border-border/70 pt-3"><div className="space-y-2">{subtasks.map((subtask) => <div key={subtask.id} className="flex items-center gap-2 rounded-xl bg-background/70 px-2 py-2"><Button type="button" variant={subtask.done ? "default" : "outline"} size="icon-xs" onClick={() => onToggleSubtask(subtask.id)} aria-label={subtask.done ? 'إعادة فتح الخطوة الفرعية' : 'إنجاز الخطوة الفرعية'} className={`shrink-0 rounded-md border ${subtask.done ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{subtask.done && <Check className="h-3 w-3" />}</Button><span className={`min-w-0 flex-1 text-xs ${subtask.done ? 'text-muted-foreground line-through' : ''}`}>{subtask.title}</span><Button type="button" variant="ghost" size="icon-xs" onClick={() => onRemoveSubtask(subtask.id)} aria-label="حذف الخطوة الفرعية" className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></div>)}{subtasks.length === 0 && <p className="text-xs text-muted-foreground">أضف أول خطوة صغيرة لتقسيم المهمة.</p>}</div><form onSubmit={submitSubtask} noValidate className="mt-3 flex flex-wrap gap-2"><Input value={newSubtask} onChange={(event) => { setNewSubtask(event.target.value); if (subtaskError) setSubtaskError('') }} aria-label={`إضافة خطوة فرعية إلى ${task.title}`} aria-invalid={Boolean(subtaskError)} aria-describedby={subtaskError ? 'subtask-error' : undefined} className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" placeholder="خطوة فرعية..." /><Button type="submit" aria-label="إضافة خطوة فرعية" className="flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><ListPlus className="h-3.5 w-3.5" /> إضافة</Button>{subtaskError && <p id="subtask-error" role="alert" className="w-full text-xs text-destructive">{subtaskError}</p>}</form></div>}</div>
}

function MiniStat({ label, value }: { label: string; value: number }) { return <div className="flex items-center justify-between rounded-2xl bg-muted px-3 py-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div> }

void Filter
