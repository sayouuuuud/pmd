'use client'

import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Archive, Banknote, CalendarDays, ChartNoAxesColumn, Plus, RotateCcw, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { useCommandCenter, type FinanceKind, type FinanceRecurrence } from '@/lib/command-center-store'

const categoryOptions = ['بيت', 'أكل', 'تنقل', 'شغل', 'صحة', 'ترفيه', 'دخل', 'عام']

function formatAmount(value: number, currency = 'جنيه') {
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(value)} ${currency}`
}

function currentLocalDate() {
  return new Date().toISOString().slice(0, 10)
}

export function MoneyWorkspace() {
  const searchParams = useSearchParams()
  const { financeEntries, budget, projects, goals, addFinanceEntry, archiveFinanceEntry, updateBudget } = useCommandCenter()
  const [budgetDraft, setBudgetDraft] = useState(String(budget.monthlyLimit))
  const [selectedMonth, setSelectedMonth] = useState(currentLocalDate().slice(0, 7))

  useEffect(() => {
    const requestedMonth = searchParams.get('month')
    if (requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth)) {
      setSelectedMonth(requestedMonth)
    }
  }, [searchParams])
  const monthEntries = financeEntries.filter((entry) => entry.localDate.startsWith(selectedMonth))
  const recurringEntries = financeEntries.filter((entry) => entry.kind === 'expense' && entry.recurrence !== 'none')
  const expenses = monthEntries.filter((entry) => entry.kind === 'expense')
  const income = monthEntries.filter((entry) => entry.kind === 'income')
  const totalExpenses = expenses.reduce((sum, entry) => sum + entry.amount, 0)
  const totalIncome = income.reduce((sum, entry) => sum + entry.amount, 0)
  const remaining = budget.monthlyLimit - totalExpenses
  const budgetProgress = budget.monthlyLimit ? Math.min(100, Math.round((totalExpenses / budget.monthlyLimit) * 100)) : 0
  const monthOptions = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 6 }, (_, offset) => {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 15)
      const key = date.toISOString().slice(0, 7)
      return { key, label: new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(date) }
    })
  }, [])
  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>()
    expenses.forEach((entry) => totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount))
    const colors = ['#2563eb', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0f766e', '#64748b']
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([category, value], index) => ({ category, value, color: colors[index % colors.length], percentage: totalExpenses ? Math.round((value / totalExpenses) * 100) : 0 }))
  }, [expenses, totalExpenses])
  const monthlyComparison = useMemo(() => monthOptions.map(({ key, label }) => {
    const entries = financeEntries.filter((entry) => entry.localDate.startsWith(key))
    return { key, label, expense: entries.filter((entry) => entry.kind === 'expense').reduce((sum, entry) => sum + entry.amount, 0), income: entries.filter((entry) => entry.kind === 'income').reduce((sum, entry) => sum + entry.amount, 0) }
  }), [financeEntries, monthOptions])
  const maxMonthlyValue = Math.max(1, ...monthlyComparison.flatMap((month) => [month.expense, month.income]))
  const selectedMonthLabel = monthOptions.find((month) => month.key === selectedMonth)?.label ?? selectedMonth
  const selectedMonthIndex = monthOptions.findIndex((month) => month.key === selectedMonth)
  const previousMonthKey = selectedMonthIndex >= 0 ? monthOptions[selectedMonthIndex + 1]?.key : monthOptions[1]?.key
  const previousMonthExpenses = monthlyComparison.find((month) => month.key === previousMonthKey)?.expense ?? 0
  const expenseDelta = totalExpenses - previousMonthExpenses
  const budgetAlert = budgetProgress >= 100
    ? { label: 'تجاوزت سقف الميزانية', description: 'خفّف المصروفات القادمة أو راجع العمليات الأعلى تصنيفًا قبل نهاية الشهر.', className: 'border-destructive/40 bg-destructive/10 text-destructive' }
    : budgetProgress >= 80
      ? { label: 'اقتربت من سقف الميزانية', description: 'وصل استخدام الميزانية إلى 80% أو أكثر؛ راجع ما يمكن تأجيله هذا الشهر.', className: 'border-warning/40 bg-warning/10 text-warning-foreground' }
      : budgetProgress >= 50
        ? { label: 'نصف الميزانية مستخدم', description: 'أنت في منتصف السقف الشهري تقريبًا؛ استمر في تسجيل العمليات قبل اتخاذ قرار جديد.', className: 'border-primary/30 bg-primary/5 text-primary' }
        : null
  const donutBackground = categoryTotals.length ? `conic-gradient(${categoryTotals.map((item, index) => { const start = categoryTotals.slice(0, index).reduce((sum, current) => sum + current.percentage, 0); return `${item.color} ${start}% ${start + item.percentage}%` }).join(', ')})` : 'conic-gradient(hsl(var(--muted)) 0 100%)'

  function recurringDueLabel(entry: (typeof recurringEntries)[number]) {
    if (entry.recurrence === 'weekly') return 'يتكرر أسبوعيًا'
    const today = new Date(`${currentLocalDate()}T00:00:00`)
    const templateDay = Math.min(28, Math.max(1, Number(entry.localDate.slice(-2)) || 1))
    const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), templateDay)
    const dueDate = dueThisMonth < today ? new Date(today.getFullYear(), today.getMonth() + 1, templateDay) : dueThisMonth
    const days = Math.round((dueDate.getTime() - today.getTime()) / 86400000)
    if (days === 0) return 'مستحق اليوم'
    if (days <= 3) return `مستحق خلال ${days} أيام`
    return `موعده يوم ${templateDay} من كل شهر`
  }

  function recordRecurring(entry: (typeof recurringEntries)[number]) {
    addFinanceEntry({
      title: entry.title,
      amount: entry.amount,
      kind: 'expense',
      category: entry.category,
      localDate: currentLocalDate(),
      note: entry.note ? `نسخة اليوم · ${entry.note}` : 'نسخة اليوم من مصروف متكرر',
      projectId: entry.projectId,
      goalId: entry.goalId,
      recurrence: entry.recurrence,
    })
  }

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
      recurrence: String(form.get('recurrence') ?? 'none') as FinanceRecurrence,
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
      <SummaryCard label={`مصروفات ${selectedMonthLabel}`} value={formatAmount(totalExpenses, budget.currency)} icon={ArrowDownLeft} tone="warning" />
      <SummaryCard label={`دخل ${selectedMonthLabel}`} value={formatAmount(totalIncome, budget.currency)} icon={ArrowUpRight} tone="success" />
      <SummaryCard label="المتبقي من الميزانية" value={formatAmount(remaining, budget.currency)} icon={Wallet} tone={remaining < 0 ? 'danger' : 'primary'} />
      <SummaryCard label="عدد العمليات" value={monthEntries.length} icon={Banknote} tone="accent" />
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ContentCard className="lg:col-span-8" title="ميزانية الشهر" description="شوف إنفاقك الحقيقي مقارنة بالحد الذي حددته لنفسك.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="space-y-1 text-sm"><span className="block text-xs text-muted-foreground">الشهر المحلل</span><select aria-label="الشهر المحلل" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="rounded-2xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">{monthOptions.map((monthOption) => <option key={monthOption.key} value={monthOption.key}>{monthOption.label}</option>)}</select></label>
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
        {budgetAlert && <div className={`mt-4 rounded-2xl border px-4 py-3 ${budgetAlert.className}`} role="status"><p className="text-sm font-semibold">{budgetAlert.label}</p><p className="mt-1 text-xs leading-6 opacity-90">{budgetAlert.description}</p></div>}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniStat label="دخل - مصروف" value={formatAmount(totalIncome - totalExpenses, budget.currency)} />
          <MiniStat label="أعلى تصنيف" value={categoryTotals[0]?.category ?? 'لا يوجد'} />
          <MiniStat label="متوسط العملية" value={formatAmount(monthEntries.length ? Math.round((totalExpenses + totalIncome) / monthEntries.length) : 0, budget.currency)} />
        </div>
      </ContentCard>

      <ContentCard title="مصروف حسب التصنيف" description="اقرأ الاتجاه العام قبل ما تدخل في التفاصيل.">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full" style={{ background: donutBackground }} aria-label="مخطط توزيع المصروفات حسب التصنيف" role="img">
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-card text-center shadow-sm"><span className="text-xl font-semibold">{categoryTotals.length}</span><span className="text-[11px] text-muted-foreground">تصنيفات</span></div>
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            {categoryTotals.map((item) => <div key={item.category}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.category}</span><span className="text-muted-foreground">{item.percentage}% · {formatAmount(item.value, budget.currency)}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} /></div>
            </div>)}
            {categoryTotals.length === 0 && <EmptyState icon={ChartNoAxesColumn} title="لسه مفيش تحليل" description="سجّل أول مصروف علشان يظهر توزيع إنفاقك حسب التصنيف." />}
          </div>
        </div>
      </ContentCard>
    </div>

    <ContentCard title="مقارنة آخر ستة أشهر" description="قارن الدخل والمصروف بسرعة، واكتشف هل الاتجاه يتحسن أم يحتاج تدخلًا.">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm"><span className={`rounded-full px-3 py-1 ${expenseDelta > 0 ? 'bg-warning/15 text-warning-foreground' : 'bg-success/15 text-success'}`}>{expenseDelta > 0 ? 'المصروف أعلى من الشهر السابق' : 'المصروف أقل أو مساوي للشهر السابق'}</span><span className="text-muted-foreground">الفارق: {formatAmount(Math.abs(expenseDelta), budget.currency)}</span></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {monthlyComparison.map((monthData) => <div key={monthData.key} className={`rounded-2xl border p-3 ${monthData.key === selectedMonth ? 'border-primary bg-primary/5' : 'border-border bg-muted/40'}`}>
          <p className="truncate text-xs font-semibold">{monthData.label}</p>
          <div className="mt-3 flex h-28 items-end justify-center gap-2" aria-label={`${monthData.label}: دخل ${formatAmount(monthData.income, budget.currency)}، مصروف ${formatAmount(monthData.expense, budget.currency)}`}>
            <div className="w-3 rounded-t-full bg-success" style={{ height: `${Math.max(4, Math.round((monthData.income / maxMonthlyValue) * 100))}%` }} />
            <div className="w-3 rounded-t-full bg-warning" style={{ height: `${Math.max(4, Math.round((monthData.expense / maxMonthlyValue) * 100))}%` }} />
          </div>
          <div className="mt-2 space-y-1 text-[11px] text-muted-foreground"><p>دخل {formatAmount(monthData.income, budget.currency)}</p><p>مصروف {formatAmount(monthData.expense, budget.currency)}</p></div>
        </div>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-success" />الدخل</span><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-warning" />المصروف</span></div>
    </ContentCard>

    <ContentCard title="المصاريف المتكررة" description="احتفظ بالإيجار والاشتراكات في مكان واضح، وسجّل نسخة اليوم بضغطة واحدة.">
      <div className="space-y-2">
        {recurringEntries.map((entry) => {
          const dueSoon = entry.recurrence === 'monthly' && (recurringDueLabel(entry) === 'مستحق اليوم' || recurringDueLabel(entry).startsWith('مستحق خلال'))
          return <article key={entry.id} className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center ${dueSoon ? 'border-warning/50 bg-warning/10' : 'border-border bg-muted/40'}`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${dueSoon ? 'bg-warning/20 text-warning-foreground' : 'bg-primary/10 text-primary'}`}><RotateCcw className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{entry.title}</p><span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{entry.recurrence === 'monthly' ? 'شهري' : 'أسبوعي'}</span></div><p className="mt-1 text-xs text-muted-foreground">{formatAmount(entry.amount, budget.currency)} · {entry.category} · {recurringDueLabel(entry)}</p>{(entry.projectId || entry.goalId) && <div className="mt-2 flex flex-wrap gap-2 text-[11px]"><span className="text-muted-foreground">السياق:</span>{entry.projectId && <a href={`/projects#${entry.projectId}`} className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">مشروع: {projects.find((project) => project.id === entry.projectId)?.title ?? 'فتح المشروع'}</a>}{entry.goalId && <a href={`/goals#${entry.goalId}`} className="rounded-full bg-accent px-2 py-1 font-medium text-accent-foreground hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">هدف: {goals.find((goal) => goal.id === entry.goalId)?.title ?? 'فتح الهدف'}</a>}</div>}</div>
            {dueSoon && <span className="flex items-center gap-1 text-xs font-semibold text-warning-foreground"><AlertCircle className="h-3.5 w-3.5" />اقترب الموعد</span>}
            <button type="button" onClick={() => recordRecurring(entry)} className="rounded-2xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">سجّل اليوم</button>
          </article>
        })}
        {recurringEntries.length === 0 && <EmptyState icon={RotateCcw} title="لا توجد مصروفات متكررة" description="فعّل التكرار أثناء تسجيل الإيجار أو الاشتراك لتظهر العمليات هنا." />}
      </div>
    </ContentCard>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ContentCard className="lg:col-span-5" title="عملية مالية جديدة" description="خلي التسجيل سريعًا، واربطه بمشروع أو هدف لو كان له سياق.">
        <form onSubmit={createEntry} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select name="kind" defaultValue="expense" className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="expense">مصروف</option><option value="income">دخل</option></select>
            <input name="amount" type="number" min="1" required className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="المبلغ" />
          </div>
          <input name="title" required className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="مثال: مشتريات البيت" />
                    <div className="grid grid-cols-2 gap-2">
            <select name="category" defaultValue="عام" className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring">
{categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select>
            <input name="localDate" type="date" defaultValue={currentLocalDate()} className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <select name="recurrence" defaultValue="none" className="w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="none">بدون تكرار</option>
            <option value="monthly">مصروف شهري</option>
            <option value="weekly">مصروف أسبوعي</option>
          </select>
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
          {monthEntries.slice(0, 8).map((entry) => <article key={entry.id} id={`finance-${entry.id}`} className="scroll-mt-24 flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${entry.kind === 'income' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning-foreground'}`}>{entry.kind === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{entry.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{entry.localDate} · {entry.category}</p>{(entry.projectId || entry.goalId) && <div className="mt-2 flex flex-wrap gap-2 text-[11px]"><span className="text-muted-foreground">السياق:</span>{entry.projectId && <a href={`/projects#${entry.projectId}`} className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">مشروع: {projects.find((project) => project.id === entry.projectId)?.title ?? 'فتح المشروع'}</a>}{entry.goalId && <a href={`/goals#${entry.goalId}`} className="rounded-full bg-accent px-2 py-1 font-medium text-accent-foreground hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">هدف: {goals.find((goal) => goal.id === entry.goalId)?.title ?? 'فتح الهدف'}</a>}</div>}</div>
            <span className={`text-sm font-semibold ${entry.kind === 'income' ? 'text-success' : 'text-foreground'}`}>{entry.kind === 'income' ? '+' : '-'}{formatAmount(entry.amount, budget.currency)}</span>
            <button type="button" onClick={() => archiveFinanceEntry(entry.id)} aria-label="أرشفة العملية" className="rounded-full p-2 text-muted-foreground hover:bg-warning"><Archive className="h-4 w-4" /></button>
          </article>)}
          {monthEntries.length === 0 && <EmptyState icon={Wallet} title="لا توجد عمليات هذا الشهر" description="سجّل أول دخل أو مصروف علشان تتابع حركة الشهر." />}
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
