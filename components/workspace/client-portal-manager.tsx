'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Clipboard, ExternalLink, Link2, MessageSquare, Plus, ShieldCheck, Trash2, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useCommandCenter } from '@/lib/command-center-store'
import { createClientPortalId, createClientPortalToken, persistClientPortalFallback, readClientPortalFallback, type ClientPortalFallback, type ClientPortalInteraction, type ClientPortalResource, type ClientPortalShare } from '@/lib/client-portal-contracts'
import type { Client, Workspace } from '@/lib/workspace-types'

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(date)
}

function shareUrl(token: string) {
  if (typeof window === 'undefined') return `/portal/${encodeURIComponent(token)}`
  return `${window.location.origin}/portal/${encodeURIComponent(token)}`
}

export function ClientPortalManager({ workspace, clients, canManage }: { workspace: Workspace; clients: Client[]; canManage: boolean }) {
  const { projects } = useCommandCenter()
  const [portal, setPortal] = useState<ClientPortalFallback>(readClientPortalFallback)
  const [clientId, setClientId] = useState('')
  const [projectIds, setProjectIds] = useState<string[]>([])
  const [role, setRole] = useState<'client' | 'reader' | 'reviewer'>('client')
  const [includePricing, setIncludePricing] = useState(false)
  const [includeSchedule, setIncludeSchedule] = useState(true)
  const [expiresInDays, setExpiresInDays] = useState('14')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [resourceDescription, setResourceDescription] = useState('')
  const [resources, setResources] = useState<ClientPortalResource[]>([])
  const [generated, setGenerated] = useState<ClientPortalShare | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const local = readClientPortalFallback()
    setPortal(local)
    setClientId((current) => current || clients[0]?.id || '')
  }, [clients])

  const availableProjects = useMemo(() => projects.filter((project) => project.clientId === clientId), [clientId, projects])
  const workspaceShares = useMemo(() => portal.shares.filter((share) => share.workspaceId === workspace.id), [portal.shares, workspace.id])
  const activeClient = clients.find((client) => client.id === clientId)

  function persist(next: ClientPortalFallback) {
    setPortal(next)
    persistClientPortalFallback(next)
  }

  function toggleProject(id: string) {
    setProjectIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  }

  function addResource() {
    const title = resourceTitle.trim()
    const url = resourceUrl.trim()
    if (!title || !url) {
      setError('اكتب اسم الرابط وعنوانه أولًا.')
      return
    }
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid-url')
    } catch {
      setError('استخدم رابطًا يبدأ بـ https:// أو http://.')
      return
    }
    setResources((items) => [...items, { id: createClientPortalId('resource'), title, url, description: resourceDescription.trim() || undefined }])
    setResourceTitle('')
    setResourceUrl('')
    setResourceDescription('')
    setError('')
  }

  function createShare() {
    if (!canManage) return
    if (!activeClient) {
      setError('اختر عميلًا أولًا.')
      return
    }
    if (projectIds.length === 0) {
      setError('اختر مشروعًا واحدًا على الأقل لمشاركته.')
      return
    }
    const days = Math.min(90, Math.max(1, Number(expiresInDays) || 14))
    const now = new Date()
    const share: ClientPortalShare = {
      id: createClientPortalId('share'),
      token: createClientPortalToken(),
      workspaceId: workspace.id,
      clientId: activeClient.id,
      projectIds,
      role,
      includePricing,
      includeSchedule,
      resources,
      status: 'active',
      expiresAt: new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    persist({ ...portal, shares: [share, ...portal.shares] })
    setGenerated(share)
    setProjectIds([])
    setResources([])
    setNotice('تم إنشاء رابط البوابة التجريبي محليًا. لا يتم إرسال الرابط بالبريد تلقائيًا.')
    setError('')
  }

  function revokeShare(share: ClientPortalShare) {
    const now = new Date().toISOString()
    persist({ ...portal, shares: portal.shares.map((item) => item.id === share.id ? { ...item, status: 'revoked', updatedAt: now } : item) })
    if (generated?.id === share.id) setGenerated(null)
    setNotice('تم إبطال رابط البوابة.')
  }

  async function copyLink(token: string) {
    const value = shareUrl(token)
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
      setNotice('تعذر النسخ التلقائي؛ انسخ الرابط يدويًا من الحقل.')
    }
  }

  function interactionsFor(shareId: string) {
    return portal.interactions.filter((interaction) => interaction.shareId === shareId).slice(0, 4)
  }

  if (!canManage) return <ContentCard title="بوابة العميل" description="روابط المشاركة يديرها مالك مساحة العمل أو مديرها."><p className="text-sm text-muted-foreground">يمكنك رؤية المشاريع المشتركة من خلال الروابط التي صُرفت لك، لكن لا يمكنك إنشاء رابط أو إبطاله.</p></ContentCard>

  return (
    <ContentCard title="بوابة العميل التجريبية" description="شارك مشاريع محددة فقط عبر رابط محلي مؤقت. لا توجد دعوة بريدية أو مصادقة عميل إنتاجية في هذه النسخة.">
      <div className="space-y-5">
        {notice ? <div role="status" aria-live="polite" className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">{notice}</div> : null}
        {error ? <div role="alert" aria-live="assertive" className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" /><p className="font-medium">اختيار العميل والمشاريع</p></div>
            {clients.length === 0 ? <p className="text-sm text-muted-foreground">أضف عميلًا أولًا من القسم أعلاه.</p> : <>
              <Select value={clientId} onChange={(event) => { setClientId(event.target.value); setProjectIds([]) }} aria-label="العميل الذي ستتم مشاركته"><option value="">اختر العميل</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ''}</option>)}</Select>
              <div className="space-y-2">{availableProjects.length === 0 ? <p className="rounded-xl bg-background px-3 py-3 text-xs text-muted-foreground">لا توجد مشاريع مرتبطة بهذا العميل. اربط المشروع بالعميل من شاشة المشاريع أولًا.</p> : availableProjects.map((project) => <label key={project.id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-background px-3 py-3 text-sm"><input type="checkbox" checked={projectIds.includes(project.id)} onChange={() => toggleProject(project.id)} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" /><span className="min-w-0 flex-1"><span className="block font-medium">{project.title}</span><span className="mt-1 block text-xs text-muted-foreground">{project.progress}% مكتمل · {project.dueLabel}</span></span></label>)}</div>
            </>}
          </div>
          <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><p className="font-medium">نطاق الوصول</p></div>
            <Select value={role} onChange={(event) => setRole(event.target.value as typeof role)} aria-label="دور العميل في البوابة"><option value="client">عميل · قراءة وتعليق ومراجعة</option><option value="reader">قارئ · قراءة فقط</option><option value="reviewer">مراجع · قراءة ومراجعة</option></Select>
            <label className="flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-sm"><input type="checkbox" checked={includeSchedule} onChange={(event) => setIncludeSchedule(event.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />إظهار الموعد والخطوة الزمنية</label>
            <label className="flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-sm"><input type="checkbox" checked={includePricing} onChange={(event) => setIncludePricing(event.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />إظهار الدفعات التي أختارها</label>
            <div className="grid grid-cols-[1fr_7rem] gap-3"><Input type="number" min="1" max="90" value={expiresInDays} onChange={(event) => setExpiresInDays(event.target.value)} aria-label="مدة صلاحية الرابط بالأيام" placeholder="14" /><span className="flex items-center text-xs text-muted-foreground">يوم صلاحية</span></div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /><p className="font-medium">روابط أو ملفات مسموح بها</p></div><span className="text-xs text-muted-foreground">روابط عامة فقط</span></div>
          <div className="grid gap-3 md:grid-cols-[1fr_1.2fr_1fr_auto]"><Input value={resourceTitle} onChange={(event) => setResourceTitle(event.target.value)} placeholder="اسم الملف أو الرابط" aria-label="اسم المورد المشارك" /><Input dir="ltr" value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} placeholder="https://..." aria-label="عنوان المورد المشارك" /><Input value={resourceDescription} onChange={(event) => setResourceDescription(event.target.value)} placeholder="وصف مختصر اختياري" aria-label="وصف المورد المشارك" /><Button type="button" variant="outline" onClick={addResource}><Plus className="h-4 w-4" />إضافة</Button></div>
          {resources.length ? <div className="flex flex-wrap gap-2">{resources.map((resource) => <span key={resource.id} className="inline-flex max-w-full items-center gap-2 rounded-full bg-background px-3 py-2 text-xs"><span className="max-w-48 truncate">{resource.title}</span><button type="button" onClick={() => setResources((items) => items.filter((item) => item.id !== resource.id))} className="text-muted-foreground hover:text-destructive" aria-label={`حذف ${resource.title}`}><X className="h-3.5 w-3.5" /></button></span>)}</div> : <p className="text-xs text-muted-foreground">لا توجد روابط إضافية في هذه المشاركة.</p>}
        </div>

        <Button type="button" onClick={createShare} disabled={!activeClient || projectIds.length === 0}><Link2 className="h-4 w-4" />إنشاء رابط بوابة تجريبي</Button>

        {generated ? <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium text-primary">الرابط جاهز للمشاركة اليدوية</p><p className="mt-1 text-xs text-muted-foreground">ينتهي في {generated.expiresAt ? formatDate(generated.expiresAt) : 'بدون انتهاء'}</p></div><Button type="button" variant="outline" size="sm" onClick={() => void copyLink(generated.token)}>{copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}{copied ? 'تم النسخ' : 'نسخ الرابط'}</Button></div><div className="mt-3 flex items-center gap-2"><Input dir="ltr" readOnly value={shareUrl(generated.token)} aria-label="رابط البوابة التجريبي" className="min-w-0" /><a href={shareUrl(generated.token)} target="_blank" rel="noreferrer" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-card px-3 text-xs font-semibold text-primary"><ExternalLink className="h-4 w-4" />فتح</a></div></div> : null}

        <div className="space-y-3 border-t border-border pt-4"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /><p className="font-medium">المشاركات الحالية والتفاعل</p></div>{workspaceShares.length === 0 ? <p className="text-sm text-muted-foreground">لم تُنشأ مشاركة لهذا الـWorkspace بعد.</p> : workspaceShares.map((share) => { const client = clients.find((item) => item.id === share.clientId); const interactions = interactionsFor(share.id); return <div key={share.id} className="rounded-2xl border border-border bg-muted/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{client?.name ?? 'عميل غير متاح'}</p><p className="mt-1 text-xs text-muted-foreground">{share.projectIds.length} مشروع · {share.role} · {share.status === 'active' ? 'نشط' : share.status === 'expired' ? 'منتهي' : 'مُبطل'}</p></div>{share.status === 'active' ? <Button type="button" variant="destructive" size="sm" onClick={() => revokeShare(share)}><Trash2 className="h-4 w-4" />إبطال الرابط</Button> : null}</div><div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>أنشئ في {formatDate(share.createdAt)}</span><a href={shareUrl(share.token)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary"><ExternalLink className="h-3.5 w-3.5" />فتح البوابة</a></div>{interactions.length ? <div className="mt-3 space-y-2">{interactions.map((interaction: ClientPortalInteraction) => <div key={interaction.id} className="rounded-xl bg-background px-3 py-2 text-xs"><span className="font-semibold">{interaction.kind === 'milestone-approval' ? 'موافقة على مرحلة' : interaction.kind === 'change-request' ? 'طلب تعديل' : 'تعليق'}</span><span className="mx-1 text-muted-foreground">·</span>{interaction.body}</div>)}</div> : <p className="mt-3 text-xs text-muted-foreground">لا يوجد تفاعل بعد.</p>}</div> })}</div>
      </div>
    </ContentCard>
  )
}
