'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, BookHeart, CalendarCheck2, Check, CircleDot, Clock3, Flame, ListPlus, NotebookPen, Repeat, Sparkles, X } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { TopNav } from '@/components/layout/top-nav'
import { useCommandCenter } from '@/lib/command-center-store'

function formatDate() {
  return new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', calendar: 'gregory' }).format(new Date())
}

export function DashboardHome() {
  const { profile, tasks, notes, habits, planItems, financeEntries, budget, religious, toggleTask, togglePrayer } = useCommandCenter()
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([])
  const doneTasks = tasks.filter((task) => task.status === 'done').length
  const doneHabits = habits.filter((habit) => habit.doneToday).length
  const completedPlan = planItems.filter((item) => item.status === 'done').length
  const upcomingPlan = planItems.filter((item) => item.status !== 'done').slice(0, 4)
  const todayTasks = tasks.filter((task) => task.dueLabel === 'النهاردة').slice(0, 4)
  const dashboardNotes = [...notes.filter((note) => note.pinned), ...notes.filter((note) => !note.pinned)].slice(0, 3)
  const maxStreak = habits.length > 0 ? Math.max(...habits.map((habit) => habit.streak)) : 0
  const completedPrayers = religious.prayerLogs.filter((prayer) => prayer.status === 'done').length
  const prayerPercent = Math.round((completedPrayers / Math.max(religious.prayerLogs.length, 1)) * 100)
  const nextPrayer = religious.prayerLogs.find((prayer) => prayer.status === 'pending')
  const wirdPercent = Math.min(100, Math.round((religious.quran.completedMinutes / Math.max(religious.quran.targetMinutes, 1)) * 100))
  const overdueTasks = tasks.filter((task) => task.status !== 'done' && /متأخر|أمس|أول أمس/.test(task.dueLabel))
  const currentMonth = new Intl.DateTimeFormat('en-CA').format(new Date()).slice(0, 7)
  const monthlyExpenses = financeEntries.filter((entry) => entry.kind === 'expense' && entry.localDate.startsWith(currentMonth)).reduce((sum, entry) => sum + entry.amount, 0)
  const strugglingHabit = habits.find((habit) => !habit.doneToday && habit.streak <= 3)
  const suggestions: PersonalSuggestion[] = [
    ...(overdueTasks.length > 0 ? [{ id: 'overdue-tasks', title: 'انقل المهام المتأخرة إلى خطة واقعية', body: `لديك ${overdueTasks.length} ${overdueTasks.length === 1 ? 'مهمة متأخرة' : 'مهام متأخرة'}؛ اختر موعدًا جديدًا بدل تركها معلّقة.`, href: '/tasks' }] : []),
    ...(monthlyExpenses > budget.monthlyLimit ? [{ id: 'budget-exceeded', title: 'راجع المصروفات قبل إضافة التزامات جديدة', body: `مصروفات الشهر وصلت إلى ${monthlyExpenses.toLocaleString('ar-EG')} ${budget.currency}، متجاوزة حد الميزانية.`, href: '/money' }] : []),
    ...(strugglingHabit ? [{ id: 'struggling-habit', title: 'خفف عادة متعثرة بدل إلغائها', body: `جرّب تصغير هدف «${strugglingHabit.title}» اليوم إلى خطوة قصيرة تحافظ على الاستمرارية.`, href: '/habits' }] : []),
  ].filter((suggestion) => !dismissedSuggestions.includes(suggestion.id))

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      <TopNav />
      <div className="mt-8"><div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{formatDate()}</span><span className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">نظامك الشخصي</span></div></div>
      <div className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">صباح الخير يا {profile.name}</p><h1 className="mt-1 text-4xl font-semibold tracking-tight">يومك واضح، خطوة خطوة.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">خطة اليوم بتجمع أهم ما تحتاجه من غير ما تشتتك بين أقسام كثيرة.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/onboarding" className="flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-xs font-semibold">تعديل الإيقاع</Link><Link href="/review" className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"><CalendarCheck2 className="h-4 w-4" /> مراجعة الأسبوع</Link><Link href="/daily-plan" className="flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-xs font-semibold"><ListPlus className="h-4 w-4" /> خطة اليوم</Link></div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="إنجاز المهام" value={`${doneTasks}/${tasks.length}`} detail={`${tasks.filter((task) => task.status !== 'done').length} متبقية`} tone="blue" />
        <SummaryCard label="خطة اليوم" value={`${completedPlan}/${planItems.length}`} detail="عناصر مكتملة" tone="green" />
        <SummaryCard label="العادات" value={`${doneHabits}/${habits.length}`} detail="اليوم" tone="purple" />
        <SummaryCard label="أعلى Streak" value={habits.length > 0 ? `${maxStreak}` : '—'} detail={habits.length > 0 ? 'يوم متواصل' : 'أضف عادة'} tone="orange" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <ContentCard className="lg:col-span-7" title="خطة اليوم" description="العناصر القادمة مرتبة حسب وقتها وأولويتها" action={<Link href="/daily-plan" className="text-xs font-semibold text-primary">فتح الخطة</Link>}>
          <div className="space-y-2">
            {upcomingPlan.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-muted/70 px-3 py-3"><span className="w-12 text-xs font-semibold text-muted-foreground">{item.time}</span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-primary"><PlanIcon kind={item.kind} /></span><span className="flex-1 text-sm font-medium">{item.title}</span><span className="h-2 w-2 rounded-full bg-primary" /></div>)}
            {upcomingPlan.length === 0 && (planItems.length === 0 ? <div className="rounded-2xl bg-muted/70 px-4 py-7 text-center"><p className="text-sm font-semibold">ابدأ بخطوة واحدة اليوم</p><p className="mt-1 text-xs leading-5 text-muted-foreground">أضف أول مهمة إلى خطة اليوم، ثم عد هنا لمتابعة إيقاعك.</p><Link href="/daily-plan" className="mt-3 inline-flex rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">فتح خطة اليوم</Link></div> : <p className="py-8 text-center text-sm text-muted-foreground">خلصت خطة اليوم. ممتاز.</p>)}
          </div>
        </ContentCard>

        <ContentCard className="lg:col-span-5" title="مهام النهاردة" description="أهم 4 عناصر تحتاج انتباهك" action={<Link href="/tasks" className="text-xs font-semibold text-primary">كل المهام</Link>}>
          <div className="space-y-2">
            {todayTasks.map((task) => <button key={task.id} type="button" onClick={() => toggleTask(task.id)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-right transition-colors hover:bg-muted"><span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${task.status === 'done' ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{task.status === 'done' && <Check className="h-3.5 w-3.5" />}</span><span className={`flex-1 text-sm ${task.status === 'done' ? 'text-muted-foreground line-through' : 'font-medium'}`}>{task.title}</span><span className={`h-2 w-2 rounded-full ${task.priority === 'high' ? 'bg-warning-foreground' : task.priority === 'medium' ? 'bg-primary' : 'bg-accent-foreground'}`} /></button>)}
            {todayTasks.length === 0 && <div className="rounded-2xl bg-muted/70 px-4 py-5 text-center"><p className="text-sm font-semibold">لا توجد مهام لليوم بعد</p><p className="mt-1 text-xs leading-5 text-muted-foreground">التقط فكرة سريعة أو أضف مهمة واحدة فقط لتبدأ.</p><Link href="/tasks" className="mt-3 inline-flex rounded-full bg-card px-3 py-2 text-xs font-semibold text-primary">إضافة مهمة</Link></div>}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-accent px-3.5 py-3 text-xs"><span className="text-accent-foreground">التركيز التالي</span><span className="font-semibold text-accent-foreground">{tasks.find((task) => task.status !== 'done')?.title ?? 'استمتع بوقتك'}</span></div>
        </ContentCard>

        <ContentCard className="lg:col-span-4" title="العادات" description="استمرارية صغيرة كل يوم"><div className="space-y-3">{habits.length > 0 ? habits.slice(0, 4).map((habit) => <div key={habit.id} className="flex items-center gap-3"><span className={`flex h-8 w-8 items-center justify-center rounded-full ${habit.doneToday ? 'bg-positive text-positive-foreground' : 'bg-muted text-muted-foreground'}`}><Check className="h-4 w-4" /></span><span className="flex-1 text-sm">{habit.title}</span><span className="flex items-center gap-1 text-xs text-muted-foreground"><Flame className="h-3.5 w-3.5 text-warning-foreground" />{habit.streak}</span></div>) : <div className="rounded-2xl bg-muted/70 px-4 py-5 text-center"><p className="text-sm font-semibold">عادة واحدة تكفي للبداية</p><p className="mt-1 text-xs leading-5 text-muted-foreground">اختر سلوكًا صغيرًا تريده أن يصبح أسهل مع الوقت.</p><Link href="/habits" className="mt-3 inline-flex rounded-full bg-card px-3 py-2 text-xs font-semibold text-primary">إضافة عادة</Link></div>}</div><Link href="/habits" className="mt-5 flex items-center justify-between rounded-2xl bg-muted px-3 py-3 text-xs font-semibold">إدارة العادات <ArrowLeft className="h-4 w-4" /></Link></ContentCard>
        <ContentCard className="lg:col-span-4" title="آخر الملاحظات" description="أفكارك في مكان واحد"><div className="space-y-3">{dashboardNotes.length > 0 ? dashboardNotes.map((note) => <Link href="/notes" key={note.id} className="block rounded-2xl bg-muted/70 p-3 transition-colors hover:bg-accent"><div className="flex items-center gap-2"><NotebookPen className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">{note.title}</p></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{note.body}</p></Link>) : <div className="rounded-2xl bg-muted/70 px-4 py-5 text-center"><p className="text-sm font-semibold">مساحة لأفكارك القادمة</p><p className="mt-1 text-xs leading-5 text-muted-foreground">اكتب ملاحظة قصيرة الآن، وستظهر هنا لتبقى قريبة من يومك.</p><Link href="/notes" className="mt-3 inline-flex rounded-full bg-card px-3 py-2 text-xs font-semibold text-primary">التقاط ملاحظة</Link></div>}</div></ContentCard>
        <ContentCard className="lg:col-span-4 bg-surface-dark text-surface-dark-foreground" title="اقتراح اليوم" description="اقتراح بسيط قابل للتعديل"><div className="flex items-start gap-3"><Sparkles className="mt-1 h-5 w-5 text-primary" /><p className="text-sm leading-7 text-surface-dark-foreground/80">ابدأ بالمهمة التي تحتاج تركيزًا قبل فتح الإشعارات. لديك مساحة جيدة بين الخطة الحالية والصلاة القادمة.</p></div><div className="mt-5 flex items-center gap-2 text-xs text-surface-dark-foreground/60"><Clock3 className="h-4 w-4" /> اقتراح مبني على خطة اليوم</div></ContentCard>

        <ContentCard className="lg:col-span-6" title="الصلوات" description={`${completedPrayers} من ${religious.prayerLogs.length} صلوات مكتملة`} action={<Link href="/religious#prayer-tracker" className="text-xs font-semibold text-primary">{prayerPercent}%</Link>}>
          <div className="rounded-2xl bg-accent px-3.5 py-3"><p className="text-xs text-accent-foreground">الصلاة القادمة</p><p className="mt-1 text-sm font-semibold text-accent-foreground">{nextPrayer ? `${nextPrayer.name} · ${nextPrayer.time}` : 'أكملت صلوات اليوم'}</p></div>
          <div className="mt-4 grid grid-cols-5 gap-2">{religious.prayerLogs.map((prayer) => <button key={prayer.id} type="button" aria-pressed={prayer.status === 'done'} onClick={() => togglePrayer(prayer.id)} className="flex min-w-0 flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center transition-colors hover:bg-muted"><span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${prayer.status === 'done' ? 'border-primary bg-primary text-primary-foreground' : prayer.status === 'missed' ? 'border-destructive text-destructive' : 'border-border text-muted-foreground'}`}>{prayer.status === 'done' ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px]">{prayer.time}</span>}</span><span className="truncate text-[10px] text-muted-foreground">{prayer.name}</span></button>)}</div>
          <Link href="/religious#prayer-tracker" className="mt-3 flex items-center justify-between rounded-2xl bg-muted px-3 py-3 text-xs font-semibold">فتح متابعة الصلاة <ArrowLeft className="h-4 w-4" /></Link>
        </ContentCard>

        <ContentCard className="lg:col-span-6" title="ورد القرآن" description="تقدم اليوم محفوظ وقابل للمتابعة" action={<Link href="/religious#quran-progress" className="text-xs font-semibold text-primary">{wirdPercent}%</Link>}>
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><BookHeart className="h-5 w-5" /></span><div><p className="text-sm font-semibold">{religious.quran.reference}</p><p className="mt-1 text-xs text-muted-foreground">{religious.quran.completedMinutes} من {religious.quran.targetMinutes} دقيقة</p></div></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${wirdPercent}%` }} /></div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{wirdPercent}% مكتمل</span><span>المتبقي {Math.max(0, religious.quran.targetMinutes - religious.quran.completedMinutes)} د</span></div>
          <Link href="/religious#quran-progress" className="mt-3 flex items-center justify-between rounded-2xl bg-muted px-3 py-3 text-xs font-semibold">متابعة الورد <ArrowLeft className="h-4 w-4" /></Link>
        </ContentCard>

        <ContentCard className="lg:col-span-12" title="اقتراحات تناسب وضعك الآن" description="إشارات صغيرة قابلة للرفض، ولا تغيّر خطتك تلقائيًا">
          {suggestions.length > 0 ? <div className="grid gap-3 md:grid-cols-3">{suggestions.map((suggestion) => <div key={suggestion.id} className="rounded-2xl border border-border/70 bg-muted/40 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{suggestion.title}</p><p className="mt-2 text-xs leading-6 text-muted-foreground">{suggestion.body}</p></div><button type="button" aria-label={`رفض الاقتراح: ${suggestion.title}`} onClick={() => setDismissedSuggestions((current) => [...current, suggestion.id])} className="rounded-full p-1.5 text-muted-foreground transition hover:bg-card hover:text-foreground"><X className="h-4 w-4" /></button></div><Link href={suggestion.href} className="mt-4 inline-flex items-center gap-2 rounded-full bg-card px-3 py-2 text-xs font-semibold text-primary">اتخاذ خطوة <ArrowLeft className="h-3.5 w-3.5" /></Link></div>)}</div> : <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">لا توجد اقتراحات ملحّة الآن. استمر على إيقاعك الحالي.</div>}
        </ContentCard>
      </div>
    </main>
  )
}

type PersonalSuggestion = { id: string; title: string; body: string; href: string }

function SummaryCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'blue' | 'green' | 'purple' | 'orange' }) {
  const tones = { blue: 'bg-accent text-accent-foreground', green: 'bg-positive text-positive-foreground', purple: 'bg-[#ebe8ff] text-[#6f5fe6]', orange: 'bg-[#fff0dc] text-[#c77b18]' }
  return <div className="rounded-3xl bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><div className="mt-3 flex items-end justify-between gap-2"><span className="text-2xl font-semibold">{value}</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${tones[tone]}`}>{detail}</span></div></div>
}

function PlanIcon({ kind }: { kind: string }) {
  if (kind === 'prayer') return <span className="text-xs">ص</span>
  if (kind === 'habit') return <Repeat className="h-4 w-4" />
  if (kind === 'quran') return <BookHeart className="h-4 w-4" />
  if (kind === 'rest') return <Clock3 className="h-4 w-4" />
  return <CircleDot className="h-4 w-4" />
}
