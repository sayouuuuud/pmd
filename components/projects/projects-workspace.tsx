'use client'

import { Archive, ChevronLeft, FolderKanban, Plus } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { useCommandCenter, type Project, type ProjectStatus } from '@/lib/command-center-store'

const columns: { id: ProjectStatus; label: string; tone: string }[] = [
  { id: 'backlog', label: 'قادم', tone: 'bg-muted' },
  { id: 'in-progress', label: 'جاري', tone: 'bg-accent' },
  { id: 'done', label: 'مكتمل', tone: 'bg-primary/10' },
]

export function ProjectsWorkspace() {
  const { projects, goals, tasks, addProject, updateProject, archiveProject } = useCommandCenter()

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

  const linkedTasks = (projectId: string) => tasks.filter((task) => task.projectId === projectId)

  return <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ContentCard className="lg:col-span-9" title="لوحة المشاريع" description="انقل المشروع بين المراحل، وخلي كل هدف له مسار تنفيذ واضح.">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {columns.map((column) => {
            const columnProjects = projects.filter((project) => project.status === column.id)
            return <section key={column.id} className="min-h-60 rounded-2xl bg-muted/60 p-3">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{column.label}</h2><span className="rounded-full bg-card px-2 py-1 text-xs text-muted-foreground">{columnProjects.length}</span></div>
              <div className="space-y-3">
                {columnProjects.map((project) => <ProjectCard key={project.id} project={project} goalTitle={goals.find((goal) => goal.id === project.goalId)?.title} taskCount={linkedTasks(project.id).length} onMove={(status) => updateProject(project.id, { status, progress: status === 'done' ? 100 : project.progress })} onArchive={() => archiveProject(project.id)} />)}
                {columnProjects.length === 0 && <div className="rounded-2xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">مفيش مشاريع هنا</div>}
              </div>
            </section>
          })}
        </div>
      </ContentCard>

      <ContentCard title="مشروع جديد" description="اربطه بهدف لو عايز تشوف أثره على الصورة الكبيرة.">
        <form onSubmit={createProject} className="space-y-3">
          <input name="title" className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="مثال: تجهيز الإطلاق التجريبي" />
          <textarea name="description" className="min-h-20 w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="ما النتيجة التي سيخرج بها المشروع؟" />
          <select name="goalId" defaultValue="" className="w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="">بدون هدف مرتبط</option>{goals.filter((goal) => goal.status !== 'completed').map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select>
          <input name="dueLabel" className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="الموعد: هذا الشهر" />
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> إضافة المشروع</button>
        </form>
      </ContentCard>
    </div>

    <ContentCard title="خريطة سريعة" description="المشروع الجيد يحول الهدف إلى خطوات يمكن رؤيتها وتحريكها.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><MiniStat label="كل المشاريع" value={projects.length} /><MiniStat label="قيد التنفيذ" value={projects.filter((project) => project.status === 'in-progress').length} /><MiniStat label="مهام مرتبطة" value={tasks.filter((task) => task.projectId).length} /></div>
    </ContentCard>
  </div>
}

function ProjectCard({ project, goalTitle, taskCount, onMove, onArchive }: { project: Project; goalTitle?: string; taskCount: number; onMove: (status: ProjectStatus) => void; onArchive: () => void }) {
  const nextStatus: ProjectStatus = project.status === 'backlog' ? 'in-progress' : project.status === 'in-progress' ? 'done' : 'backlog'
  const nextLabel = nextStatus === 'in-progress' ? 'بدء التنفيذ' : nextStatus === 'done' ? 'إنهاء المشروع' : 'إعادته للقائمة'
  return <article className="rounded-2xl border border-border bg-card p-3 shadow-sm">
    <div className="flex items-start gap-2"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><FolderKanban className="h-4 w-4" /></div><div className="min-w-0 flex-1"><h3 className="font-semibold">{project.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{project.description || 'بدون وصف إضافي'}</p></div><button type="button" onClick={onArchive} aria-label="أرشفة المشروع" className="rounded-full p-1.5 text-muted-foreground hover:bg-warning"><Archive className="h-4 w-4" /></button></div>
    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground"><span className="rounded-full bg-muted px-2 py-1">{goalTitle ?? 'بدون هدف'}</span><span className="rounded-full bg-muted px-2 py-1">{taskCount} مهام</span><span className="rounded-full bg-muted px-2 py-1">{project.dueLabel}</span></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${project.progress}%` }} /></div>
    <div className="mt-2 flex items-center justify-between text-xs"><span className="font-semibold">{project.progress}%</span><button type="button" onClick={() => onMove(nextStatus)} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground">{nextLabel}<ChevronLeft className="h-3.5 w-3.5" /></button></div>
  </article>
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-2xl bg-muted px-3 py-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>
}
