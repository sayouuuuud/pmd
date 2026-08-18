'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, CircleAlert, Clock3, ExternalLink, Mail, Phone, RefreshCw, UserRound, WalletCards } from 'lucide-react'
import { useParams } from 'next/navigation'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { readWorkspaceFallback, type Client } from '@/lib/workspace-types'
import { useCommandCenter } from '@/lib/command-center-store'

type WorkspacesPayload = { workspaces?: { id: string; name?: string }[]; activeWorkspaceId?: string }
type ClientsPayload = { clients?: Client[] }

type ClientTab = 'overview' | 'projects' | 'financial' | 'activity'

function money(amount: number, currency = 'جنيه') {
  return `${Math.round(amount).toLocaleString('ar-EG')} ${currency}`
}

function pricingStatus(status: string) {
  if (status === 'received') return 'تم التحصيل'
  if (status === 'due') return 'مستحق'
  if (status === 'cancelled') return 'ملغى'
  return 'متوقع'
}

function formatDate(value: string) {
  if (!value) return 'بدون تاريخ'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(date)
}

export function ClientProfileWorkspace() {
  const params = useParams<{ id: string }>()
  const clientId = typeof params?.id === 'string' ? decodeURIComponent(params.id) : ''
  const { projects, tasks, projectUpdates, projectPricings } = useCommandCenter()
  const [client, setClient] = useState<Client | null>(null)
  const [workspaceName, setWorkspaceName] = useState('مساحة العمل')
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ClientTab>('overview')

  useEffect(() => {
    let active = true
    async function loadClient() {
      try {
        const workspaceResponse = await fetch('/api/workspaces', { cache: 'no-store' })
        if (!workspaceResponse.ok) throw new Error('workspace-unavailable')
        const workspacePayload = await workspaceResponse.json() as WorkspacesPayload
        const workspaceId = workspacePayload.activeWorkspaceId ?? workspacePayload.workspaces?.[0]?.id
        if (!workspaceId) throw new Error('workspace-missing')
        const clientResponse = await fetch(`/api/clients?workspaceId=${encodeURIComponent(workspaceId)}`, { cache: 'no-store' })
        if (!clientResponse.ok) throw new Error('clients-unavailable')
        const clientPayload = await clientResponse.json() as ClientsPayload
        if (!active) return
        setClient(clientPayload.clients?.find((item) => item.id === clientId) ?? null)
        setWorkspaceName(workspacePayload.workspaces?.find((item) => item.id === workspaceId)?.name ?? 'مساحة العمل')
        setBackendAvailable(true)
      } catch {
        if (!active) return
        const local = readWorkspaceFallback()
        const localClient = Object.values(local.clientsByWorkspace).flat().find((item) => item.id === clientId) ?? null
        const localWorkspace = local.workspaces.find((workspace) => workspace.id === localClient?.workspaceId) ?? local.workspaces[0]
        setClient(localClient)
        setWorkspaceName(localWorkspace?.name ?? 'مساحتي الشخصية')
        setBackendAvailable(false)
      } finally {
        if (active) setLoading(false)
      }
    }
    if (clientId) void loadClient()
    else setLoading(false)
    return () => { active = false }
  }, [clientId])

  const linkedPricing = useMemo(() => projectPricings.filter((pricing) => pricing.clientId === clientId), [clientId, projectPricings])
  const linkedProjectIds = useMemo(() => new Set(linkedPricing.map((pricing) => pricing.projectId)), [linkedPricing])
  const linkedProjects = useMemo(() => projects.filter((project) => linkedProjectIds.has(project.id)), [linkedProjectIds, projects])
  const linkedTasks = useMemo(() => tasks.filter((task) => task.projectId && linkedProjectIds.has(task.projectId)), [linkedProjectIds, tasks])
  const linkedUpdates = useMemo(() => projectUpdates.filter((update) => linkedProjectIds.has(update.projectId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [linkedProjectIds, projectUpdates])
  const received = linkedPricing.filter((item) => item.status === 'received').reduce((sum, item) => sum + item.amount, 0)
  const outstanding = linkedPricing.filter((item) => item.status === 'expected' || item.status === 'due').reduce((sum, item) => sum + item.amount, 0)
  const overdueTasks = linkedTasks.filter((task) => task.status !== 'done' && /متأخر|أمس|أول أمس/.test(task.dueLabel))
  const currency = linkedPricing[0]?.currency ?? 'جنيه'

  if (loading) return <div className="rounded-3xl bg-card px-6 py-16 text-center text-sm text-muted-foreground" role="status" aria-live="polite">جاري تحميل ملف العميل...</div>
  if (!client) return <EmptyState icon={UserRound} title="العميل غير موجود" description="قد يكون العميل تابعًا لمساحة عمل أخرى أو تم أرشفته. ارجع إلى مساحة العمل لاختيار عميل متاح." action={<Link href="/workspace" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"><ArrowLeft className="h-4 w-4" /> العودة لمساحة العمل</Link>} />

  const tabs: { id: ClientTab; label: string }[] = [
    { id: 'overview', label: 'نظرة عامة' },
    { id: 'projects', label: 'المشاريع والمهام' },
    { id: 'financial', label: 'الدفعات' },
    { id: 'activity', label: 'النشاط' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Link href="/workspace" className="font-semibold text-primary">مساحة العمل</Link><ArrowLeft className="h-3.5 w-3.5" /><span>{workspaceName}</span></div>
        <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-medium ${backendAvailable ? 'bg-positive/15 text-positive-foreground' : 'bg-warning/15 text-warning-foreground'}`}>{backendAvailable ? 'بيانات متزامنة' : 'بيانات محلية مؤقتة'}</span><Link href="/workspace/dashboard" className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-xs font-semibold">لوحة العمل <ArrowLeft className="h-4 w-4" /></Link></div>
      </div>

      <ContentCard className="overflow-hidden" title={client.name} description={client.company ?? 'عميل مستقل'}>
        <div className="flex flex-wrap items-start justify-between gap-5"><div className="flex items-start gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><UserRound className="h-6 w-6" /></span><div><p className="text-sm leading-7 text-muted-foreground">{client.notes || 'لا توجد ملاحظات أولية لهذا العميل.'}</p><div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">{client.email ? <a dir="ltr" href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5 hover:text-primary"><Mail className="h-3.5 w-3.5" />{client.email}</a> : null}{client.phone ? <a dir="ltr" href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5 hover:text-primary"><Phone className="h-3.5 w-3.5" />{client.phone}</a> : null}</div></div></div><Link href="/workspace" className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-2 text-xs font-semibold"><RefreshCw className="h-3.5 w-3.5" /> تعديل من مساحة العمل</Link></div>
      </ContentCard>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="المشاريع" value={String(linkedProjects.length)} detail={`${linkedProjects.filter((project) => project.status === 'in-progress').length} قيد التنفيذ`} tone="blue" href="#projects" /><StatCard label="المهام المفتوحة" value={String(linkedTasks.filter((task) => task.status !== 'done').length)} detail={`${overdueTasks.length} متأخرة`} tone="orange" href="#projects" /><StatCard label="المحصّل" value={money(received, currency)} detail="دفعات مستلمة" tone="green" href="#financial" /><StatCard label="المفتوح" value={money(outstanding, currency)} detail="متوقع أو مستحق" tone="purple" href="#financial" /></div>

      <nav aria-label="أقسام ملف العميل" className="flex flex-wrap gap-2 rounded-2xl bg-muted/50 p-2">{tabs.map((tab) => <Button key={tab.id} type="button" variant={activeTab === tab.id ? 'secondary' : 'ghost'} onClick={() => setActiveTab(tab.id)} aria-pressed={activeTab === tab.id} className="rounded-xl px-4 py-2.5 text-xs font-semibold">{tab.label}</Button>)}</nav>

      {activeTab === 'overview' ? <div className="grid grid-cols-1 gap-4 lg:grid-cols-12"><ContentCard className="lg:col-span-7" title="الخطوة التالية" description="ملخص عملي يساعدك على مواصلة العلاقة."><div className="space-y-3"><div className="flex items-start gap-3 rounded-2xl bg-accent p-4"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" /><div><p className="font-semibold text-accent-foreground">{overdueTasks.length > 0 ? `راجع ${overdueTasks.length} مهام متأخرة` : outstanding > 0 ? 'تابع الدفعات المفتوحة' : linkedProjects.length > 0 ? 'سجّل تحديثًا جديدًا للمشروع' : 'اربط أول مشروع بالعميل'}</p><p className="mt-1 text-sm leading-6 text-accent-foreground/75">{overdueTasks.length > 0 ? 'ابدأ بالمهام المتأخرة المرتبطة بمشاريع هذا العميل.' : outstanding > 0 ? 'تأكد من حالة كل دفعة وموعد المتابعة التالي.' : 'حافظ على الملف قابلًا للتنفيذ بدل تركه كسجل بيانات فقط.'}</p></div></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">مشاريع مكتملة</p><p className="mt-2 text-xl font-semibold">{linkedProjects.filter((project) => project.status === 'done').length}</p></div><div className="rounded-2xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">المهام المكتملة</p><p className="mt-2 text-xl font-semibold">{linkedTasks.filter((task) => task.status === 'done').length}</p></div><div className="rounded-2xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">التحديثات</p><p className="mt-2 text-xl font-semibold">{linkedUpdates.length}</p></div></div></div></ContentCard><ContentCard className="lg:col-span-5" title="آخر نشاط" description="آخر ما تم ربطه بالعميل.">{linkedUpdates.slice(0, 3).length === 0 ? <div className="rounded-2xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground"><Clock3 className="mx-auto mb-2 h-5 w-5" />لا يوجد نشاط مسجل بعد.</div> : <div className="space-y-3">{linkedUpdates.slice(0, 3).map((update) => <div key={update.id} className="rounded-2xl bg-muted/60 p-3"><p className="text-xs leading-6">{update.body}</p><p className="mt-2 text-[11px] text-muted-foreground">{formatDate(update.createdAt)}</p></div>)}</div>}</ContentCard></div> : null}

      {activeTab === 'projects' ? <div id="projects"><ContentCard title="المشاريع والمهام" description="كل العمل المرتبط بهذا العميل عبر التسعير الحالي.">{linkedProjects.length === 0 ? <EmptyState icon={BriefcaseBusiness} title="لا توجد مشاريع مرتبطة" description="اربط دفعة بعميل من تفاصيل المشروع حتى تظهر العلاقة هنا." action={<Link href="/projects" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground">فتح المشاريع <ArrowLeft className="h-4 w-4" /></Link>} /> : <div className="space-y-4">{linkedProjects.map((project) => { const projectTasks = linkedTasks.filter((task) => task.projectId === project.id); return <article key={project.id} className="rounded-2xl border border-border bg-muted/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{project.title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{project.description || 'بدون وصف إضافي'}</p></div><Link href={`/projects?project=${encodeURIComponent(project.id)}`} className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-xs font-semibold text-primary">فتح المشروع <ExternalLink className="h-3.5 w-3.5" /></Link></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }} /></div><div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{project.progress}% مكتمل</span><span>{project.dueLabel}</span><span>{projectTasks.filter((task) => task.status !== 'done').length} مهام مفتوحة</span></div></article> })}</div>}</ContentCard></div> : null}

      {activeTab === 'financial' ? <div id="financial"><ContentCard title="الدفعات والتسعير" description="سجل محلي واضح لما تم تحصيله وما يزال مفتوحًا.">{linkedPricing.length === 0 ? <EmptyState icon={WalletCards} title="لا توجد دفعات مرتبطة" description="ابدأ من تفاصيل المشروع وأضف تسعيرًا مرتبطًا بهذا العميل." action={<Link href="/projects" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground">فتح المشاريع <ArrowLeft className="h-4 w-4" /></Link>} /> : <div className="space-y-2">{linkedPricing.map((pricing) => <div key={pricing.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/60 px-3 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-primary"><WalletCards className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{pricing.title}</p><p className="mt-1 text-xs text-muted-foreground">{projects.find((project) => project.id === pricing.projectId)?.title ?? 'مشروع'} · {pricing.expectedDate ? `الموعد ${pricing.expectedDate}` : 'بدون موعد'}</p></div><span className="text-sm font-semibold">{money(pricing.amount, pricing.currency)}</span><span className={`rounded-full px-2.5 py-1 text-[11px] ${pricing.status === 'received' ? 'bg-positive/15 text-positive-foreground' : pricing.status === 'due' ? 'bg-warning/15 text-warning-foreground' : pricing.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>{pricingStatus(pricing.status)}</span></div>)}</div>}</ContentCard></div> : null}

      {activeTab === 'activity' ? <div id="activity"><ContentCard title="سجل النشاط" description="تحديثات المشاريع المرتبطة بالعميل بترتيب زمني.">{linkedUpdates.length === 0 ? <EmptyState icon={Clock3} title="لا يوجد نشاط" description="ستظهر هنا تحديثات التقدم والقرارات والعوائق المرتبطة بمشاريع العميل." /> : <div className="space-y-3">{linkedUpdates.map((update) => <div key={update.id} className="flex gap-3 rounded-2xl bg-muted/60 p-4"><span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><CheckCircle2 className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm leading-6">{update.body}</p><p className="mt-1 text-xs text-muted-foreground">{projects.find((project) => project.id === update.projectId)?.title ?? 'مشروع'} · {formatDate(update.createdAt)}</p></div></div>)}</div>}</ContentCard></div> : null}
    </div>
  )
}
