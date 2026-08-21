'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Archive, CalendarDays, Check, ChevronDown, Clock3, CornerUpLeft, Link2, Plus, Repeat2, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useCommandCenter, type Task } from '@/lib/command-center-store'
import { combineLocalDateTime, formatTaskDue, isTaskDueToday, isTaskOverdue, localDateKey, recurrenceLabel, type TaskRecurrence } from '@/lib/task-dates'
import { getBlockingTasks, isTaskBlocked } from '@/lib/task-operations'

type SortBy = 'due' | 'created' | 'updated' | 'priority'
type ViewFilter = 'all' | 'today' | 'overdue' | 'open' | 'done'

const priorityOrder = { high: 0, medium: 1, low: 2 }
const recurrenceOptions: { value: TaskRecurrence; label: string }[] = [
  { value: 'none', label: 'بدون تكرار' }, { value: 'daily', label: 'يومي' },
  { value: 'weekly', label: 'أسبوعي' }, { value: 'monthly', label: 'شهري' },
]

export function TasksWorkspace() {
  const { tasks, toggleTask, addTask, updateTask, archiveTask, bulkUpdateTasks, bulkArchiveTasks, undoTaskAction, canUndoTaskAction, addSubtask, toggleSubtask, removeSubtask } = useCommandCenter()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ViewFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('due')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [preferencesReady, setPreferencesReady] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(localDateKey())
  const [time, setTime] = useState('09:00')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none')
  const [reminderMinutes, setReminderMinutes] = useState('0')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('pmd-task-view-preferences') ?? '{}') as { filter?: ViewFilter; sortBy?: SortBy }
      if (saved.filter) setFilter(saved.filter)
      if (saved.sortBy) setSortBy(saved.sortBy)
    } catch {
      // Keep defaults when preferences are malformed.
    } finally {
      setPreferencesReady(true)
    }
  }, [])

  useEffect(() => {
    if (preferencesReady) window.localStorage.setItem('pmd-task-view-preferences', JSON.stringify({ filter, sortBy }))
  }, [filter, preferencesReady, sortBy])

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const text = `${task.title} ${task.description ?? ''} ${task.category}`
    const matchesQuery = !query.trim() || text.includes(query.trim())
    const matchesFilter = filter === 'all'
      || (filter === 'today' && isTaskDueToday(task))
      || (filter === 'overdue' && isTaskOverdue(task))
      || (filter === 'open' && task.status !== 'done')
      || (filter === 'done' && task.status === 'done')
    return matchesQuery && matchesFilter
  }).sort((a, b) => {
    if (sortBy === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority]
    if (sortBy === 'created') return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    if (sortBy === 'updated') return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
    const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER
    const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER
    return aTime - bTime
  }), [filter, query, sortBy, tasks])

  const overdue = visibleTasks.filter((task) => isTaskOverdue(task))
  const upcoming = visibleTasks.filter((task) => !isTaskOverdue(task))

  function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    const dueAt = combineLocalDateTime(date, time)
    if (!cleanTitle || !dueAt) { setError('اكتب عنوانًا وحدد تاريخًا صحيحًا.'); return }
    addTask({
      title: cleanTitle, priority, category: 'عام', dueAt,
      dueLabel: formatTaskDue({ dueAt }), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      recurrence, recurring: recurrence !== 'none', reminderMinutes: Number(reminderMinutes),
    })
    setTitle(''); setRecurrence('none'); setReminderMinutes('0'); setError('')
  }

  return <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12">
    <ContentCard className="xl:col-span-8" title="المهام" description={`${tasks.filter((task) => task.status !== 'done').length} مفتوحة · ${tasks.filter((task) => isTaskOverdue(task)).length} متأخرة`}>
      <div className="flex flex-col gap-3">
        <div className="relative"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 pr-10" placeholder="ابحث في المهام..." aria-label="البحث في المهام" /></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-xl bg-muted p-1">{([['all','الكل'],['today','اليوم'],['overdue','متأخرة'],['open','مفتوحة'],['done','مكتملة']] as const).map(([value,label]) => <Button key={value} type="button" size="sm" variant={filter === value ? 'secondary' : 'ghost'} className="shrink-0 rounded-lg" onClick={() => setFilter(value)}>{label}</Button>)}</div>
          <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)} aria-label="ترتيب المهام" className="h-10 rounded-xl"><option value="due">الأقرب استحقاقًا</option><option value="priority">الأولوية</option><option value="created">الأحدث إنشاءً</option><option value="updated">آخر تعديل</option></Select>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2" aria-label="إجراءات المهام الجماعية">
          <Checkbox checked={visibleTasks.length > 0 && visibleTasks.every((task) => selectedIds.includes(task.id))} onChange={(event) => setSelectedIds(event.currentTarget.checked ? visibleTasks.map((task) => task.id) : [])} aria-label="تحديد كل المهام الظاهرة" />
          <span className="text-xs text-muted-foreground">{selectedIds.length ? `${selectedIds.length} محددة` : 'حدد مهام لإجراء جماعي'}</span>
          <Button type="button" size="sm" variant="outline" disabled={!selectedIds.length} onClick={() => { bulkUpdateTasks(selectedIds, { status: 'done' }); setSelectedIds([]) }}>إكمال</Button>
          <Button type="button" size="sm" variant="outline" disabled={!selectedIds.length} onClick={() => { bulkUpdateTasks(selectedIds, { status: 'in-progress' }); setSelectedIds([]) }}>نقل للجارية</Button>
          <Button type="button" size="sm" variant="outline" disabled={!selectedIds.length} onClick={() => { bulkArchiveTasks(selectedIds); setSelectedIds([]) }}><Archive data-icon="inline-start" />أرشفة</Button>
          {canUndoTaskAction && <Button type="button" size="sm" variant="ghost" onClick={undoTaskAction}><CornerUpLeft data-icon="inline-start" />تراجع</Button>}
        </div>
      </div>
      {visibleTasks.length === 0 ? <div className="mt-5"><EmptyState icon={CalendarDays} title="لا توجد مهام هنا" description="أضف مهمة بموعد فعلي أو غيّر البحث والفلاتر." /></div> : <div className="mt-5 flex flex-col gap-5">
        {overdue.length > 0 && <TaskSection title="متأخرة" icon={<AlertTriangle className="h-4 w-4 text-destructive" />} tasks={overdue} allTasks={tasks} selectedIds={selectedIds} onSelect={(id, selected) => setSelectedIds((items) => selected ? [...new Set([...items, id])] : items.filter((item) => item !== id))} {...{toggleTask,updateTask,archiveTask,addSubtask,toggleSubtask,removeSubtask}} />}
        {upcoming.length > 0 && <TaskSection title="القادمة" icon={<CalendarDays className="h-4 w-4 text-primary" />} tasks={upcoming} allTasks={tasks} selectedIds={selectedIds} onSelect={(id, selected) => setSelectedIds((items) => selected ? [...new Set([...items, id])] : items.filter((item) => item !== id))} {...{toggleTask,updateTask,archiveTask,addSubtask,toggleSubtask,removeSubtask}} />}
      </div>}
    </ContentCard>

    <div className="flex flex-col gap-4 xl:col-span-4">
      <ContentCard title="مهمة جديدة" description="موعد حقيقي، وتذكير اختياري، وتكرار واضح.">
        <form onSubmit={createTask} className="flex flex-col gap-3" noValidate>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="اسم المهمة" aria-label="اسم المهمة" />
          <div className="grid grid-cols-2 gap-2"><label className="flex flex-col gap-1 text-xs font-semibold">التاريخ<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="flex flex-col gap-1 text-xs font-semibold">الوقت<Input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div>
          <p className="text-xs text-muted-foreground">المنطقة الزمنية: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
          <div className="grid grid-cols-2 gap-2"><label className="flex flex-col gap-1 text-xs font-semibold">الأولوية<Select value={priority} onChange={(event) => setPriority(event.target.value as Task['priority'])}><option value="high">عالية</option><option value="medium">متوسطة</option><option value="low">منخفضة</option></Select></label><label className="flex flex-col gap-1 text-xs font-semibold">التكرار<Select value={recurrence} onChange={(event) => setRecurrence(event.target.value as TaskRecurrence)}>{recurrenceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label></div>
          <label className="flex flex-col gap-1 text-xs font-semibold">التذكير<Select value={reminderMinutes} onChange={(event) => setReminderMinutes(event.target.value)}><option value="0">بدون تذكير</option><option value="10">قبل 10 دقائق</option><option value="30">قبل 30 دقيقة</option><option value="60">قبل ساعة</option><option value="1440">قبل يوم</option></Select></label>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="gap-2"><Plus className="h-4 w-4" />إضافة المهمة</Button>
        </form>
      </ContentCard>
      <ContentCard title="ملخص المواعيد"><div className="grid grid-cols-2 gap-2"><MiniStat label="اليوم" value={tasks.filter((task) => isTaskDueToday(task)).length} /><MiniStat label="متأخرة" value={tasks.filter((task) => isTaskOverdue(task)).length} /><MiniStat label="متكررة" value={tasks.filter((task) => task.recurrence && task.recurrence !== 'none').length} /><MiniStat label="بتذكير" value={tasks.filter((task) => Boolean(task.reminderMinutes)).length} /></div></ContentCard>
    </div>
  </div>
}

type Actions = Pick<ReturnType<typeof useCommandCenter>, 'toggleTask' | 'updateTask' | 'archiveTask' | 'addSubtask' | 'toggleSubtask' | 'removeSubtask'>
function TaskSection({ title, icon, tasks, allTasks, selectedIds, onSelect, ...actions }: { title: string; icon: React.ReactNode; tasks: Task[]; allTasks: Task[]; selectedIds: string[]; onSelect: (id: string, selected: boolean) => void } & Actions) {
  return <section><div className="mb-2 flex items-center gap-2"><span>{icon}</span><h2 className="text-sm font-bold">{title}</h2><span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tasks.length}</span></div><div className="flex flex-col gap-2">{tasks.map((task) => <TaskRow key={task.id} task={task} allTasks={allTasks} selected={selectedIds.includes(task.id)} onSelect={onSelect} {...actions} />)}</div></section>
}

function TaskRow({ task, allTasks, selected, onSelect, toggleTask, updateTask, archiveTask, addSubtask, toggleSubtask, removeSubtask }: { task: Task; allTasks: Task[]; selected: boolean; onSelect: (id: string, selected: boolean) => void } & Actions) {
  const [expanded, setExpanded] = useState(false)
  const [subtask, setSubtask] = useState('')
  const done = task.subtasks?.filter((item) => item.done).length ?? 0
  const total = task.subtasks?.length ?? 0
  const blockingTasks = getBlockingTasks(task, allTasks)
  const blocked = isTaskBlocked(task, allTasks)
  return <article id={`task-${task.id}`} className={`min-w-0 rounded-2xl border p-3 ${isTaskOverdue(task) ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/40'}`}>
    <div className="flex min-w-0 items-start gap-3"><Checkbox checked={selected} onChange={(event) => onSelect(task.id, event.currentTarget.checked)} aria-label={`تحديد ${task.title}`} /><Button type="button" size="icon-sm" variant={task.status === 'done' ? 'default' : 'outline'} className="shrink-0 rounded-full" disabled={blocked} onClick={() => toggleTask(task.id)} aria-label={blocked ? 'المهمة محظورة بتبعيات غير مكتملة' : task.status === 'done' ? 'إعادة فتح المهمة' : 'إكمال المهمة'}>{task.status === 'done' && <Check className="h-4 w-4" />}</Button><div className="min-w-0 flex-1"><p className={`text-sm font-semibold ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p><div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{formatTaskDue(task)}</span>{task.recurrence && task.recurrence !== 'none' && <span className="inline-flex items-center gap-1 text-primary"><Repeat2 className="h-3 w-3" />{recurrenceLabel(task.recurrence)}</span>}{blocked && <span className="inline-flex items-center gap-1 text-warning-foreground"><Link2 className="h-3 w-3" />محظورة بواسطة {blockingTasks.map((item) => 'title' in item ? (item as Task).title : item.id).join('، ')}</span>}{total > 0 && <span>{done}/{total} خطوات</span>}</div>{total > 0 && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.round(done / total * 100)}%` }} /></div>}</div><Button type="button" size="icon-sm" variant="ghost" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-label="تفاصيل المهمة"><ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} /></Button></div>
    {expanded && <div className="mt-3 border-t border-border pt-3"><div className="flex flex-col gap-2"><label className="flex flex-col gap-1 text-xs font-semibold">تعتمد على<Select multiple value={task.dependencyIds ?? []} onChange={(event) => updateTask(task.id, { dependencyIds: Array.from(event.currentTarget.selectedOptions, (option) => option.value) })} aria-label="تبعيات المهمة" className="min-h-24">{allTasks.filter((item) => item.id !== task.id).map((item) => <option key={item.id} value={item.id}>{item.status === 'done' ? 'مكتملة · ' : ''}{item.title}</option>)}</Select></label><p className="text-xs text-muted-foreground">يمكن إكمال المهمة بعد إنهاء كل المهام المحددة.</p></div><div className="mt-3 flex flex-wrap gap-2"><Select value={task.status} onChange={(event) => updateTask(task.id, { status: event.target.value as Task['status'] })} aria-label="حالة المهمة"><option value="todo">لم تبدأ</option><option value="in-progress">جارية</option><option value="done">مكتملة</option></Select><Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => archiveTask(task.id)}><Archive className="h-3.5 w-3.5" />أرشفة</Button></div><form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!subtask.trim()) return; addSubtask(task.id, subtask.trim()); setSubtask('') }}><Input value={subtask} onChange={(event) => setSubtask(event.target.value)} placeholder="خطوة فرعية" aria-label="خطوة فرعية" /><Button type="submit" size="sm">إضافة</Button></form><div className="mt-2 flex flex-col gap-1">{task.subtasks?.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-xl bg-background px-2 py-1.5"><button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-right text-xs" onClick={() => toggleSubtask(task.id, item.id)}><span className={`h-3 w-3 shrink-0 rounded-full border ${item.done ? 'border-primary bg-primary' : 'border-border'}`} /><span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.title}</span></button><Button type="button" size="icon-xs" variant="ghost" onClick={() => removeSubtask(task.id, item.id)} aria-label="حذف الخطوة"><Trash2 className="h-3 w-3" /></Button></div>)}</div></div>}
  </article>
}

function MiniStat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div> }
