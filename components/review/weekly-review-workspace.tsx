'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, CheckCircle2, CircleAlert, ClipboardCheck, Clapperboard, Flame, HeartPulse, Landmark, Link2, ListMusic, Save, Target, WalletCards } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { useCommandCenter } from '@/lib/command-center-store'

export function WeeklyReviewWorkspace() {
  const { tasks, habits, notes, goals, projects, financeEntries, religious, entertainment, weeklyReview, saveWeeklyReview } = useCommandCenter()
  const [wentWell, setWentWell] = useState(weeklyReview.wentWell)
  const [blockers, setBlockers] = useState(weeklyReview.blockers)
  const [nextGoal, setNextGoal] = useState(weeklyReview.nextGoal)

  useEffect(() => {
    setWentWell(weeklyReview.wentWell)
    setBlockers(weeklyReview.blockers)
    setNextGoal(weeklyReview.nextGoal)
  }, [weeklyReview.wentWell, weeklyReview.blockers, weeklyReview.nextGoal])

  const metrics = useMemo(() => {
    const doneTasks = tasks.filter((task) => task.status === 'done').length
    const openTasks = tasks.filter((task) => task.status !== 'done').length
    const doneHabits = habits.filter((habit) => habit.doneToday).length
    const prayerCount = religious.prayerLogs.filter((prayer) => prayer.status === 'done').length
    const prayerHistory = (religious.prayerHistory ?? []).filter((day) => day.localDate >= weeklyReview.weekStart && day.localDate <= weeklyReview.weekEnd)
    const prayerTotal = prayerHistory.reduce((sum, day) => sum + day.total, 0)
    const prayerCompleted = prayerHistory.reduce((sum, day) => sum + day.completed, 0)
    const prayerRate = prayerTotal ? Math.round((prayerCompleted / prayerTotal) * 100) : 0
    const fullPrayerDays = prayerHistory.filter((day) => day.completed >= day.total).length
    const completedEntertainment = entertainment.filter((item) => item.status === 'completed').length
    const weeklyFinance = financeEntries.filter((entry) => entry.localDate >= weeklyReview.weekStart && entry.localDate <= weeklyReview.weekEnd)
    const income = weeklyFinance.filter((entry) => entry.kind === 'income').reduce((sum, entry) => sum + entry.amount, 0)
    const expenses = weeklyFinance.filter((entry) => entry.kind === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
    const activeGoals = goals.filter((goal) => goal.status === 'active')
    const goalProgress = activeGoals.length ? Math.round(activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length) : 0
    const activeProjects = projects.filter((project) => project.status !== 'done')
    const listenedSurahs = religious.quran.listenedSurahNumbers?.length ?? 0
    const listenLaterSurahs = religious.quran.listenLater?.length ?? 0
    return { doneTasks, openTasks, doneHabits, prayerCount, prayerRate, fullPrayerDays, completedEntertainment, income, expenses, goalProgress, activeProjects, listenedSurahs, listenLaterSurahs }
  }, [tasks, habits, religious.prayerLogs, religious.prayerHistory, religious.quran.listenedSurahNumbers, religious.quran.listenLater, entertainment, financeEntries, goals, projects, weeklyReview.weekStart, weeklyReview.weekEnd])

  const context = useMemo(() => ({
    openTask: tasks.find((task) => task.status !== 'done'),
    focusHabit: habits.find((habit) => !habit.doneToday) ?? habits[0],
    activeProject: projects.find((project) => project.status !== 'done'),
    activeGoal: goals.find((goal) => goal.status === 'active'),
  }), [tasks, habits, projects, goals])
  const currency = (amount: number) => `${amount.toLocaleString('ar-EG')} ${'جنيه'}`
  const hasReflection = Boolean(wentWell.trim() || blockers.trim() || nextGoal.trim())
  const isDirty = wentWell !== weeklyReview.wentWell || blockers !== weeklyReview.blockers || nextGoal !== weeklyReview.nextGoal

  function save(status: 'draft' | 'completed') {
    saveWeeklyReview({ wentWell, blockers, nextGoal, status })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ReviewMetric icon={CheckCircle2} label="مهام مكتملة" value={metrics.doneTasks} tone="green" />
        <ReviewMetric icon={CircleAlert} label="تحتاج قرار" value={metrics.openTasks} tone="orange" />
        <ReviewMetric icon={Flame} label="عادات اليوم" value={metrics.doneHabits} tone="purple" />
        <ReviewMetric icon={ClipboardCheck} label="الصلوات المكتملة" value={metrics.prayerCount} tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <ContentCard className="lg:col-span-7" title="ماذا سار جيدًا؟" description="أشياء تستحق أن تلاحظها بدل ما تمر عليها">
          <div className="space-y-3">
            <ReviewLine text={`أكملت ${metrics.doneTasks} من مهامك الحالية.`} done />
            <ReviewLine text={`حافظت على ${metrics.doneHabits} عادات اليوم.`} done={metrics.doneHabits > 0} />
            <ReviewLine text={`${notes.filter((note) => note.pinned).length} ملاحظات مثبتة تقدر ترجع لها.`} done={notes.some((note) => note.pinned)} />
            <ReviewLine text={`أكملت ${metrics.prayerRate}% من الصلوات المسجلة هذا الأسبوع.`} done={metrics.prayerRate >= 80} />
            <ReviewLine text={`قرأت ${religious.quran.completedMinutes} من ${religious.quran.targetMinutes} دقيقة من الورد.`} done={religious.quran.completedMinutes >= religious.quran.targetMinutes} />
            <ReviewLine text={`متوسط تقدم أهدافك النشطة ${metrics.goalProgress}%.`} done={metrics.goalProgress > 0} />
          </div>
        </ContentCard>

        <ContentCard className="lg:col-span-5" title="ما الذي يحتاج قرارًا؟" description="لا تنقل كل شيء تلقائيًا للأسبوع القادم">
          <div className="space-y-3">
            <ReviewLine text={`${metrics.openTasks} مهام مفتوحة تحتاج ترتيبًا.`} />
            <ReviewLine text={`${metrics.activeProjects.length} مشاريع ما زالت قيد الحركة.`} />
            <ReviewLine text={metrics.expenses > metrics.income ? `مصروفات الأسبوع (${currency(metrics.expenses)}) أعلى من دخلك المسجل (${currency(metrics.income)}).` : `راجع مصروفات الأسبوع (${currency(metrics.expenses)}) قبل تثبيت الخطة القادمة.`} />
            <ReviewLine text={metrics.prayerRate < 80 ? `هناك ${metrics.fullPrayerDays} أيام مكتملة الصلاة من أصل الأيام المسجلة.` : 'ثبات الصلاة هذا الأسبوع جيد؛ حافظ على نفس الإيقاع.'} />
            <ReviewLine text={religious.quran.completedMinutes < religious.quran.targetMinutes ? 'الورد لم يكتمل بعد؛ اختر وقتًا محددًا قبل نهاية اليوم.' : 'الورد اليومي مكتمل.'} />
            <ReviewLine text="اختر عادة واحدة فقط لرفع الالتزام بها." />
          </div>
        </ContentCard>

        <ContentCard className="lg:col-span-12" title="لقطة الأسبوع" description="مؤشرات من الأقسام الجديدة تساعدك على رؤية الصورة كاملة.">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-8">
            <DomainMetric icon={WalletCards} label="دخل الأسبوع" value={currency(metrics.income)} />
            <DomainMetric icon={Landmark} label="مصروفات الأسبوع" value={currency(metrics.expenses)} />
            <DomainMetric icon={ClipboardCheck} label="صلوات الأسبوع" value={`${metrics.prayerRate}%`} />
            <DomainMetric icon={HeartPulse} label="الورد" value={`${religious.quran.completedMinutes}/${religious.quran.targetMinutes} د`} />
            <DomainMetric icon={Target} label="الحفظ" value={`${religious.quran.memorizationCompleted ?? 0}/${religious.quran.memorizationTarget ?? 0}`} />
            <DomainMetric icon={Clapperboard} label="الترفيه المكتمل" value={metrics.completedEntertainment} />
            <DomainMetric icon={BookOpen} label="سور استمعت لها" value={`${metrics.listenedSurahs} سورة`} />
            <DomainMetric icon={ListMusic} label="للسماع لاحقًا" value={`${metrics.listenLaterSurahs} سورة`} />
          </div>
        </ContentCard>

        <ContentCard className="lg:col-span-12" title="ارجع إلى السياق" description="المراجعة لا تعيش منفصلة عن يومك؛ افتح العنصر الذي يحتاج قرارًا وعدّل ما يلزم.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {context.openTask && <ContextShortcut href={`/tasks#task-${context.openTask.id}`} label="المهمة المفتوحة" value={context.openTask.title} />}
            {context.focusHabit && <ContextShortcut href={`/habits#${context.focusHabit.id}`} label="العادة التالية" value={context.focusHabit.title} />}
            {context.activeProject && <ContextShortcut href={`/projects#${context.activeProject.id}`} label="المشروع النشط" value={context.activeProject.title} />}
            {context.activeGoal && <ContextShortcut href={`/goals#${context.activeGoal.id}`} label="الهدف النشط" value={context.activeGoal.title} />}
            <ContextShortcut href="/religious" label="المساحة الدينية" value={`${metrics.prayerRate}% من الصلوات المسجلة`} />
            <ContextShortcut href="/money" label="المراجعة المالية" value={`${currency(metrics.expenses)} مصروفات الأسبوع`} />
          </div>
          {!context.openTask && !context.focusHabit && !context.activeProject && !context.activeGoal && <p className="rounded-2xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground">لا توجد عناصر مرتبطة تحتاج قرارًا الآن. يمكنك البدء من خطة اليوم أو مراجعة المساحتين الدينية والمالية.</p>}
        </ContentCard>

        <ContentCard className="lg:col-span-12" title="مراجعتك المكتوبة" description={`الأسبوع من ${weeklyReview.weekStart} إلى ${weeklyReview.weekEnd}. اكتب بصدق وباختصار؛ المراجعة لك أنت.`}>
          <div className="grid gap-4 lg:grid-cols-3">
            <ReflectionField label="ما الذي سار جيدًا؟" value={wentWell} onChange={setWentWell} placeholder="إنجاز أو عادة أو لحظة تستحق التقدير..." />
            <ReflectionField label="ما الذي عطّلك؟" value={blockers} onChange={setBlockers} placeholder="عائق، قرار مؤجل، أو شيء يحتاج تبسيطًا..." />
            <ReflectionField label="ما هدف الأسبوع القادم؟" value={nextGoal} onChange={setNextGoal} placeholder="خطوة واحدة واضحة يمكن تنفيذها..." />
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">{weeklyReview.status === 'completed' && !isDirty ? 'تم اعتماد مراجعة هذا الأسبوع.' : isDirty ? 'هناك نص غير محفوظ.' : hasReflection ? 'تم حفظ المسودة ويمكنك العودة إليها لاحقًا.' : 'ابدأ بكتابة أول سطر.'} {weeklyReview.updatedAt !== 'لم تُحفظ بعد' ? `آخر حفظ: ${weeklyReview.updatedAt}` : ''}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => save('draft')} className="flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-semibold hover:bg-muted"><Save className="h-4 w-4" /> حفظ كمسودة</button>
              <button type="button" onClick={() => save('completed')} className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"><CheckCircle2 className="h-4 w-4" /> اعتماد المراجعة</button>
            </div>
          </div>
        </ContentCard>

        <ContentCard className="lg:col-span-12 bg-surface-dark text-surface-dark-foreground" title="قرار الأسبوع القادم" description="اقتراح واضح وقابل للتعديل">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><p className="text-xl font-semibold">{nextGoal.trim() || 'حافظ على البساطة: مهمة عميقة واحدة كل صباح.'}</p><p className="mt-2 max-w-2xl text-sm leading-7 text-surface-dark-foreground/60">القرار يظل في مساحة المراجعة حتى تختار نقله إلى خطة اليوم بنفسك.</p></div>
            <Link href="/daily-plan" className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground">تعديل خطة اليوم <ArrowLeft className="h-4 w-4" /></Link>
          </div>
        </ContentCard>
      </div>
    </div>
  )
}

function ReviewMetric({ icon: Icon, label, value, tone }: { icon: typeof CheckCircle2; label: string; value: number; tone: 'green' | 'orange' | 'purple' | 'blue' }) {
  const tones = { green: 'bg-positive text-positive-foreground', orange: 'bg-[#fff0dc] text-[#c77b18]', purple: 'bg-[#ebe8ff] text-[#6f5fe6]', blue: 'bg-accent text-accent-foreground' }
  return <div className="rounded-3xl bg-card p-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></span><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>
}

function DomainMetric({ icon: Icon, label, value }: { icon: typeof WalletCards; label: string; value: string | number }) {
  return <div className="rounded-2xl bg-muted/70 p-3"><Icon className="h-4 w-4 text-primary" /><p className="mt-3 text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>
}

function ContextShortcut({ href, label, value }: { href: string; label: string; value: string }) {
  return <Link href={href} className="group rounded-2xl border border-border/70 bg-muted/70 p-3 transition-colors hover:border-primary/40 hover:bg-card"><span className="flex items-center gap-2 text-[11px] text-muted-foreground"><Link2 className="h-3.5 w-3.5 text-primary" />{label}</span><span className="mt-2 block truncate text-sm font-semibold group-hover:text-primary">{value}</span><span className="mt-1 block text-[10px] text-muted-foreground">فتح السياق</span></Link>
}

function ReflectionField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block space-y-2"><span className="text-sm font-semibold">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={5} maxLength={2400} className="w-full resize-none rounded-2xl border border-border bg-background px-3 py-3 text-sm leading-7 outline-none transition focus:border-primary" /></label>
}

function ReviewLine({ text, done = false }: { text: string; done?: boolean }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-muted/70 px-3 py-3 text-sm"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? 'bg-positive text-positive-foreground' : 'bg-warning text-warning-foreground'}`}>{done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}</span><span>{text}</span></div>
}
