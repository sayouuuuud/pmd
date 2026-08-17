'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Archive, CheckCircle2, ChevronLeft, Circle, ExternalLink, FolderKanban, GripVertical, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { useCommandCenter, type Project, type ProjectStatus } from '@/lib/command-center-store'

const columns: { id: ProjectStatus; label: string; tone: string }[] = [
  { id: 'backlog', label: 'أفكار', tone: 'bg-muted' },
  { id: 'in-progress', label: 'جاري', tone: 'bg-accent' },
  { id: 'paused', label: 'متوقف', tone: 'bg-warning/10' },
  { id: 'done', label: 'مكتمل', tone: 'bg-primary/10' },
]

export function ProjectsWorkspace() {
  const searchParams = useSearchParams()
  const { projects, goals, tasks, notes, addProject, addTask, updateProject, toggleTask, archiveProject } = useCommandCenter()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null

  useEffect(() => {
    const requestedProjectId = searchParams.get('project')
    if (requestedProjectId && projects.some((project) => project.id === requestedProjectId)) {
      setSelectedProjectId(requestedProjectId)
    }
  }, [projects, searchParams])

  const linkedTasks = (projectId: string) => tasks.filter((task) => task.projectId === projectId)
  const linkedNotes = (projectId: string) => {
    const taskIds = new Set(linkedTasks(projectId).map((task) => task.id))
    return notes.filter((note) => note.sourceTaskId && taskIds.has(note.sourceTaskId))
  }

  function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    if (!title) return
    addProject({
      title,
      description: String(form.get('description') ?? '').trim(),
      goalId: String(form.get('goalId') ?? '') || undefined,
      dueLabel: String(form.get('dueLabel') ?? '').trim() || 'بدون موعد',
    })
    event.currentTarget.reset()
  }

  function moveProject(id: string, status: ProjectStatus) {
    const project = projects.find((item) => item.id === id)
    if (!project) return
    updateProject(id, { status, progress: status === 'done' ? 100 : project.progress })
    setSelectedProjectId(id)
  }

  function createProjectTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedProject || !newTaskTitle.trim()) return
    addTask({ title: newTaskTitle.trim(), priority: 'medium', dueLabel: 'النهاردة', category: 'مشروع', projectId: selectedProject.id })
    setNewTaskTitle('')
  }

  return <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ContentCard className="lg:col-span-9" title="لوحة المشاريع" description="انقل المشروع بين المراحل، وافتح تفاصيله عشان تفضل الخطوات مرتبطة بالهدف.">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {columns.map((column) => {
            const columnProjects = projects.filter((project) => project.status === column.id)
            return <section
              key={column.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedProjectId) moveProject(draggedProjectId, column.id)
                setDraggedProjectId(null)
              }}
              className={`min-h-60 rounded-2xl ${column.tone}/60 p-3 transition-colors ${draggedProjectId ? 'ring-1 ring-primary/20' : ''}`}
            >
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{column.label}</h2><span className="rounded-full bg-card px-2 py-1 text-xs text-muted-foreground">{columnProjects.length}</span></div>
              <div className="space-y-3">
                {columnProjects.map((project) => <ProjectCard
                  key={project.id}
                  project={project}
                  goalTitle={goals.find((goal) => goal.id === project.goalId)?.title}
                  taskCount={linkedTasks(project.id).length}
                  selected={selectedProjectId === project.id}
                  onOpen={() => setSelectedProjectId(project.id)}
                  onDragStart={() => setDraggedProjectId(project.id)}
                  onMove={(status) => moveProject(project.id, status)}
                  onArchive={() => archiveProject(project.id)}
                />)}
                {columnProjects.length === 0 && <EmptyState icon={FolderKanban} title="لا توجد مشاريع هنا" description="اسحب مشروعًا إلى هذه المرحلة، أو أضف مشروعًا جديدًا من النموذج المجاور." />}
              </div>
            </section>
          })}
        </div>
      </ContentCard>

      <ContentCard title="مشروع جديد" description="اربطه بهدف لو عايز تشوف أثره على الصورة الكبيرة.">
        <form onSubmit={createProject} className="space-y-3">
          <Input name="title" aria-label="اسم المشروع" className="w-full rounded-2xl px-4 py-3" placeholder="مثال: تجهيز الإطلاق التجريبي" />
          <Textarea name="description" aria-label="وصف المشروع" className="min-h-20 w-full resize-none rounded-2xl px-4 py-3" placeholder="ما النتيجة التي سيخرج بها المشروع؟" />
          <Select name="goalId" aria-label="الهدف المرتبط" defaultValue="" className="w-full rounded-2xl px-3 py-3"><option value="">بدون هدف مرتبط</option>{goals.filter((goal) => goal.status !== 'completed').map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</Select>
          <Input name="dueLabel" aria-label="موعد المشروع" className="w-full rounded-2xl px-4 py-3" placeholder="الموعد: هذا الشهر" />
          <Button type="submit" className="flex w-full rounded-2xl px-4 py-3"><Plus className="h-4 w-4" /> إضافة المشروع</Button>
        </form>
      </ContentCard>
    </div>

    {selectedProject && <ProjectDetails
      project={selectedProject}
      goalTitle={goals.find((goal) => goal.id === selectedProject.goalId)?.title}
      linkedTasks={linkedTasks(selectedProject.id)}
      linkedNotes={linkedNotes(selectedProject.id)}
      newTaskTitle={newTaskTitle}
      onNewTaskTitleChange={setNewTaskTitle}
      onCreateTask={createProjectTask}
      onToggleTask={toggleTask}
      onUpdateProgress={(progress) => updateProject(selectedProject.id, { progress, status: progress === 100 ? 'done' : selectedProject.status === 'done' ? 'in-progress' : selectedProject.status })}
      onClose={() => setSelectedProjectId(null)}
    />}

    <ContentCard title="خريطة سريعة" description="المشروع الجيد يحول الهدف إلى خطوات يمكن رؤيتها وتحريكها.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><MiniStat label="كل المشاريع" value={projects.length} /><MiniStat label="قيد التنفيذ" value={projects.filter((project) => project.status === 'in-progress').length} /><MiniStat label="مهام مرتبطة" value={tasks.filter((task) => task.projectId).length} /></div>
    </ContentCard>
  </div>
}

function ProjectCard({ project, goalTitle, taskCount, selected, onOpen, onDragStart, onMove, onArchive }: { project: Project; goalTitle?: string; taskCount: number; selected: boolean; onOpen: () => void; onDragStart: () => void; onMove: (status: ProjectStatus) => void; onArchive: () => void }) {
  const nextStatus: ProjectStatus = project.status === 'backlog' ? 'in-progress' : project.status === 'in-progress' ? 'paused' : project.status === 'paused' ? 'done' : 'backlog'
  const nextLabel = nextStatus === 'in-progress' ? 'بدء التنفيذ' : nextStatus === 'paused' ? 'إيقاف مؤقت' : nextStatus === 'done' ? 'إنهاء المشروع' : 'إعادته للقائمة'
  return <article id={project.id} draggable onDragStart={onDragStart} className={`rounded-2xl border bg-card p-3 shadow-sm transition-colors ${selected ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}>
    <div className="flex items-start gap-2"><Button type="button" variant="ghost" onClick={onOpen} className="h-auto min-w-0 flex-1 items-start justify-start gap-2 rounded-none p-0 text-right hover:bg-transparent"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><FolderKanban className="h-4 w-4" /></div><div className="min-w-0 flex-1"><h3 className="font-semibold">{project.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{project.description || 'بدون وصف إضافي'}</p></div></Button><Button type="button" variant="ghost" size="icon-sm" onClick={onDragStart} aria-label="سحب المشروع" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"><GripVertical className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={onArchive} aria-label="أرشفة المشروع" className="rounded-full p-1.5 text-muted-foreground hover:bg-warning"><Archive className="h-4 w-4" /></Button></div>
    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground"><span className="rounded-full bg-muted px-2 py-1">{goalTitle ?? 'بدون هدف'}</span><span className="rounded-full bg-muted px-2 py-1">{taskCount} مهام</span><span className="rounded-full bg-muted px-2 py-1">{project.dueLabel}</span></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }} /></div>
    <div className="mt-2 flex items-center justify-between text-xs"><span className="font-semibold">{project.progress}%</span><Button type="button" variant="ghost" size="sm" onClick={() => onMove(nextStatus)} className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">{nextLabel}<ChevronLeft className="h-3.5 w-3.5" /></Button></div>
  </article>
}

function ProjectDetails({ project, goalTitle, linkedTasks, linkedNotes, newTaskTitle, onNewTaskTitleChange, onCreateTask, onToggleTask, onUpdateProgress, onClose }: { project: Project; goalTitle?: string; linkedTasks: ReturnType<typeof useCommandCenter>['tasks']; linkedNotes: ReturnType<typeof useCommandCenter>['notes']; newTaskTitle: string; onNewTaskTitleChange: (value: string) => void; onCreateTask: (event: React.FormEvent<HTMLFormElement>) => void; onToggleTask: (id: string) => void; onUpdateProgress: (progress: number) => void; onClose: () => void }) {
  const completed = linkedTasks.filter((task) => task.status === 'done').length
  const derivedProgress = linkedTasks.length ? Math.round((completed / linkedTasks.length) * 100) : project.progress
  const statusLabel = project.status === 'done' ? 'مكتمل' : project.status === 'in-progress' ? 'جاري' : 'قادم'
  const progress = Math.max(0, Math.min(100, derivedProgress))
  const taskIds = useMemo(() => new Set(linkedTasks.map((task) => task.id)), [linkedTasks])
  const projectNotes = linkedNotes.filter((note) => note.sourceTaskId && taskIds.has(note.sourceTaskId))

  return <ContentCard title="تفاصيل المشروع" description="كل ما يرتبط بالمشروع في مساحة واحدة." action={<Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted">إغلاق</Button>}>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-7">
        <div className="rounded-2xl bg-muted/70 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{statusLabel} · {project.dueLabel}</p><h2 className="mt-1 text-lg font-semibold">{project.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description || 'أضف وصفًا يوضح النتيجة النهائية للمشروع.'}</p></div><div className="rounded-2xl bg-card px-3 py-2 text-center"><p className="text-2xl font-semibold text-primary">{progress}%</p><p className="text-[11px] text-muted-foreground">منجز من المهام</p></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-card"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div><label className="mt-4 block text-xs text-muted-foreground">تعديل نسبة المشروع يدويًا<Input type="range" min="0" max="100" value={project.progress} onChange={(event) => onUpdateProgress(Number(event.target.value))} className="mt-2 w-full accent-primary" /></label><div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground"><span>{goalTitle ? `مرتبط بهدف: ${goalTitle}` : 'غير مرتبط بهدف'}</span><span>{completed}/{linkedTasks.length} مهام مكتملة</span></div></div>
        <div><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">مهام المشروع</h3><span className="text-xs text-muted-foreground">{linkedTasks.length} مهام</span></div><div className="space-y-2">{linkedTasks.map((task) => <div key={task.id} className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2.5"><Button type="button" variant="ghost" size="icon-sm" onClick={() => onToggleTask(task.id)} aria-label={task.status === 'done' ? 'إعادة فتح المهمة' : 'إكمال المهمة'} className="shrink-0 p-0 text-primary">{task.status === 'done' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 text-muted-foreground" />}</Button><span className={`min-w-0 flex-1 text-sm ${task.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>{task.title}</span><span className="text-[11px] text-muted-foreground">{task.dueLabel}</span></div>)}{linkedTasks.length === 0 && <EmptyState icon={CheckCircle2} title="لا توجد مهام مرتبطة" description="أضف أول خطوة للمشروع من الحقل أسفل هذه القائمة." />}</div><form onSubmit={onCreateTask} className="mt-3 flex gap-2"><Input value={newTaskTitle} onChange={(event) => onNewTaskTitleChange(event.target.value)} aria-label="إضافة مهمة للمشروع" className="min-w-0 flex-1 rounded-2xl px-3 py-2.5 text-xs" placeholder="أضف خطوة للمشروع..." /><Button type="submit" size="sm" className="shrink-0 rounded-2xl px-3 py-2.5 text-xs"><Plus className="h-3.5 w-3.5" /> إضافة</Button></form></div>
      </div>
      <div className="space-y-4 lg:col-span-5"><div className="rounded-2xl border border-border/70 bg-card p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">ملاحظات مرتبطة</h3><ExternalLink className="h-4 w-4 text-muted-foreground" /></div><div className="mt-3 space-y-2">{projectNotes.map((note) => <div key={note.id} className="rounded-xl bg-muted/70 p-3"><p className="text-xs font-semibold">{note.title}</p><p className="mt-1 line-clamp-3 text-[11px] leading-5 text-muted-foreground">{note.body}</p></div>)}{projectNotes.length === 0 && <p className="text-xs leading-5 text-muted-foreground">الملاحظات التي تحولت من مهام المشروع ستظهر هنا.</p>}</div></div><div className="rounded-2xl bg-accent/60 p-4"><p className="text-xs font-semibold text-accent-foreground">الخطوة التالية</p><p className="mt-2 text-sm leading-6 text-accent-foreground/80">اختار أصغر مهمة مفتوحة وابدأ بها، وبعدها حدّث نسبة المشروع بدل انتظار نهاية كل شيء.</p></div></div>
    </div>
  </ContentCard>
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-2xl bg-muted px-3 py-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>
}
