'use client'

import { useEffect, useMemo, useState } from 'react'
import { Archive, CheckCircle2, ChevronLeft, Circle, ExternalLink, FolderKanban, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { useCommandCenter, type Project, type ProjectMilestone, type ProjectPricing, type ProjectStatus, type ProjectUpdate } from '@/lib/command-center-store'
import { calculateProjectProgress, withDerivedProjectProgress } from '@/lib/project-progress'

type ProjectClient = { id: string; name: string; company: string | null }
type WorkspaceClientsFallback = { workspaces?: { id: string }[]; clientsByWorkspace?: Record<string, ProjectClient[]> }

const columns: { id: ProjectStatus; label: string; tone: string }[] = [
  { id: 'backlog', label: 'أفكار', tone: 'bg-muted' },
  { id: 'in-progress', label: 'جاري', tone: 'bg-accent' },
  { id: 'paused', label: 'متوقف', tone: 'bg-warning/10' },
  { id: 'done', label: 'مكتمل', tone: 'bg-primary/10' },
]

export function ProjectsWorkspace() {
  const { projects, goals, tasks, notes, projectUpdates, projectPricings, addProject, addTask, updateProject, toggleTask, archiveProject, addProjectUpdate, removeProjectUpdate, addProjectPricing, updateProjectPricing, addFinanceEntryFromPricing, collectProjectPricing } = useCommandCenter()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null)
  const [clients, setClients] = useState<ProjectClient[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [projectError, setProjectError] = useState('')
  const [projectTaskError, setProjectTaskError] = useState('')
  const displayedProjects = useMemo(() => withDerivedProjectProgress(projects, tasks), [projects, tasks])

  const selectedProject = displayedProjects.find((project) => project.id === selectedProjectId) ?? null

  useEffect(() => {
    let active = true
    async function loadClients() {
      try {
        const workspacesResponse = await fetch('/api/workspaces', { cache: 'no-store' })
        if (!workspacesResponse.ok) throw new Error('workspaces-unavailable')
        const workspacePayload = await workspacesResponse.json() as { workspaces?: { id: string }[]; activeWorkspaceId?: string }
        const workspaceId = workspacePayload.activeWorkspaceId ?? workspacePayload.workspaces?.[0]?.id
        if (!workspaceId) throw new Error('workspace-missing')
        const clientsResponse = await fetch(`/api/clients?workspaceId=${encodeURIComponent(workspaceId)}`, { cache: 'no-store' })
        if (!clientsResponse.ok) throw new Error('clients-unavailable')
        const payload = await clientsResponse.json() as { clients?: ProjectClient[] }
        if (active) setClients(payload.clients ?? [])
      } catch {
        try {
          const parsed = JSON.parse(window.localStorage.getItem('personal-command-center-workspace-v1') ?? '') as WorkspaceClientsFallback
          const workspaceId = parsed.workspaces?.[0]?.id ?? 'local-personal'
          if (active) setClients(parsed.clientsByWorkspace?.[workspaceId] ?? [])
        } catch {
          if (active) setClients([])
        }
      }
    }
    void loadClients()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const requestedProjectId = new URLSearchParams(window.location.search).get('project')
    if (requestedProjectId && projects.some((project) => project.id === requestedProjectId)) {
      setSelectedProjectId(requestedProjectId)
    }
  }, [projects])

  const linkedTasks = (projectId: string) => tasks.filter((task) => task.projectId === projectId)
  const linkedNotes = (projectId: string) => {
    const taskIds = new Set(linkedTasks(projectId).map((task) => task.id))
    return notes.filter((note) => note.projectId === projectId || (note.sourceTaskId && taskIds.has(note.sourceTaskId)))
  }

  function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    if (!title) {
      setProjectError('اكتب اسم المشروع أولًا')
      return
    }
    setProjectError('')
    addProject({
      title,
      description: String(form.get('description') ?? '').trim(),
      goalId: String(form.get('goalId') ?? '') || undefined,
      clientId: String(form.get('clientId') ?? '') || undefined,
      nextStep: String(form.get('nextStep') ?? '').trim() || undefined,
      dueLabel: String(form.get('dueAt') ?? '').trim() || 'بدون موعد',
      dueAt: String(form.get('dueAt') ?? '').trim() ? new Date(`${String(form.get('dueAt'))}T12:00:00`).toISOString() : undefined,
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
    if (!selectedProject) return
    const title = newTaskTitle.trim()
    if (!title) {
      setProjectTaskError('اكتب اسم المهمة أولًا.')
      return
    }
    setProjectTaskError('')
    addTask({ title, priority: 'medium', dueLabel: 'النهاردة', category: 'مشروع', projectId: selectedProject.id })
    setNewTaskTitle('')
  }

  return <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <ContentCard className="xl:col-span-8" title="لوحة المشاريع" description="انقل المشروع بين المراحل، وافتح تفاصيله عشان تفضل الخطوات مرتبطة بالهدف.">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {columns.map((column) => {
            const columnProjects = displayedProjects.filter((project) => project.status === column.id)
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
                  clientName={clients.find((client) => client.id === project.clientId)?.name}
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

      <ContentCard className="xl:col-span-4" title="مشروع جديد" description="اربطه بهدف لو عايز تشوف أثره على الصورة الكبيرة.">
        <form onSubmit={createProject} noValidate className="space-y-3">
          <Input name="title" required aria-label="اسم المشروع" aria-invalid={Boolean(projectError)} aria-describedby={projectError ? 'project-title-error' : undefined} onChange={() => projectError && setProjectError('')} className="w-full rounded-2xl px-4 py-3" placeholder="مثال: تجهيز الإطلاق التجريبي" />
          {projectError && <p id="project-title-error" role="alert" aria-live="assertive" aria-atomic="true" className="text-xs font-medium text-destructive">{projectError}</p>}
          <Textarea name="description" aria-label="وصف المشروع" className="min-h-20 w-full resize-none rounded-2xl px-4 py-3" placeholder="ما النتيجة التي سيخرج بها المشروع؟" />
          <Select name="goalId" aria-label="الهدف المرتبط" defaultValue="" className="w-full rounded-2xl px-3 py-3"><option value="">بدون هدف مرتبط</option>{goals.filter((goal) => goal.status !== 'completed').map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</Select>
          <Select name="clientId" aria-label="العميل المرتبط" defaultValue="" className="w-full rounded-2xl px-3 py-3"><option value="">بدون عميل مرتبط</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ''}</option>)}</Select>
          <Input name="nextStep" aria-label="الخطوة التالية للمشروع" className="w-full rounded-2xl px-4 py-3" placeholder="الخطوة التالية: تجهيز النسخة الأولى" />
          <Input name="dueAt" type="date" aria-label="موعد تسليم المشروع" className="w-full rounded-2xl px-4 py-3" />
          <Button type="submit" className="flex w-full rounded-2xl px-4 py-3"><Plus className="h-4 w-4" /> إضافة المشروع</Button>
        </form>
      </ContentCard>
    </div>

    {selectedProject && <ProjectDetails
      project={selectedProject}
      goalTitle={goals.find((goal) => goal.id === selectedProject.goalId)?.title}
      linkedTasks={linkedTasks(selectedProject.id)}
      linkedNotes={linkedNotes(selectedProject.id)}
      projectUpdates={projectUpdates.filter((item) => item.projectId === selectedProject.id)}
      projectPricings={projectPricings.filter((item) => item.projectId === selectedProject.id)}
      clients={clients}
      onUpdateProject={(patch) => updateProject(selectedProject.id, patch)}
      onAddProjectUpdate={addProjectUpdate}
      onRemoveProjectUpdate={removeProjectUpdate}
      onAddProjectPricing={addProjectPricing}
      onUpdateProjectPricing={updateProjectPricing}
      onAddFinanceEntryFromPricing={addFinanceEntryFromPricing}
      onCollectProjectPricing={collectProjectPricing}
      newTaskTitle={newTaskTitle}
      projectTaskError={projectTaskError}
      onNewTaskTitleChange={(value) => { setNewTaskTitle(value); if (projectTaskError) setProjectTaskError('') }}
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

function ProjectCard({ project, goalTitle, clientName, taskCount, selected, onOpen, onDragStart, onMove, onArchive }: { project: Project; goalTitle?: string; clientName?: string; taskCount: number; selected: boolean; onOpen: () => void; onDragStart: () => void; onMove: (status: ProjectStatus) => void; onArchive: () => void }) {
  const nextStatus: ProjectStatus = project.status === 'backlog' ? 'in-progress' : project.status === 'in-progress' ? 'paused' : project.status === 'paused' ? 'done' : 'backlog'
  const nextLabel = nextStatus === 'in-progress' ? 'بدء التنفيذ' : nextStatus === 'paused' ? 'إيقاف مؤقت' : nextStatus === 'done' ? 'إنهاء المشروع' : 'إعادته للقائمة'
  return <article id={project.id} draggable onDragStart={onDragStart} className={`rounded-2xl border bg-card p-3 shadow-sm transition-colors ${selected ? 'border-primary ring-2 ring-primary/10' : 'border-border'}`}>
    <div className="flex items-start gap-2"><Button type="button" variant="ghost" onClick={onOpen} className="h-auto min-w-0 flex-1 items-start justify-start gap-2 rounded-none p-0 text-right hover:bg-transparent"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><FolderKanban className="h-4 w-4" /></div><div className="min-w-0 flex-1"><h3 className="font-semibold">{project.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{project.description || 'بدون وصف إضافي'}</p></div></Button><Button type="button" variant="ghost" size="icon-sm" onClick={onDragStart} aria-label="سحب المشروع" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"><GripVertical className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={onArchive} aria-label="أرشفة المشروع" className="rounded-full p-1.5 text-muted-foreground hover:bg-warning"><Archive className="h-4 w-4" /></Button></div>
    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground"><span className="rounded-full bg-muted px-2 py-1">{goalTitle ?? 'بدون هدف'}</span><span className="rounded-full bg-muted px-2 py-1">{clientName ?? 'بدون عميل'}</span><span className="rounded-full bg-muted px-2 py-1">{taskCount} مهام</span><span className="rounded-full bg-muted px-2 py-1">{project.dueLabel}</span></div>
    {(project.nextStep || (project.milestones ?? []).length > 0) && <div className="mt-2 space-y-1 text-[11px] text-muted-foreground"><p className="line-clamp-1">{project.nextStep ? `التالي: ${project.nextStep}` : 'لا توجد خطوة تالية محددة'}</p>{(project.milestones ?? []).length > 0 && <p>{(project.milestones ?? []).filter((milestone) => milestone.status === 'done').length}/{(project.milestones ?? []).length} مراحل مكتملة</p>}</div>}
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }} /></div>
    <div className="mt-2 flex items-center justify-between text-xs"><span className="font-semibold">{project.progress}%</span><Button type="button" variant="ghost" size="sm" onClick={() => onMove(nextStatus)} className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">{nextLabel}<ChevronLeft className="h-3.5 w-3.5" /></Button></div>
  </article>
}

function ProjectDetails({ project, goalTitle, linkedTasks, linkedNotes, projectUpdates, projectPricings, clients, onUpdateProject, onAddProjectUpdate, onRemoveProjectUpdate, onAddProjectPricing, onUpdateProjectPricing, onAddFinanceEntryFromPricing, onCollectProjectPricing, newTaskTitle, projectTaskError, onNewTaskTitleChange, onCreateTask, onToggleTask, onUpdateProgress, onClose }: { project: Project; goalTitle?: string; linkedTasks: ReturnType<typeof useCommandCenter>['tasks']; linkedNotes: ReturnType<typeof useCommandCenter>['notes']; projectUpdates: ProjectUpdate[]; projectPricings: ProjectPricing[]; clients: ProjectClient[]; onUpdateProject: (patch: Partial<Project>) => void; onAddProjectUpdate: (input: Pick<ProjectUpdate, 'projectId' | 'body' | 'kind'>) => void; onRemoveProjectUpdate: (id: string) => void; onAddProjectPricing: (input: Pick<ProjectPricing, 'projectId' | 'title' | 'amount' | 'currency'> & Partial<Pick<ProjectPricing, 'clientId' | 'status' | 'expectedDate' | 'receivedAt' | 'notes'>>) => void; onUpdateProjectPricing: (id: string, patch: Partial<Pick<ProjectPricing, 'title' | 'amount' | 'currency' | 'status' | 'expectedDate' | 'receivedAt' | 'financeEntryId' | 'notes'>> & { clientId?: string | null }) => void; onAddFinanceEntryFromPricing: (pricingId: string) => void; onCollectProjectPricing: (pricingId: string) => void; newTaskTitle: string; projectTaskError: string; onNewTaskTitleChange: (value: string) => void; onCreateTask: (event: React.FormEvent<HTMLFormElement>) => void; onToggleTask: (id: string) => void; onUpdateProgress: (progress: number) => void; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'updates' | 'pricing'>('overview')
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [pricingError, setPricingError] = useState<string | null>(null)
  const [editingPricingError, setEditingPricingError] = useState<string | null>(null)
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null)
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const completed = linkedTasks.filter((task) => task.status === 'done').length
  const statusLabel = project.status === 'done' ? 'مكتمل' : project.status === 'in-progress' ? 'جاري' : 'قادم'
  const progress = calculateProjectProgress(project, linkedTasks)
  const taskIds = useMemo(() => new Set(linkedTasks.map((task) => task.id)), [linkedTasks])
  const projectNotes = linkedNotes.filter((note) => note.sourceTaskId && taskIds.has(note.sourceTaskId))
  const milestones = project.milestones ?? []
  const linkedClient = clients.find((client) => client.id === project.clientId)
  const totalAmount = projectPricings.reduce((sum, item) => sum + item.amount, 0)
  const receivedAmount = projectPricings.filter((item) => item.status === 'received').reduce((sum, item) => sum + item.amount, 0)
  const outstandingAmount = projectPricings.filter((item) => item.status === 'expected' || item.status === 'due').reduce((sum, item) => sum + item.amount, 0)
  const formatAmount = (amount: number) => amount.toLocaleString('ar-EG')

  function addMilestone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newMilestoneTitle.trim()
    if (!title) return
    const milestone: ProjectMilestone = { id: `milestone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title, status: 'pending' }
    onUpdateProject({ milestones: [...milestones, milestone] })
    setNewMilestoneTitle('')
  }

  function toggleMilestone(milestoneId: string) {
    onUpdateProject({ milestones: milestones.map((milestone) => milestone.id === milestoneId ? { ...milestone, status: milestone.status === 'done' ? 'pending' : 'done' } : milestone) })
  }

  function createUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = String(form.get('body') ?? '').trim()
    if (!body) {
      setUpdateError('اكتب نص التحديث قبل الحفظ.')
      return
    }
    setUpdateError(null)
    onAddProjectUpdate({ projectId: project.id, body, kind: String(form.get('kind') ?? 'progress') as ProjectUpdate['kind'] })
    event.currentTarget.reset()
  }

  function createPricing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    const amount = Number(form.get('amount') ?? 0)
    const currency = String(form.get('currency') ?? 'جنيه').trim() || 'جنيه'
    const clientId = String(form.get('clientId') ?? '').trim() || undefined
    const status = String(form.get('status') ?? 'expected') as ProjectPricing['status']
    if (!title) {
      setPricingError('اكتب اسم الدفعة أولًا.')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setPricingError('اكتب مبلغًا أكبر من صفر.')
      return
    }
    setPricingError(null)
    onAddProjectPricing({ projectId: project.id, clientId, title, amount, currency, status, expectedDate: String(form.get('expectedDate') ?? '').trim() || undefined, receivedAt: status === 'received' ? new Date().toISOString() : undefined, notes: String(form.get('notes') ?? '').trim() || undefined })
    event.currentTarget.reset()
  }

  function updatePricing(event: React.FormEvent<HTMLFormElement>, item: ProjectPricing) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    // Disabled controls are intentionally excluded from FormData. Fall back to
    // the persisted values so a finance-linked payment can still edit notes.
    const rawTitle = form.get('title')
    const rawAmount = form.get('amount')
    const rawCurrency = form.get('currency')
    const rawStatus = form.get('status')
    const rawExpectedDate = form.get('expectedDate')
    const rawClientId = form.get('clientId')
    const title = (rawTitle === null ? item.title : String(rawTitle)).trim()
    const amount = rawAmount === null ? item.amount : Number(rawAmount)
    if (!title) {
      setEditingPricingError('اكتب اسم الدفعة أولًا.')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setEditingPricingError('اكتب مبلغًا أكبر من صفر.')
      return
    }
    const status = (rawStatus === null ? item.status : String(rawStatus)) as ProjectPricing['status']
    onUpdateProjectPricing(item.id, {
      title,
      amount,
      currency: (rawCurrency === null ? item.currency : String(rawCurrency)).trim() || 'جنيه',
      status,
      clientId: rawClientId === null ? item.clientId ?? null : String(rawClientId).trim() || null,
      expectedDate: (rawExpectedDate === null ? item.expectedDate ?? '' : String(rawExpectedDate)).trim() || undefined,
      receivedAt: status === 'received' ? item.receivedAt ?? new Date().toISOString() : undefined,
      notes: String(form.get('notes') ?? '').trim() || undefined,
    })
    setEditingPricingError(null)
    setEditingPricingId(null)
  }

  const statusLabelForPricing = (status: ProjectPricing['status']) => status === 'received' ? 'تم التحصيل' : status === 'due' ? 'مستحقة' : status === 'cancelled' ? 'ملغاة' : 'متوقعة'
  const canQuickTransition = (item: ProjectPricing, nextStatus: ProjectPricing['status']) => item.status !== nextStatus && item.status !== 'cancelled' && !item.financeEntryId
  const hasPendingFinanceSync = (item: ProjectPricing) => Boolean(item.financeEntryId?.startsWith('finance-'))
  const updateKindLabel = (kind: ProjectUpdate['kind']) => kind === 'decision' ? 'قرار' : kind === 'blocker' ? 'عائق' : kind === 'info' ? 'معلومة' : 'تقدم'

  return <ContentCard title="تفاصيل المشروع" description="كل ما يرتبط بالمشروع في مساحة واحدة." action={<Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted">إغلاق</Button>}>
    <div className="mb-4 flex flex-wrap gap-2 rounded-2xl bg-muted/60 p-1"><Button type="button" variant={activeTab === 'overview' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('overview')} className="rounded-xl px-3 py-2 text-xs">نظرة عامة</Button><Button type="button" variant={activeTab === 'updates' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('updates')} className="rounded-xl px-3 py-2 text-xs">التحديثات ({projectUpdates.length})</Button><Button type="button" variant={activeTab === 'pricing' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('pricing')} className="rounded-xl px-3 py-2 text-xs">التسعير والدفعات ({projectPricings.length})</Button></div>
    {activeTab === 'overview' && <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-7">
        <div className="rounded-2xl bg-muted/70 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{statusLabel} · {project.dueLabel}</p><h2 className="mt-1 text-lg font-semibold">{project.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description || 'أضف وصفًا يوضح النتيجة النهائية للمشروع.'}</p></div><div className="rounded-2xl bg-card px-3 py-2 text-center"><p className="text-2xl font-semibold text-primary">{progress}%</p><p className="text-[11px] text-muted-foreground">منجز من المهام</p></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-card"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div><label className="mt-4 block text-xs text-muted-foreground">تعديل نسبة المشروع يدويًا<Input type="range" min="0" max="100" value={project.progress} onChange={(event) => onUpdateProgress(Number(event.target.value))} className="mt-2 w-full accent-primary" /></label><div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground"><span>{goalTitle ? `مرتبط بهدف: ${goalTitle}` : 'غير مرتبط بهدف'}</span><span>{completed}/{linkedTasks.length} مهام مكتملة</span></div></div>
        <div><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">مهام المشروع</h3><span className="text-xs text-muted-foreground">{linkedTasks.length} مهام</span></div><div className="space-y-2">{linkedTasks.map((task) => <div key={task.id} className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2.5"><Button type="button" variant="ghost" size="icon-sm" onClick={() => onToggleTask(task.id)} aria-label={task.status === 'done' ? 'إعادة فتح المهمة' : 'إكمال المهمة'} className="shrink-0 p-0 text-primary">{task.status === 'done' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 text-muted-foreground" />}</Button><span className={`min-w-0 flex-1 text-sm ${task.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>{task.title}</span><span className="text-[11px] text-muted-foreground">{task.dueLabel}</span></div>)}{linkedTasks.length === 0 && <EmptyState icon={CheckCircle2} title="لا توجد مهام مرتبطة" description="أضف أول خطوة للمشروع من الحقل أسفل هذه القائمة." />}</div><form onSubmit={onCreateTask} noValidate className="mt-3 flex flex-wrap gap-2"><Input value={newTaskTitle} onChange={(event) => onNewTaskTitleChange(event.target.value)} aria-label="إضافة مهمة للمشروع" aria-invalid={Boolean(projectTaskError)} aria-describedby={projectTaskError ? 'project-task-error' : undefined} className="min-w-0 flex-1 rounded-2xl px-3 py-2.5 text-xs" placeholder="أضف خطوة للمشروع..." />{projectTaskError && <p id="project-task-error" role="alert" aria-live="assertive" aria-atomic="true" className="basis-full text-xs font-medium text-destructive">{projectTaskError}</p>}<Button type="submit" size="sm" className="shrink-0 rounded-2xl px-3 py-2.5 text-xs"><Plus className="h-3.5 w-3.5" /> إضافة</Button></form></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-border/70 bg-card p-4"><p className="text-xs text-muted-foreground">العميل المرتبط</p><p className="mt-2 text-sm font-semibold">{linkedClient?.name ?? 'لا يوجد عميل مرتبط'}</p>{linkedClient?.company && <p className="mt-1 text-xs text-muted-foreground">{linkedClient.company}</p>}</div><div className="rounded-2xl border border-border/70 bg-card p-4"><p className="text-xs text-muted-foreground">الخطوة التالية</p><p className="mt-2 text-sm font-semibold leading-6">{project.nextStep || 'لم تُحدد بعد'}</p></div></div>
        <div className="rounded-2xl border border-border/70 bg-card p-4"><div className="flex items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">مراحل المشروع</h3><p className="mt-1 text-xs text-muted-foreground">{milestones.filter((milestone) => milestone.status === 'done').length}/{milestones.length} مكتملة</p></div><CheckCircle2 className="h-4 w-4 text-primary" /></div><div className="mt-3 space-y-2">{milestones.map((milestone) => <Button key={milestone.id} type="button" variant="ghost" onClick={() => toggleMilestone(milestone.id)} className="flex h-auto w-full items-center justify-start gap-2 rounded-xl px-2 py-2 text-right hover:bg-muted"><span className={milestone.status === 'done' ? 'text-primary' : 'text-muted-foreground'}>{milestone.status === 'done' ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</span><span className={`text-xs ${milestone.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>{milestone.title}</span></Button>)}{milestones.length === 0 && <p className="text-xs leading-5 text-muted-foreground">أضف مراحل قصيرة لتتابع تقدم المشروع بخلاف المهام اليومية.</p>}</div><form onSubmit={addMilestone} className="mt-3 flex gap-2"><Input value={newMilestoneTitle} onChange={(event) => setNewMilestoneTitle(event.target.value)} aria-label="إضافة مرحلة للمشروع" className="min-w-0 flex-1 rounded-xl px-3 py-2 text-xs" placeholder="مرحلة جديدة..." /><Button type="submit" size="sm" className="shrink-0 rounded-xl px-3 py-2 text-xs"><Plus className="h-3.5 w-3.5" /> إضافة</Button></form></div>
      </div>
      <div className="space-y-4 lg:col-span-5"><div className="rounded-2xl border border-border/70 bg-card p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">ملاحظات مرتبطة</h3><ExternalLink className="h-4 w-4 text-muted-foreground" /></div><div className="mt-3 space-y-2">{projectNotes.map((note) => <div key={note.id} className="rounded-xl bg-muted/70 p-3"><p className="text-xs font-semibold">{note.title}</p><p className="mt-1 line-clamp-3 text-[11px] leading-5 text-muted-foreground">{note.body}</p></div>)}{projectNotes.length === 0 && <p className="text-xs leading-5 text-muted-foreground">الملاحظات التي تحولت من مهام المشروع ستظهر هنا.</p>}</div></div><div className="rounded-2xl bg-accent/60 p-4"><p className="text-xs font-semibold text-accent-foreground">الخطوة التالية</p><p className="mt-2 text-sm leading-6 text-accent-foreground/80">{project.nextStep || 'اختار أصغر مهمة مفتوحة وابدأ بها، وبعدها حدّث نسبة المشروع بدل انتظار نهاية كل شيء.'}</p></div></div>
    </div>}
    {activeTab === 'updates' && <div className="grid grid-cols-1 gap-4 lg:grid-cols-12"><div className="space-y-3 lg:col-span-7"><div className="space-y-3">{projectUpdates.map((item) => <article key={item.id} className="rounded-2xl border border-border/70 bg-card p-4"><div className="flex items-center justify-between gap-2"><span className="rounded-full bg-accent px-2 py-1 text-[11px] text-accent-foreground">{updateKindLabel(item.kind)}</span><div className="flex items-center gap-2"><time className="text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString('ar-EG')}</time><Button type="button" variant="ghost" size="icon-sm" aria-label="حذف التحدي��" onClick={() => onRemoveProjectUpdate(item.id)} className="rounded-full p-1 text-muted-foreground hover:bg-warning"><Trash2 className="h-3.5 w-3.5" /></Button></div></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{item.body}</p></article>)}{projectUpdates.length === 0 && <EmptyState icon={ExternalLink} title="لا توجد تحديثات بعد" description="سجّل قرارًا أو تقدمًا أو عائقًا لتظل صورة المشروع محدثة." />}</div></div><div className="lg:col-span-5"><form onSubmit={createUpdate} noValidate className="space-y-3 rounded-2xl bg-muted/70 p-4"><h3 className="text-sm font-semibold">تحديث جديد</h3><Select name="kind" aria-label="نوع التحديث" defaultValue="progress" className="w-full rounded-2xl px-3 py-3"><option value="progress">تقدم</option><option value="decision">قرار</option><option value="blocker">عائق</option><option value="info">معلومة</option></Select><Textarea name="body" aria-label="نص التحديث" aria-invalid={Boolean(updateError)} aria-describedby={updateError ? 'project-update-error' : undefined} onChange={() => { if (updateError) setUpdateError(null) }} className="min-h-28 w-full resize-none" placeholder="ما الذي تغير في المشروع؟" />{updateError && <p id="project-update-error" role="alert" aria-live="assertive" aria-atomic="true" className="rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">{updateError}</p>}<Button type="submit" className="w-full rounded-2xl px-4 py-3"><Plus className="h-4 w-4" /> حفظ التحديث</Button></form></div></div>}
    {activeTab === 'pricing' && <div className="grid grid-cols-1 gap-4 lg:grid-cols-12"><div className="space-y-3 lg:col-span-7"><div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><div className="rounded-2xl border border-border/70 bg-card p-3"><p className="text-[11px] text-muted-foreground">إجمالي المشروع</p><p className="mt-1 text-base font-semibold">{formatAmount(totalAmount)} {projectPricings[0]?.currency ?? 'جنيه'}</p></div><div className="rounded-2xl border border-border/70 bg-card p-3"><p className="text-[11px] text-muted-foreground">تم تحصيله</p><p className="mt-1 text-base font-semibold text-primary">{formatAmount(receivedAmount)} {projectPricings[0]?.currency ?? 'جنيه'}</p></div><div className="rounded-2xl border border-border/70 bg-card p-3"><p className="text-[11px] text-muted-foreground">المتبقي</p><p className="mt-1 text-base font-semibold text-warning-foreground">{formatAmount(outstandingAmount)} {projectPricings[0]?.currency ?? 'جنيه'}</p></div></div>{editingPricingId && (() => { const item = projectPricings.find((pricing) => pricing.id === editingPricingId); return item ? <form onSubmit={(event) => updatePricing(event, item)} noValidate className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">تعديل الدفعة</h3><Button type="button" variant="ghost" size="icon-sm" aria-label="إلغاء تعديل الدفعة" onClick={() => { setEditingPricingError(null); setEditingPricingId(null) }} className="rounded-full"><X className="h-4 w-4" /></Button></div><Select name="clientId" aria-label="العميل المرتبط بالدفعة المعدلة" defaultValue={item.clientId ?? ''} className="w-full rounded-2xl px-3 py-3"><option value="">بدون عميل مرتبط</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ''}</option>)}</Select><Input name="title" defaultValue={item.title} aria-label="اسم الدفعة المعدلة" aria-invalid={Boolean(editingPricingError)} aria-describedby={editingPricingError ? 'pricing-edit-error' : undefined} onChange={() => { if (editingPricingError) setEditingPricingError(null) }} disabled={Boolean(item.financeEntryId)} className="w-full rounded-2xl px-3 py-3" /><div className="grid grid-cols-2 gap-2"><Input name="amount" type="number" min="0" defaultValue={item.amount} aria-label="المبلغ المعدل" aria-invalid={Boolean(editingPricingError)} aria-describedby={editingPricingError ? 'pricing-edit-error' : undefined} onChange={() => { if (editingPricingError) setEditingPricingError(null) }} disabled={Boolean(item.financeEntryId)} className="w-full rounded-2xl px-3 py-3" /><Input name="currency" defaultValue={item.currency} aria-label="العملة المعدلة" disabled={Boolean(item.financeEntryId)} className="w-full rounded-2xl px-3 py-3" /></div><Select name="status" aria-label="حالة الدفعة المعدلة" defaultValue={item.status} disabled={Boolean(item.financeEntryId)} className="w-full rounded-2xl px-3 py-3"><option value="expected">متوقعة</option><option value="due">مستحقة</option><option value="received">تم التحصيل</option><option value="cancelled">ملغاة</option></Select>{item.financeEntryId && <p className="rounded-xl bg-accent/60 px-3 py-2 text-xs leading-5 text-accent-foreground">هذه الدفعة مرتبطة بسجل مالي؛ الحقول الأساسية مقفلة للحفاظ على تطابق التحصيل مع المالية. يمكنك تعديل الملاحظات فقط.</p>}<Input name="expectedDate" defaultValue={item.expectedDate ?? ''} aria-label="موعد الدفعة المعدل" disabled={Boolean(item.financeEntryId)} className="w-full rounded-2xl px-3 py-3" placeholder="موعد متوقع: 2026-08-25" /><Textarea name="notes" defaultValue={item.notes ?? ''} aria-label="ملاحظات الدفعة المعدلة" className="min-h-20 w-full resize-none rounded-2xl px-3 py-3" placeholder="ملاحظات اختيارية" />{editingPricingError && <p id="pricing-edit-error" role="alert" aria-live="assertive" aria-atomic="true" className="rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">{editingPricingError}</p>}<div className="flex gap-2"><Button type="submit" className="flex-1 rounded-2xl px-4 py-3"><CheckCircle2 className="h-4 w-4" /> حفظ التعديل</Button><Button type="button" variant="outline" onClick={() => { setEditingPricingError(null); setEditingPricingId(null) }} className="rounded-2xl px-4 py-3">إلغاء</Button></div></form> : null })()}{projectPricings.map((item) => <article key={item.id} className="rounded-2xl border border-border/70 bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-xs text-muted-foreground">{item.clientId ? `العميل: ${clients.find((client) => client.id === item.clientId)?.name ?? 'عميل محفوظ'}` : 'بدون عميل مرتبط'} · {item.expectedDate ? `موعد متوقع: ${item.expectedDate}` : 'بدون موعد محدد'}{item.notes ? ` · ${item.notes}` : ''}</p></div><div className="text-left"><p className="font-semibold text-primary">{item.amount.toLocaleString('ar-EG')} {item.currency}</p><span className="text-[11px] text-muted-foreground">{statusLabelForPricing(item.status)}</span></div></div><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => { setEditingPricingError(null); setEditingPricingId(item.id) }} className="rounded-xl px-3 py-1.5 text-xs"><Pencil className="h-3.5 w-3.5" /> تعديل</Button><Button type="button" variant={item.status === 'due' ? 'default' : 'outline'} size="sm" disabled={!canQuickTransition(item, 'due')} onClick={() => onUpdateProjectPricing(item.id, { status: 'due' })} className="rounded-xl px-3 py-1.5 text-xs">مستحقة</Button><Button type="button" variant={item.status === 'received' ? 'default' : 'outline'} size="sm" disabled={!canQuickTransition(item, 'received')} onClick={() => onCollectProjectPricing(item.id)} className="rounded-xl px-3 py-1.5 text-xs">تم التحصيل وربطه</Button><Button type="button" variant={item.status === 'cancelled' ? 'default' : 'outline'} size="sm" disabled={!canQuickTransition(item, 'cancelled')} onClick={() => onUpdateProjectPricing(item.id, { status: 'cancelled' })} className="rounded-xl px-3 py-1.5 text-xs">إلغاء</Button></div>{item.status === 'received' && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-accent/60 px-3 py-2 text-xs text-accent-foreground"><p className="leading-5">{item.financeEntryId ? hasPendingFinanceSync(item) ? 'الدخل محفوظ محليًا، لكن المزامنة لم تكتمل. يمكنك إعادة المحاولة دون إنشاء سجل محلي مكرر.' : 'تمت إضافة الدفعة إلى قسم المالية كدخل مرتبط بالمشروع.' : 'حوّل الدفعة إلى دخل في قسم المالية حتى ينعكس التحصيل على ملخصك المالي.'}</p>{item.financeEntryId && !hasPendingFinanceSync(item) ? <span className="rounded-full bg-card/70 px-2 py-1 font-semibold">تم الربط</span> : <Button type="button" size="sm" onClick={() => onAddFinanceEntryFromPricing(item.id)} className="rounded-xl px-3 py-1.5 text-xs">{hasPendingFinanceSync(item) ? 'إعادة المزامنة' : 'إضافة إلى المالية'}</Button>}</div>}</article>)}{projectPricings.length === 0 && <EmptyState icon={FolderKanban} title="لا توجد دفعات" description="أضف دفعات المشروع المتوقعة أو المستحقة من النموذج المجاور." />}</div><div className="lg:col-span-5"><form onSubmit={createPricing} noValidate className="space-y-3 rounded-2xl bg-muted/70 p-4"><h3 className="text-sm font-semibold">دفعة جديدة</h3><Input name="title" aria-label="اسم الدفعة" aria-invalid={Boolean(pricingError)} aria-describedby={pricingError ? 'pricing-error' : undefined} onChange={() => { if (pricingError) setPricingError(null) }} className="w-full rounded-2xl px-3 py-3" placeholder="مثال: الدفعة الأولى" /><div className="grid grid-cols-2 gap-2"><Input name="amount" type="number" min="0" aria-label="المبلغ" aria-invalid={Boolean(pricingError)} aria-describedby={pricingError ? 'pricing-error' : undefined} onChange={() => { if (pricingError) setPricingError(null) }} className="w-full rounded-2xl px-3 py-3" placeholder="المبلغ" /><Input name="currency" defaultValue="جنيه" aria-label="العملة" className="w-full rounded-2xl px-3 py-3" placeholder="العملة" /></div><Select name="clientId" aria-label="العميل المرتبط بالدفعة" defaultValue="" className="w-full rounded-2xl px-3 py-3"><option value="">بدون عميل مرتبط</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ''}</option>)}</Select><Select name="status" aria-label="حالة الدفعة" defaultValue="expected" className="w-full rounded-2xl px-3 py-3"><option value="expected">متوقعة</option><option value="due">مستحقة</option><option value="received">تم التحصيل</option><option value="cancelled">ملغاة</option></Select><Input name="expectedDate" aria-label="موعد الدفعة" className="w-full rounded-2xl px-3 py-3" placeholder="موعد متوقع: 2026-08-25" /><Textarea name="notes" aria-label="ملاحظات الدفعة" className="min-h-20 w-full resize-none rounded-2xl px-3 py-3" placeholder="ملاحظات اختيارية" />{pricingError && <p id="pricing-error" role="alert" aria-live="assertive" aria-atomic="true" className="rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">{pricingError}</p>}<Button type="submit" className="w-full rounded-2xl px-4 py-3"><Plus className="h-4 w-4" /> إضافة الدفعة</Button></form></div></div>}
  </ContentCard>
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-2xl bg-muted px-3 py-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>
}
