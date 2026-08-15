'use client'

import { useMemo, useState } from 'react'
import { Archive, Check, Filter, Plus, RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { useCommandCenter, type Task } from '@/lib/command-center-store'

const filters = [
  { id: 'all', label: 'الكل' },
  { id: 'today', label: 'النهاردة' },
  { id: 'open', label: 'مفتوحة' },
  { id: 'done', label: 'مكتملة' },
]

export function TasksWorkspace() {
  const { tasks, toggleTask, addTask, archiveTask } = useCommandCenter()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [newTitle, setNewTitle] = useState('')

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesQuery = task.title.includes(query.trim()) || task.category.includes(query.trim())
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
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full rounded-2xl border border-input bg-background pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="ابحث في المهام..." /></div><div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-muted p-1">{filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs ${filter === item.id ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}>{item.label}</button>)}</div></div>
      <div className="mt-5 space-y-2">{visibleTasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} onArchive={() => archiveTask(task.id)} />)}{visibleTasks.length === 0 && <div className="rounded-2xl bg-muted px-4 py-12 text-center text-sm text-muted-foreground">مفيش مهام مطابقة للبحث الحالي.</div>}</div>
    </ContentCard>

    <div className="space-y-4 lg:col-span-4">
      <ContentCard title="مهمة جديدة" description="أصغر خطوة واضحة أفضل من قائمة طويلة."><form onSubmit={createTask}><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="اكتب اسم المهمة..." /><div className="mt-3 flex gap-2">{(['high', 'medium', 'low'] as Task['priority'][]).map((item) => <button key={item} type="button" onClick={() => setPriority(item)} className={`flex-1 rounded-xl border px-2 py-2 text-xs ${priority === item ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground'}`}>{item === 'high' ? 'عالية' : item === 'medium' ? 'متوسطة' : 'منخفضة'}</button>)}</div><button type="submit" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> إضافة المهمة</button></form></ContentCard>
      <ContentCard title="فلتر سريع" description="نظرة على توزيع الشغل"><div className="space-y-3"><MiniStat label="مفتوحة" value={tasks.filter((task) => task.status !== 'done').length} /><MiniStat label="عالية الأولوية" value={tasks.filter((task) => task.priority === 'high' && task.status !== 'done').length} /><MiniStat label="مكتملة" value={tasks.filter((task) => task.status === 'done').length} /></div></ContentCard>
    </div>
  </div>
}

function TaskRow({ task, onToggle, onArchive }: { task: Task; onToggle: () => void; onArchive: () => void }) {
  const priorityLabel = task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'
  return <div className="group flex items-center gap-3 rounded-2xl border border-transparent bg-muted/60 px-3 py-3 transition-colors hover:border-border hover:bg-card"><button type="button" onClick={onToggle} aria-label={task.status === 'done' ? 'إعادة فتح المهمة' : 'إكمال المهمة'} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${task.status === 'done' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>{task.status === 'done' && <Check className="h-3.5 w-3.5" />}</button><div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${task.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>{task.title}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground"><span>{task.dueLabel}</span><span>•</span><span>{task.category}</span>{task.recurring && <><span>•</span><span className="text-primary">متكررة</span></>}</div></div><span className={`hidden rounded-full px-2 py-1 text-[10px] font-semibold sm:inline-flex ${task.priority === 'high' ? 'bg-warning text-warning-foreground' : task.priority === 'medium' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{priorityLabel}</span><button type="button" onClick={onArchive} aria-label="أرشفة المهمة" className="rounded-full p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-warning group-hover:opacity-100"><Archive className="h-4 w-4" /></button></div>
}

function MiniStat({ label, value }: { label: string; value: number }) { return <div className="flex items-center justify-between rounded-2xl bg-muted px-3 py-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div> }

void Filter
void RotateCcw
