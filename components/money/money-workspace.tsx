'use client'

import { ArrowDownLeft, ArrowUpRight, Archive, Banknote, CalendarDays, ChartNoAxesColumn, Plus, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ContentCard } from '@/components/ui/content-card'
import { useCommandCenter, type FinanceKind } from '@/lib/command-center-store'

const categoryOptions = ['بيت', 'أكل', 'تنقل', 'شغل', 'صحة', 'ترفيه', 'دخل', 'عام']

function formatAmount(value: number, currency = 'جنيه') {
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value)} ${currency}`
}

function currentLocalDate() {
  return new Date().toISOString().slice(0, 10)
}

export function MoneyWorkspace() {
  const { financeEntries, budget, projects, goals, addFinanceEntry, archiveFinanceEntry, updateBudget } = useCommandCenter()
  const [budgetDraft, setBudgetDraft] = useState(String(budget.monthlyLimit))
  const month = currentLocalDate().slice(0, 7)
  const monthEntries = financeEntries.filter((entry) => entry.localDate.startsWith(month))
  const expenses = monthEntries.filter((entry) => entry.kind === 'expense')
  const income = monthEntries.filter((entry) => entry.kind === 'income')
  const totalExpenses = expenses.reduce((sum, entry) => sum + entry.amount, 0)
  const totalIncome = income.reduce((sum, entry) => sum + entry.amount, 0)
  const remaining = budget.monthlyLimit - totalExpenses
  const budgetProgress = budget.monthlyLimit ? Math.min(100, Math.round((totalExpenses / budget.monthlyLimit) * 100)) : 0
  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>()
    expenses.forEach((entry) => totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount))
    return [...totals.entries()].sort((a, b) => b[1] - a[1])
  }, [expenses])

  function createEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    const amount = Number(form.get('amount') ?? 0)
    if (!title || !Number.isFinite(amount) || amount <= 0) return
    const projectId = String(form.get('projectId') ?? '')
    const goalId = String(form.get('goalId') ?? '')
    addFinanceEntry({
      title,
      amount: Math.round(amount),
      kind: String(form.get('kind') ?? 'expense') as FinanceKind,
      category: String(form.get('category') ?? 'عام'),
      localDate: String(form.get('localDate') ?? currentLocalDate()),
      note: String(form.get('note') ?? '').trim() || undefined,
      projectId: projectId || undefined,
      goalId: goalId || undefined,
    })
    event.currentTarget.reset()
  }

  function saveBudget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(budgetDraft)
    if (Number.isFinite(amount) && amount >= 0) updateBudget(amount)
  }

  return <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="مصروفات الشهر" value={formatAmount(totalExpenses, budget.currency)} icon={ArrowDownLeft} tone="warning" />
      <SummaryCard label="دخل الشهر" value={formatAmount(totalIncome, budget.currency)} icon={ArrowUpRight} tone="success" />
      <SummaryCard label="المتبقي من الميزانية" value={formatAmount(remaining, budget.currency)} icon={Wallet} tone={remaining < 0 ? 'danger' : 'primary'} />
      <SummaryCard label="عدد العمليات" value={monthEntries.length} icon={Banknote} tone="accent" />
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ContentCard className="lg:col-span-8" title="ميزانية الشهر" description="شوف إنفاقك الحقيقي مقارنة بالحد الذي حددته لنفسك.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-3xl font-semibold tracking-tight">{formatAmount(totalExpenses, budget.currency)}</p>
            <p className="mt-1 text-sm text-muted-foreground">من {formatAmount(budget.monthlyLimit, budget.currency)} — {budgetProgress}% مستخدم</p>
          </div>
          <form onSubmit={saveBudget} className="flex gap-2">
            <input aria-label="الميزانية الشهرية" type="number" min="0" value={budgetDraft} onChange={(event) => setBudgetDraft(event.target.value)} className="w-32 rounded-2xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit" className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">حفظ</button>
          </form>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${remaining < 0 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${budgetProgress}%` }} /></div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniStat label="دخل - مصروف" value={formatAmount(totalIncome - totalExpenses, budget.currency)} />
          <MiniStat label="أعلى تصنيف" value={categoryTotals[0]?.[0] ?? 'لا يوجد'} />
          <MiniStat label="متوسط العملية" value={formatAmount(monthEntries.length ? Math.round((totalExpenses + totalIncome) / monthEntries.length) : 0, budget.currency)} />
        </div>
      </ContentCard>

      <ContentCard title="مصروف حسب التصنيف" description="اقرأ الاتجاه العام قبل ما تدخل في التفاصيل.">
        <div className="space-y-3">
          {categoryTotals.map(([category, value]) => {
            const width = totalExpenses ? Math.round((value / totalExpenses) * 100) : 0
            return <div key={category}>
              <div className="mb-1 flex items-center justify-between text-sm"><span>{category}</span><span className="text-muted-foreground">{formatAmount(value, budget.currency)}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent-foreground/70" style={{ width: `${width}%` }} /></div>
            </div>
          })}
          {categoryTotals.length === 0 && <div className="rounded-2xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">سجّل أول مصروف علشان يظهر التحليل.</div>}
        </div>
      </ContentCard>
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ContentCard className="lg:col-span-5" title="عملية مالية جديدة" description="خلي التسجيل سريعًا، واربطه بمشروع أو هدف لو كان له سياق.">
        <form onSubmit={createEntry} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select name="kind" defaultValue="expense" className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="expense">مصروف</option><option value="income">دخل</option></select>
            <input name="amount" type="number" min="1" required className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="المبلغ" />
          </div>
          <input name="title" required className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="مثال: مشتريات البيت" />
          <div className="grid grid-cols-2 gap-2">
            <select name="category" defaultValue="عام" className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring">{categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select>
            <input name="localDate" type="date" defaultValue={currentLocalDate()} className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select name="projectId" defaultValue="" className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="">بدون مشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select>
            <select name="goalId" defaultValue="" className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="">بدون هدف</option>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select>
          </div>
          <input name="note" className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="ملاحظة اختيارية" />
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> تسجيل العملية</button>
        </form>
      </ContentCard>

      <ContentCard className="lg:col-span-7" title="آخر العمليات" description="كل العمليات التي سجلتها هذا الشهر، مع إمكانية الأرشفة بدل الحذف النهائي.">
        <div className="space-y-2">
          {monthEntries.slice(0, 8).map((entry) => <article key={entry.id} className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${entry.kind === 'income' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning-foreground'}`}>{entry.kind === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{entry.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{entry.localDate} · {entry.category}</p></div>
            <span className={`text-sm font-semibold ${entry.kind === 'income' ? 'text-success' : 'text-foreground'}`}>{entry.kind === 'income' ? '+' : '-'}{formatAmount(entry.amount, budget.currency)}</span>
            <button type="button" onClick={() => archiveFinanceEntry(entry.id)} aria-label="أرشفة العملية" className="rounded-full p-2 text-muted-foreground hover:bg-warning"><Archive className="h-4 w-4" /></button>
          </article>)}
          {monthEntries.length === 0 && <div className="rounded-2xl bg-muted px-4 py-10 text-center text-sm text-muted-foreground">لا توجد عمليات لهذا الشهر حتى الآن.</div>}
        </div>
      </ContentCard>
    </div>
  </div>
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Wallet; tone: 'warning' | 'success' | 'primary' | 'danger' | 'accent' }) {
  const toneClass = { warning: 'bg-warning/15 text-warning-foreground', success: 'bg-success/15 text-success', primary: 'bg-primary/15 text-primary', danger: 'bg-destructive/15 text-destructive', accent: 'bg-accent text-accent-foreground' }[tone]
  return <div className="rounded-3xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneClass}`}><Icon className="h-5 w-5" /></div></div></div>
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl bg-muted px-3 py-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>
}

void ChartNoAxesColumn
