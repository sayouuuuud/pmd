'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, CircleAlert, Clock3, FolderKanban, WalletCards } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { StatCard } from '@/components/ui/stat-card'
import { readWorkspaceFallback, type Client, type WorkspaceFallback } from '@/lib/workspace-types'
import { useCommandCenter } from '@/lib/command-center-store'

type WorkspacesPayload = { workspaces?: { id: string; name?: string; role?: string }[]; activeWorkspaceId?: string }
type ClientsPayload = { clients?: Client[] }

function money(amount: number, currency = 'جنيه') {
  return `${Math.round(amount).toLocaleString('ar-EG')} ${currency}`
}

export function WorkDashboard() {
  const { projects, tasks, projectUpdates, projectPricings, financeEntries } = useCommandCenter()
  const [fallback, setFallback] = useState<WorkspaceFallback>(readWorkspaceFallback())
  const [workspaceId, setWorkspaceId] = useState('local-personal')
  const [workspaceName, setWorkspaceName] = useState('مساحتي الشخصية')
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadWorkspace() {
      try {
        const workspaceResponse = await fetch('/api/workspaces', { cache: 'no-store' })
        if (!workspaceResponse.ok) throw new Error('workspace-unavailable')
        const workspacePayload = await workspaceResponse.json() as WorkspacesPayload
        const nextWorkspaceId = workspacePayload.activeWorkspaceId ?? workspacePayload.workspaces?.[0]?.id
        if (!nextWorkspaceId) throw new Error('workspace-missing')
        const clientResponse = await fetch(`/api/clients?workspaceId=${encodeURIComponent(nextWorkspaceId)}`, { cache: 'no-store' })
        if (!clientResponse.ok) throw new Error('clients-unavailable')
        const clientPayload = await clientResponse.json() as ClientsPayload
        if (!active) return
        setFallback((current) => ({ ...current, clientsByWorkspace: { ...current.clientsByWorkspace, [nextWorkspaceId]: clientPayload.clients ?? [] } }))
        setWorkspaceId(nextWorkspaceId)
        setWorkspaceName(workspacePayload.workspaces?.find((item) => item.id === nextWorkspaceId)?.name ?? 'مساحة العمل')
        setBackendAvailable(true)
      } catch {
        if (!active) return
        const local = readWorkspaceFallback()
        setFallback(local)
        const localWorkspace = local.workspaces[0]
        setWorkspaceId(localWorkspace?.id ?? 'local-personal')
        setWorkspaceName(localWorkspace?.name ?? 'مساحتي الشخصية')
        setBackendAvailable(false)
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadWorkspace()
    return () => { active = false }
  }, [])

  const clients = useMemo(() => fallback.clientsByWorkspace[workspaceId] ?? [], [fallback.clientsByWorkspace, workspaceId])
  const clientIds = useMemo(() => new Set(clients.map((client) => client.id)), [clients])
  const clientPricing = useMemo(() => projectPricings.filter((pricing) => pricing.clientId && clientIds.has(pricing.clientId)), [clientIds, projectPricings])
  const clientProjectIds = useMemo(() => new Set(clientPricing.map((pricing) => pricing.projectId)), [clientPricing])
  const clientProjects = useMemo(() => projects.filter((project) => clientProjectIds.has(project.id)), [clientProjectIds, projects])
  const activeTasks = useMemo(() => tasks.filter((task) => task.projectId && clientProjectIds.has(task.projectId) && task.status !== 'done'), [clientProjectIds, tasks])
  const overdueTasks = activeTasks.filter((task) => /متأخر|أمس|أول أمس/.test(task.dueLabel))
  const outstanding = clientPricing.filter((pricing) => pricing.status === 'expected' || pricing.status === 'due').reduce((sum, pricing) => sum + pricing.amount, 0)
  const received = clientPricing.filter((pricing) => pricing.status === 'received').reduce((sum, pricing) => sum + pricing.amount, 0)
  const recentUpdates = [...projectUpdates].filter((update) => clientProjectIds.has(update.projectId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  const recentIncome = financeEntries.filter((entry) => entry.kind === 'income' && entry.projectId && clientProjectIds.has(entry.projectId)).reduce((sum, entry) => sum + entry.amount, 0)
  const currency = clientPricing[0]?.currency ?? 'جنيه'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{workspaceName}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">لوحة العمل</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">صورة واحدة للعملاء والمشاريع والمهام والدفعات، بدون خلطها مع لوحة حياتك الشخصية.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${backendAvailable ? 'bg-positive/15 text-positive-foreground' : 'bg-warning/15 text-warning-foreground'}`}>{backendAvailable ? 'مزامنة العملاء مفعّلة' : 'بيانات محلية مؤقتة'}</span>
          <Link href="/workspace" className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-xs font-semibold"><ArrowLeft className="h-4 w-4" /> مساحة العمل</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="العملاء" value={String(clients.length)} detail="في المساحة الحالية" tone="blue" href="/workspace" />
        <StatCard label="المشاريع" value={String(clientProjects.length)} detail={`${clientProjects.filter((project) => project.status === 'in-progress').length} قيد التنفيذ`} tone="green" href="/projects" />
        <StatCard label="المستحقات المفتوحة" value={money(outstanding, currency)} detail={`${clientPricing.filter((item) => item.status === 'due').length} دفعات مستحقة`} tone="orange" href="/money" />
        <StatCard label="المحصّل" value={money(received || recentIncome, currency)} detail="من مشاريع مرتبطة بعملاء" tone="purple" href="/money" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <ContentCard className="lg:col-span-7" title="العملاء النشطون" description="افتح ملف أي عميل لمراجعة العمل والدفعات والخطوة التالية.">
          {loading ? <LoadingState label="جاري تحميل بيانات العملاء..." count={2} /> : null}
          {!loading && clients.length === 0 ? <EmptyState icon={BriefcaseBusiness} title="لا يوجد عملاء بعد" description="أضف أول عميل من مساحة العمل، ثم اربط به تسعيرًا أو مشروعًا لتظهر مؤشرات العمل هنا." action={<Link href="/workspace" className="inline-flex rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground">فتح مساحة العمل</Link>} /> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {clients.slice(0, 8).map((client) => {
              const pricing = clientPricing.filter((item) => item.clientId === client.id)
              const projectIds = new Set(pricing.map((item) => item.projectId))
              const due = pricing.filter((item) => item.status === 'expected' || item.status === 'due').reduce((sum, item) => sum + item.amount, 0)
              return <Link key={client.id} href={`/workspace/clients/${encodeURIComponent(client.id)}`} className="rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><BriefcaseBusiness className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{client.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{client.company ?? 'بدون شركة محددة'}</p></div><ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" /></div><div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground"><span className="rounded-full bg-card px-2 py-1">{projectIds.size} مشاريع</span><span className="rounded-full bg-card px-2 py-1">{pricing.length} دفعات</span>{due > 0 ? <span className="rounded-full bg-warning/15 px-2 py-1 text-warning-foreground">{money(due, pricing[0]?.currency ?? currency)} مفتوح</span> : null}</div></Link>
            })}
          </div>
        </ContentCard>

        <ContentCard className="lg:col-span-5" title="العمل يحتاج انتباهًا" description="أولويات العمل المحلية الحالية.">
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl bg-warning/10 p-3"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" /><div><p className="text-sm font-semibold">{overdueTasks.length} مهام متأخرة</p><p className="mt-1 text-xs leading-5 text-muted-foreground">راجع المهام المرتبطة بالمشاريع قبل فتح عمل جديد.</p></div></div>
            <div className="flex items-start gap-3 rounded-2xl bg-accent p-3"><WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" /><div><p className="text-sm font-semibold text-accent-foreground">{money(outstanding, currency)} مفتوحة</p><p className="mt-1 text-xs leading-5 text-accent-foreground/70">تابع الدفعات من ملف العميل بدل الاعتماد على الذاكرة.</p></div></div>
            <Link href="/projects" className="flex items-center justify-between rounded-2xl bg-muted px-3 py-3 text-xs font-semibold">فتح لوحة المشاريع <ArrowLeft className="h-4 w-4" /></Link>
          </div>
        </ContentCard>

        <ContentCard className="lg:col-span-7" title="المشاريع المرتبطة بالعملاء" description="المشاريع التي تحتوي على دفعة مرتبطة بعميل.">
          {clientProjects.length === 0 ? <EmptyState icon={FolderKanban} title="لا توجد مشاريع مرتبطة بعد" description="من تفاصيل المشروع أضف تسعيرًا واربطه بعميل حتى يظهر هنا." action={<Link href="/projects" className="inline-flex rounded-full bg-card px-4 py-2.5 text-xs font-semibold text-primary">فتح المشاريع</Link>} /> : <div className="space-y-2">{clientProjects.slice(0, 6).map((project) => { const linkedTasks = tasks.filter((task) => task.projectId === project.id); return <Link key={project.id} href={`/projects?project=${encodeURIComponent(project.id)}`} className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-3 transition-colors hover:bg-accent"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-card text-primary"><FolderKanban className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{project.title}</span><span className="mt-1 block text-xs text-muted-foreground">{linkedTasks.filter((task) => task.status !== 'done').length} مهام مفتوحة · {project.progress}% مكتمل</span></span><span className="text-xs text-muted-foreground">{project.dueLabel}</span><ArrowLeft className="h-4 w-4" /></Link> })}</div>}
        </ContentCard>

        <ContentCard className="lg:col-span-5" title="آخر تحديثات العمل" description="آخر ما تم تسجيله في المشاريع المرتبطة.">
          {recentUpdates.length === 0 ? <EmptyState icon={Clock3} title="لا توجد تحديثات عمل بعد" description="ستظهر هنا آخر التحديثات عند تسجيل نشاط في أحد المشاريع المرتبطة." /> : <div className="space-y-3">{recentUpdates.map((update) => <div key={update.id} className="rounded-2xl bg-muted/60 p-3"><p className="text-xs leading-6">{update.body}</p><p className="mt-2 text-[11px] text-muted-foreground">{projects.find((project) => project.id === update.projectId)?.title ?? 'مشروع'}</p></div>)}</div>}
        </ContentCard>
      </div>
    </div>
  )
}
