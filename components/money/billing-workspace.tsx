'use client'

import { useEffect, useMemo, useState } from 'react'
import { Archive, BadgeDollarSign, CheckCircle2, FileCheck2, FileText, Plus, Printer, ReceiptText, Trash2 } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { featureFlags } from '@/lib/feature-flags'
import { calculateBillingTotals, makeBillingLine, type BillingLineItem, type Invoice, type Quote } from '@/lib/billing'
import { useCommandCenter } from '@/lib/command-center-store'
import { readWorkspaceFallback, type Client } from '@/lib/workspace-types'

const quoteStatusLabels: Record<Quote['status'], string> = { draft: 'مسودة', sent: 'مرسل', accepted: 'مقبول', rejected: 'مرفوض', expired: 'منتهي', cancelled: 'ملغى' }
const invoiceStatusLabels: Record<Invoice['status'], string> = { draft: 'مسودة', sent: 'مرسلة', due: 'مستحقة', paid: 'مدفوعة', overdue: 'متأخرة', cancelled: 'ملغاة' }
const statusClasses = 'rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground'

type DraftLine = Omit<BillingLineItem, 'id'>
type BillingTab = 'overview' | 'quotes' | 'invoices'
type DocumentKind = 'quote' | 'invoice'

function formatAmount(value: number, currency = 'جنيه') {
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Math.max(0, value))} ${currency}`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function clientLabel(clients: Client[], clientId?: string) {
  return clients.find((client) => client.id === clientId)?.name ?? 'بدون عميل'
}

export function BillingWorkspace() {
  const { projects, quotes, invoices, addQuote, addInvoice, updateQuote, updateInvoice, markInvoicePaid, archiveQuote, archiveInvoice } = useCommandCenter()
  const [tab, setTab] = useState<BillingTab>('overview')
  const [documentKind, setDocumentKind] = useState<DocumentKind>('invoice')
  const [clients, setClients] = useState<Client[]>([])
  const [formError, setFormError] = useState('')
  const [draftLines, setDraftLines] = useState<DraftLine[]>([{ description: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 }])

  useEffect(() => {
    setClients(Object.values(readWorkspaceFallback().clientsByWorkspace).flat())
  }, [])

  const activeInvoices = invoices.filter((invoice) => !invoice.archivedAt)
  const activeQuotes = quotes.filter((quote) => !quote.archivedAt)
  const totals = useMemo(() => {
    const quoteTotal = activeQuotes.reduce((sum, quote) => sum + calculateBillingTotals(quote.lines).total, 0)
    const invoiceTotal = activeInvoices.reduce((sum, invoice) => sum + calculateBillingTotals(invoice.lines).total, 0)
    const paidTotal = activeInvoices.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + calculateBillingTotals(invoice.lines).total, 0)
    const outstandingTotal = activeInvoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled').reduce((sum, invoice) => sum + calculateBillingTotals(invoice.lines).total, 0)
    const overdueCount = activeInvoices.filter((invoice) => invoice.status === 'overdue').length
    return { quoteTotal, invoiceTotal, paidTotal, outstandingTotal, overdueCount }
  }, [activeInvoices, activeQuotes])

  function updateDraftLine(index: number, patch: Partial<DraftLine>) {
    setDraftLines((lines) => lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line))
  }

  function submitDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    const currency = String(form.get('currency') ?? 'جنيه').trim() || 'جنيه'
    const lines = draftLines.map((line, index) => makeBillingLine({ ...line, id: `draft-line-${index + 1}` }))
    const validLines = lines.filter((line) => line.description.trim() && line.quantity > 0 && line.unitPrice >= 0)
    if (!title) {
      setFormError('اكتب عنوان المستند أولًا.')
      return
    }
    if (!validLines.length) {
      setFormError('أضف بندًا واحدًا على الأقل مع وصف ومبلغ صحيح.')
      return
    }
    const common = { title, currency, lines: validLines, projectId: String(form.get('projectId') ?? '') || undefined, clientId: String(form.get('clientId') ?? '') || undefined, notes: String(form.get('notes') ?? '').trim() || undefined }
    if (documentKind === 'quote') {
      addQuote({ ...common, status: String(form.get('status') ?? 'draft') as Quote['status'], issueDate: String(form.get('issueDate') ?? today()), validUntil: String(form.get('dueDate') ?? '') || undefined })
    } else {
      addInvoice({ ...common, status: String(form.get('status') ?? 'draft') as Invoice['status'], issueDate: String(form.get('issueDate') ?? today()), dueDate: String(form.get('dueDate') ?? '') || undefined })
    }
    setDraftLines([{ description: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 }])
    setFormError('')
    event.currentTarget.reset()
  }

  function exportDocument(kind: DocumentKind, document: Quote | Invoice) {
    const payload = JSON.stringify({ app: 'personal-command-center', kind, exportedAt: new Date().toISOString(), document }, null, 2)
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = `${document.number}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function printSummary() {
    window.print()
  }

  return <section className="space-y-4" aria-labelledby="billing-heading">
    <div className="flex flex-col gap-3 rounded-3xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"><BadgeDollarSign className="h-5 w-5" /></div><div><h2 id="billing-heading" className="text-base font-semibold">الفوترة والمحاسبة التجريبية</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">أنشئ عرضًا أو فاتورة وتابع التحصيل محليًا. لا يتم إرسال أو تحصيل أي مدفوعات فعلية.</p></div></div><Badge variant="warning">{featureFlags.experimental.billing ? 'نموذج محلي تجريبي — غير جاهز للإنتاج' : 'وضع محلي تجريبي — غير جاهز للإنتاج'}</Badge>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <BillingStat label="قيمة العروض" value={formatAmount(totals.quoteTotal)} icon={FileText} />
      <BillingStat label="قيمة الفواتير" value={formatAmount(totals.invoiceTotal)} icon={ReceiptText} />
      <BillingStat label="تم تحصيله" value={formatAmount(totals.paidTotal)} icon={CheckCircle2} tone="success" />
      <BillingStat label="قيد التحصيل" value={formatAmount(totals.outstandingTotal)} icon={BadgeDollarSign} tone="warning" />
      <BillingStat label="فواتير متأخرة" value={totals.overdueCount} icon={FileCheck2} tone={totals.overdueCount ? 'danger' : 'default'} />
    </div>

    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-muted/60 p-2" role="tablist" aria-label="قسم الفوترة">
      {([['overview', 'نظرة مالية'], ['quotes', 'عروض الأسعار'], ['invoices', 'الفواتير']] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${tab === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'}`}>{label}</button>)}
      <Button type="button" variant="outline" className="mr-auto rounded-xl" onClick={printSummary}><Printer className="h-4 w-4" /> طباعة الملخص</Button>
    </div>

    {(tab === 'overview' || tab === 'quotes' || tab === 'invoices') && <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <ContentCard className="xl:col-span-4" title="مستند جديد" description="سجّل عرض سعر أو فاتورة ببنود متعددة.">
        <form onSubmit={submitDocument} noValidate className="space-y-3">
          <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setDocumentKind('invoice')} className={`rounded-2xl border px-3 py-2 text-sm ${documentKind === 'invoice' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>فاتورة</button><button type="button" onClick={() => setDocumentKind('quote')} className={`rounded-2xl border px-3 py-2 text-sm ${documentKind === 'quote' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>عرض سعر</button></div>
          <Input name="title" required aria-label={documentKind === 'invoice' ? 'عنوان الفاتورة' : 'عنوان عرض السعر'} placeholder={documentKind === 'invoice' ? 'عنوان الفاتورة' : 'عنوان عرض السعر'} className="h-auto rounded-2xl px-4 py-3" />
          <div className="grid grid-cols-2 gap-2"><Input name="issueDate" type="date" defaultValue={today()} aria-label="تاريخ الإصدار" className="h-auto rounded-2xl px-3 py-3" /><Input name="dueDate" type="date" aria-label={documentKind === 'invoice' ? 'تاريخ الاستحقاق' : 'ساري حتى'} className="h-auto rounded-2xl px-3 py-3" /></div>
          <div className="grid grid-cols-2 gap-2"><Select name="status" defaultValue="draft" aria-label="الحالة" className="h-auto rounded-2xl py-3"><option value="draft">مسودة</option><option value="sent">مرسل</option>{documentKind === 'quote' ? <><option value="accepted">مقبول</option><option value="rejected">مرفوض</option><option value="expired">منتهي</option><option value="cancelled">ملغى</option></> : <><option value="due">مستحقة</option><option value="overdue">متأخرة</option><option value="cancelled">ملغاة</option></>}</Select><Input name="currency" defaultValue="جنيه" aria-label="العملة" className="h-auto rounded-2xl px-3 py-3" /></div>
          <div className="grid grid-cols-2 gap-2"><Select name="projectId" defaultValue="" aria-label="المشروع المرتبط" className="h-auto rounded-2xl py-3"><option value="">بدون مشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</Select><Select name="clientId" defaultValue="" aria-label="العميل المرتبط" className="h-auto rounded-2xl py-3"><option value="">بدون عميل</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select></div>
          <div className="space-y-2 rounded-2xl border border-border p-3"><div className="flex items-center justify-between"><p className="text-xs font-semibold">بنود المستند</p><Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={() => setDraftLines((lines) => [...lines, { description: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 }])}><Plus className="h-3.5 w-3.5" /> بند</Button></div>{draftLines.map((line, index) => <div key={`draft-${index}`} className="space-y-2 rounded-xl bg-muted/50 p-2"><Input value={line.description} onChange={(event) => updateDraftLine(index, { description: event.target.value })} aria-label={`وصف البند ${index + 1}`} placeholder="وصف البند" className="h-auto rounded-xl px-3 py-2" /><div className="grid grid-cols-3 gap-2"><Input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(event) => updateDraftLine(index, { quantity: Number(event.target.value) })} aria-label={`كمية البند ${index + 1}`} className="h-auto rounded-xl px-2 py-2" /><Input type="number" min="0" value={line.unitPrice} onChange={(event) => updateDraftLine(index, { unitPrice: Number(event.target.value) })} aria-label={`سعر البند ${index + 1}`} className="h-auto rounded-xl px-2 py-2" /><Input type="number" min="0" max="100" value={line.taxPercent} onChange={(event) => updateDraftLine(index, { taxPercent: Number(event.target.value) })} aria-label={`ضريبة البند ${index + 1}`} placeholder="ضريبة %" className="h-auto rounded-xl px-2 py-2" /></div>{draftLines.length > 1 && <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setDraftLines((lines) => lines.filter((_, lineIndex) => lineIndex !== index))}><Trash2 className="h-3.5 w-3.5" /> حذف البند</Button>}</div>)}</div>
          <textarea name="notes" aria-label="ملاحظات المستند" placeholder="ملاحظات اختيارية" className="min-h-20 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {formError && <p role="alert" className="text-xs text-destructive">{formError}</p>}
          <Button type="submit" className="h-auto w-full rounded-2xl px-4 py-3"><Plus className="h-4 w-4" /> حفظ {documentKind === 'invoice' ? 'الفاتورة' : 'العرض'}</Button>
        </form>
      </ContentCard>

      <ContentCard className="xl:col-span-8" title={tab === 'quotes' ? 'عروض الأسعار' : tab === 'invoices' ? 'الفواتير' : 'آخر مستندات الفوترة'} description="كل الأرقام تجريبية وقابلة للتعديل والأرشفة من دون حذف نهائي.">
        {tab !== 'invoices' && tab !== 'quotes' && <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-primary/5 p-3"><p className="text-xs text-muted-foreground">معدل التحصيل من الفواتير</p><p className="mt-1 text-xl font-semibold">{totals.invoiceTotal ? Math.round((totals.paidTotal / totals.invoiceTotal) * 100) : 0}%</p></div><div className="rounded-2xl bg-muted p-3"><p className="text-xs text-muted-foreground">المستندات النشطة</p><p className="mt-1 text-xl font-semibold">{activeQuotes.length + activeInvoices.length}</p></div></div>}
        <div className="space-y-3">{tab !== 'invoices' && activeQuotes.slice(0, tab === 'quotes' ? 20 : 3).map((quote) => <QuoteCard key={quote.id} quote={quote} clients={clients} projects={projects.map((project) => ({ id: project.id, title: project.title }))} onStatusChange={(status) => updateQuote(quote.id, { status })} onArchive={() => archiveQuote(quote.id)} onExport={() => exportDocument('quote', quote)} />)}{tab !== 'quotes' && activeInvoices.slice(0, tab === 'invoices' ? 20 : 3).map((invoice) => <InvoiceCard key={invoice.id} invoice={invoice} clients={clients} projects={projects.map((project) => ({ id: project.id, title: project.title }))} onStatusChange={(status) => updateInvoice(invoice.id, { status })} onPaid={() => markInvoicePaid(invoice.id)} onArchive={() => archiveInvoice(invoice.id)} onExport={() => exportDocument('invoice', invoice)} />)}{((tab === 'quotes' && !activeQuotes.length) || (tab === 'invoices' && !activeInvoices.length) || (tab === 'overview' && !activeQuotes.length && !activeInvoices.length)) && <EmptyState icon={ReceiptText} title="لا توجد مستندات بعد" description="أنشئ أول عرض أو فاتورة من النموذج لتبدأ متابعة المال المرتبط بعملك." />}</div>
      </ContentCard>
    </div>}
  </section>
}

function BillingStat({ label, value, icon: Icon, tone = 'default' }: { label: string; value: string | number; icon: typeof BadgeDollarSign; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const toneClass = { default: 'bg-primary/10 text-primary', success: 'bg-success/15 text-success', warning: 'bg-warning/15 text-warning-foreground', danger: 'bg-destructive/15 text-destructive' }[tone]
  return <div className="rounded-3xl border border-border bg-card p-3 shadow-sm"><div className="flex items-start justify-between gap-2"><div><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-2 text-sm font-semibold">{value}</p></div><div className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneClass}`}><Icon className="h-4 w-4" /></div></div></div>
}

function DocumentMeta({ projectId, clientId, projects, clients }: { projectId?: string; clientId?: string; projects: { id: string; title: string }[]; clients: Client[] }) {
  return <div className="mt-2 flex flex-wrap gap-2 text-[11px]"><span className={statusClasses}>المشروع: {projects.find((project) => project.id === projectId)?.title ?? 'غير مربوط'}</span><span className={statusClasses}>العميل: {clientLabel(clients, clientId)}</span></div>
}

function LineSummary({ lines, currency }: { lines: BillingLineItem[]; currency: string }) {
  const totals = calculateBillingTotals(lines)
  return <div className="mt-3 rounded-2xl bg-muted/60 p-3"><div className="space-y-1">{lines.slice(0, 3).map((line) => <div key={line.id} className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate">{line.description} × {line.quantity}</span><span className="shrink-0 text-muted-foreground">{formatAmount(Math.round(line.quantity * line.unitPrice), currency)}</span></div>)}</div><div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-sm font-semibold"><span>الإجمالي</span><span>{formatAmount(totals.total, currency)}</span></div>{(totals.discount || totals.tax) > 0 && <p className="mt-1 text-[11px] text-muted-foreground">خصم {formatAmount(totals.discount, currency)} · ضريبة {formatAmount(totals.tax, currency)}</p>}</div>
}

function QuoteCard({ quote, clients, projects, onStatusChange, onArchive, onExport }: { quote: Quote; clients: Client[]; projects: { id: string; title: string }[]; onStatusChange: (status: Quote['status']) => void; onArchive: () => void; onExport: () => void }) {
  return <article className="rounded-2xl border border-border p-4"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold">{quote.title}</h3><span className={statusClasses}>{quoteStatusLabels[quote.status]}</span></div><p className="mt-1 text-xs text-muted-foreground">{quote.number} · إصدار {quote.issueDate}{quote.validUntil ? ` · صالح حتى ${quote.validUntil}` : ''}</p><DocumentMeta projectId={quote.projectId} clientId={quote.clientId} projects={projects} clients={clients} /><LineSummary lines={quote.lines} currency={quote.currency} /></div><div className="flex shrink-0 flex-col items-end gap-1"><Select value={quote.status} aria-label="تغيير حالة العرض" className="h-8 min-w-24 rounded-xl px-2 text-[11px]" onChange={(event) => onStatusChange(event.target.value as Quote['status'])}><option value="draft">مسودة</option><option value="sent">مرسل</option><option value="accepted">مقبول</option><option value="rejected">مرفوض</option><option value="expired">منتهي</option><option value="cancelled">ملغى</option></Select><Button type="button" variant="ghost" size="icon-sm" aria-label="تصدير العرض" onClick={onExport}><FileCheck2 className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label="أرشفة العرض" onClick={onArchive}><Archive className="h-4 w-4" /></Button></div></div></article>
}

function InvoiceCard({ invoice, clients, projects, onStatusChange, onPaid, onArchive, onExport }: { invoice: Invoice; clients: Client[]; projects: { id: string; title: string }[]; onStatusChange: (status: Invoice['status']) => void; onPaid: () => void; onArchive: () => void; onExport: () => void }) {
  return <article className="rounded-2xl border border-border p-4"><div className="flex items-start gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${invoice.status === 'paid' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning-foreground'}`}><ReceiptText className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold">{invoice.title}</h3><span className={statusClasses}>{invoiceStatusLabels[invoice.status]}</span></div><p className="mt-1 text-xs text-muted-foreground">{invoice.number} · إصدار {invoice.issueDate}{invoice.dueDate ? ` · استحقاق ${invoice.dueDate}` : ''}</p><DocumentMeta projectId={invoice.projectId} clientId={invoice.clientId} projects={projects} clients={clients} /><LineSummary lines={invoice.lines} currency={invoice.currency} />{invoice.paidAt && <p className="mt-2 text-[11px] text-success">تم التحصيل في {invoice.paidAt.slice(0, 10)}</p>}</div><div className="flex shrink-0 flex-col items-end gap-1"><Select value={invoice.status} aria-label="تغيير حالة الفاتورة" className="h-8 min-w-24 rounded-xl px-2 text-[11px]" onChange={(event) => onStatusChange(event.target.value as Invoice['status'])}><option value="draft">مسودة</option><option value="sent">مرسلة</option><option value="due">مستحقة</option><option value="paid">مدفوعة</option><option value="overdue">متأخرة</option><option value="cancelled">ملغاة</option></Select>{invoice.status !== 'paid' && invoice.status !== 'cancelled' && <Button type="button" variant="ghost" size="icon-sm" aria-label="تسجيل تحصيل الفاتورة" onClick={onPaid}><CheckCircle2 className="h-4 w-4 text-success" /></Button>}<Button type="button" variant="ghost" size="icon-sm" aria-label="تصدير الفاتورة" onClick={onExport}><FileCheck2 className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label="أرشفة الفاتورة" onClick={onArchive}><Archive className="h-4 w-4" /></Button></div></div></article>
}
