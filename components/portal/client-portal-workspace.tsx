'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, FileText, MessageSquare, Send, ShieldCheck, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { useCommandCenter } from '@/lib/command-center-store'
import { canClientPortalRole, createClientPortalId, getActiveClientPortalShare, hasMilestoneApproval, persistClientPortalFallback, readClientPortalFallback, scopeClientPortalProjectIds, type ClientPortalAuditAction, type ClientPortalFallback, type ClientPortalInteraction } from '@/lib/client-portal-contracts'
import { readWorkspaceFallback, type Client } from '@/lib/workspace-types'

function money(amount: number, currency = 'جنيه') {
  return `${Math.round(amount).toLocaleString('ar-EG')} ${currency}`
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(date)
}

function interactionLabel(kind: ClientPortalInteraction['kind']) {
  if (kind === 'milestone-approval') return 'موافقة على مرحلة'
  if (kind === 'change-request') return 'طلب تعديل'
  return 'تعليق'
}

export function ClientPortalWorkspace({ token }: { token: string }) {
  const { projects, projectUpdates, projectPricings } = useCommandCenter()
  const [portal, setPortal] = useState<ClientPortalFallback>({ shares: [], interactions: [], auditEvents: [] })
  const [client, setClient] = useState<Client | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const share = useMemo(() => getActiveClientPortalShare(portal.shares, token), [portal.shares, token])

  useEffect(() => {
    const localPortal = readClientPortalFallback()
    const localShare = getActiveClientPortalShare(localPortal.shares, token)
    const fallback = readWorkspaceFallback()
    setPortal(localPortal)
    setClient(localShare ? Object.values(fallback.clientsByWorkspace).flat().find((item) => item.id === localShare.clientId) ?? null : null)
    setHydrated(true)
  }, [token])
  const [activeProjectId, setActiveProjectId] = useState('')
  const [message, setMessage] = useState('')
  const [messageKind, setMessageKind] = useState<'comment' | 'change-request'>('comment')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const sharedProjects = useMemo(() => {
    if (!share) return []
    const scopedIds = new Set(scopeClientPortalProjectIds(share.projectIds, share.clientId, projects))
    return projects.filter((project) => scopedIds.has(project.id))
  }, [projects, share])
  const selectedProject = sharedProjects.find((project) => project.id === activeProjectId) ?? sharedProjects[0]
  const sharedUpdates = useMemo(() => selectedProject ? projectUpdates.filter((update) => update.projectId === selectedProject.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [], [projectUpdates, selectedProject])
  const sharedPricing = useMemo(() => share?.includePricing && selectedProject ? projectPricings.filter((pricing) => pricing.projectId === selectedProject.id && pricing.status !== 'cancelled') : [], [projectPricings, selectedProject, share])
  const interactions = useMemo(() => share && selectedProject ? portal.interactions.filter((item) => item.shareId === share.id && item.projectId === selectedProject.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [], [portal.interactions, selectedProject, share])
  const canComment = share ? canClientPortalRole(share.role, 'comment') : false
  const canReview = share ? canClientPortalRole(share.role, 'review') : false

  function addInteraction(kind: ClientPortalInteraction['kind'], body: string, milestoneId?: string) {
    if (!share || !selectedProject) return
    const trimmed = body.trim()
    if (!trimmed) {
      setError('اكتب رسالة قصيرة قبل الإرسال.')
      return
    }
    if (kind === 'milestone-approval' && milestoneId && hasMilestoneApproval(portal.interactions, share.id, selectedProject.id, milestoneId)) {
      setNotice('تم تسجيل موافقتك على هذه المرحلة من قبل.')
      setError('')
      return
    }
    const createdAt = new Date().toISOString()
    const interaction: ClientPortalInteraction = { id: createClientPortalId('portal-interaction'), shareId: share.id, projectId: selectedProject.id, milestoneId, kind, body: trimmed, createdAt }
    const auditAction: ClientPortalAuditAction = kind === 'milestone-approval' ? 'milestone-approved' : kind === 'change-request' ? 'change-requested' : 'commented'
    const next = { ...portal, interactions: [interaction, ...portal.interactions], auditEvents: [{ id: createClientPortalId('portal-audit'), shareId: share.id, projectId: selectedProject.id, action: auditAction, detail: interactionLabel(kind), createdAt }, ...portal.auditEvents] }
    setPortal(next)
    persistClientPortalFallback(next)
    setMessage('')
    setNotice(kind === 'milestone-approval' ? 'تم تسجيل موافقتك التجريبية على المرحلة.' : kind === 'change-request' ? 'تم إرسال طلب التعديل إلى مساحة العمل التجريبية.' : 'تم إرسال تعليقك.')
    setError('')
  }

  if (!hydrated) return <main id="main-content" className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12"><ContentCard className="w-full text-center" title="جاري فتح البوابة" description="نتحقق من صلاحية الرابط ونطاق المشاريع المسموح به."><p role="status" aria-live="polite" aria-busy="true" className="text-sm text-muted-foreground">لحظات قليلة...</p></ContentCard></main>
  if (!share) return <PortalState title="الرابط غير صالح" description="لم يتم العثور على مشاركة بهذا الرمز." tone="warning" />
  if (share.status !== 'active') return <PortalState title={share.status === 'expired' ? 'انتهت صلاحية الرابط' : 'تم إبطال الرابط'} description="اطلب من مالك المشروع إنشاء رابط مشاركة جديد إذا كان الوصول ما يزال مطلوبًا." tone="warning" />
  if (!client) return <PortalState title="بيانات العميل غير متاحة" description="تعذر تحميل بيانات العميل من التخزين المحلي لهذه المشاركة." tone="warning" />

  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-6xl px-4 py-6 md:px-6" aria-labelledby="portal-title">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 rounded-3xl bg-card p-5 shadow-[0_8px_30px_rgba(23,23,26,0.03)]"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><ShieldCheck className="h-3.5 w-3.5" />بوابة مشاركة تجريبية</div><h1 id="portal-title" className="text-3xl font-medium tracking-tight">مرحبًا {client.name}</h1><p className="mt-2 text-sm text-muted-foreground">هذه الصفحة تعرض فقط المشاريع والمعلومات التي اختار مالك مساحة العمل مشاركتها معك.</p></div><div className="text-left text-xs text-muted-foreground"><p>دور الوصول: {share.role === 'client' ? 'عميل' : share.role === 'reviewer' ? 'مراجع' : 'قارئ'}</p>{share.expiresAt ? <p className="mt-1">ينتهي الرابط: {formatDate(share.expiresAt)}</p> : null}</div></header>

      {notice ? <div role="status" aria-live="polite" className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">{notice}</div> : null}
      {error ? <div role="alert" aria-live="assertive" className="mb-4 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {!canComment && !canReview ? <div role="status" className="mb-4 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">صلاحية هذا الرابط للقراءة فقط؛ التعليقات وطلبات التعديل والموافقات غير متاحة.</div> : null}

      {sharedProjects.length === 0 ? <ContentCard title="لا توجد مشاريع مشتركة" description="لم يحدد المالك مشروعًا متاحًا لهذا الرابط بعد."><p className="text-sm text-muted-foreground">اطلب من مالك مساحة العمل تحديث المشاركة بمشروع واحد على الأقل.</p></ContentCard> : <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <ContentCard title="المشاريع المشتركة" description="اختر مشروعًا لعرض تفاصيله"><div className="space-y-2">{sharedProjects.map((project) => <button type="button" key={project.id} onClick={() => setActiveProjectId(project.id)} className={`w-full rounded-2xl border px-4 py-3 text-right transition-colors ${selectedProject?.id === project.id ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/50'}`}><span className="block font-medium">{project.title}</span><span className="mt-1 block text-xs text-muted-foreground">{project.progress}% مكتمل{share.includeSchedule ? ` · ${project.dueLabel}` : ''}</span><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }} /></span></button>)}</div></ContentCard>

        {selectedProject ? <div className="space-y-5">
          <ContentCard title={selectedProject.title} description={selectedProject.description || 'بدون وصف إضافي'}><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">التقدم</p><p className="mt-2 text-xl font-semibold">{selectedProject.progress}%</p></div><div className="rounded-2xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">الحالة</p><p className="mt-2 text-sm font-semibold">{selectedProject.status === 'done' ? 'مكتمل' : selectedProject.status === 'in-progress' ? 'قيد التنفيذ' : 'مخطط'}</p></div>{share.includeSchedule ? <div className="rounded-2xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">الموعد</p><p className="mt-2 text-sm font-semibold">{selectedProject.dueLabel}</p></div> : null}</div>{selectedProject.nextStep ? <div className="mt-4 flex items-start gap-3 rounded-2xl bg-accent p-4"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" /><div><p className="text-xs text-accent-foreground/70">الخطوة التالية</p><p className="mt-1 font-semibold text-accent-foreground">{selectedProject.nextStep}</p></div></div> : null}</ContentCard>

          <ContentCard title="المراحل والموافقة" description="راجع المراحل وأرسل موافقة أو طلب تعديل. لا يغير ذلك حالة المشروع الداخلية تلقائيًا."><div className="space-y-3">{(selectedProject.milestones ?? []).length === 0 ? <p className="text-sm text-muted-foreground">لا توجد مراحل مشاركة لهذا المشروع.</p> : (selectedProject.milestones ?? []).map((milestone) => <div key={milestone.id} className="rounded-2xl border border-border bg-muted/20 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-medium">{milestone.status === 'done' ? <CheckCircle2 className="h-4 w-4 text-positive" /> : <Clock3 className="h-4 w-4 text-muted-foreground" />}{milestone.title}</div>{canReview ? <Button type="button" size="sm" variant="outline" disabled={hasMilestoneApproval(portal.interactions, share.id, selectedProject.id, milestone.id)} onClick={() => addInteraction('milestone-approval', `أوافق على المرحلة: ${milestone.title}`, milestone.id)}><CheckCircle2 className="h-4 w-4" />{hasMilestoneApproval(portal.interactions, share.id, selectedProject.id, milestone.id) ? 'تمت الموافقة' : 'موافقة تجريبية'}</Button> : null}</div></div>)}</div></ContentCard>

          {sharedUpdates.length || share.resources.length ? <ContentCard title="التحديثات والروابط" description="المعلومات التي اختار المالك مشاركتها"><div className="space-y-3">{sharedUpdates.map((update) => <div key={update.id} className="rounded-2xl bg-muted/60 p-3"><div className="flex items-start gap-2"><MessageSquare className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-sm leading-6">{update.body}</p><p className="mt-1 text-[11px] text-muted-foreground">{formatDate(update.createdAt)}</p></div></div></div>)}{share.resources.map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3 hover:bg-muted"><FileText className="mt-0.5 h-4 w-4 text-primary" /><span className="min-w-0 flex-1"><span className="block font-medium">{resource.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{resource.description || resource.url}</span></span><ExternalLink className="h-4 w-4 shrink-0" /></a>)}</div></ContentCard> : null}

          {share.includePricing && sharedPricing.length ? <ContentCard title="الدفعات المشتركة" description="دفعات اختار مالك المشروع إظهارها"><div className="space-y-2">{sharedPricing.map((pricing) => <div key={pricing.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/60 px-3 py-3"><WalletCards className="h-4 w-4 text-primary" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{pricing.title}</span><span className="mt-1 block text-xs text-muted-foreground">{pricing.expectedDate || 'بدون موعد'}</span></span><span className="text-sm font-semibold">{money(pricing.amount, pricing.currency)}</span></div>)}</div></ContentCard> : null}

          {canComment ? <ContentCard title="التعليق وطلب التعديل" description="أرسل ملاحظة إلى مساحة العمل حول المشروع المحدد."><div className="space-y-3"><Select value={messageKind} onChange={(event) => setMessageKind(event.target.value as typeof messageKind)} aria-label="نوع الرسالة"><option value="comment">تعليق</option><option value="change-request">طلب تعديل</option></Select><Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="اكتب تعليقك أو طلب التعديل هنا" aria-label="نص التعليق أو طلب التعديل" /><Button type="button" onClick={() => addInteraction(messageKind, message)} disabled={!message.trim()}><Send className="h-4 w-4" />إرسال</Button></div></ContentCard> : null}

          {interactions.length ? <ContentCard title="آخر تفاعلاتك" description="محفوظة محليًا ضمن هذه المشاركة التجريبية."><div className="space-y-2">{interactions.map((interaction) => <div key={interaction.id} className="rounded-2xl bg-muted/60 px-3 py-3 text-sm"><span className="font-semibold">{interactionLabel(interaction.kind)}</span><span className="mx-1 text-muted-foreground">·</span>{interaction.body}<p className="mt-1 text-[11px] text-muted-foreground">{formatDate(interaction.createdAt)}</p></div>)}</div></ContentCard> : null}
        </div> : null}
      </div>}

      <footer className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5" />هذه بوابة تجريبية محلية؛ لا تشارك كلمات مرور أو بيانات حساسة، ولا تعتبر الرابط بديلًا عن المصادقة الإنتاجية.</footer>
    </main>
  )
}

function PortalState({ title, description, tone }: { title: string; description: string; tone: 'warning' | 'danger' }) {
  return <main id="main-content" className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12" aria-labelledby="portal-error-title"><ContentCard className="w-full text-center" title={title} description={description}><div className={`mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-2xl ${tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-warning/15 text-warning-foreground'}`}><AlertTriangle className="h-6 w-6" /></div><p id="portal-error-title" className="mt-4 text-sm text-muted-foreground">ارجع إلى مالك مساحة العمل للحصول على رابط صالح.</p></ContentCard></main>
}
