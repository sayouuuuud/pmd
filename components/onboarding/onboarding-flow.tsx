'use client'

import Link from 'next/link'
import { ArrowLeft, Check, CheckCircle2, MapPin, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { type QuranWirdMode, useCommandCenter } from '@/lib/command-center-store'

const steps = ['عن يومك', 'إيقاعك', 'هدفك', 'بدايتك']
const focusOptions = ['إنجاز أهم خطوة كل يوم', 'بناء عادات ثابتة', 'التوازن بين الشغل والحياة', 'الاهتمام بالورد والجانب الديني']
const habitOptions = ['قراءة يومية', 'مشي أو حركة', 'جلسة تركيز', 'ترتيب المساحة']
const wirdOptions: Array<{ value: QuranWirdMode; label: string; target: number; targetLabel: string }> = [
  { value: 'minutes', label: 'بالدقائق', target: 20, targetLabel: '20 دقيقة' },
  { value: 'pages', label: 'بالصفحات', target: 5, targetLabel: '5 صفحات' },
  { value: 'half-juz', label: 'نصف جزء', target: 10, targetLabel: 'نصف جزء · 10 صفحات' },
  { value: 'juz', label: 'جزء كامل', target: 20, targetLabel: 'جزء · 20 صفحة' },
]

export function OnboardingFlow() {
  const { profile, habits, completeOnboarding, addHabit, setWirdTarget } = useCommandCenter()
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [name, setName] = useState(profile.name === 'كابتن' ? '' : profile.name)
  const [city, setCity] = useState(profile.city)
  const [dayStart, setDayStart] = useState(profile.dayStart)
  const [workWindow, setWorkWindow] = useState(profile.workWindow)
  const [focusGoal, setFocusGoal] = useState(profile.focusGoal)
  const [selectedHabits, setSelectedHabits] = useState<string[]>([])
  const [wirdMode, setWirdMode] = useState<QuranWirdMode>('pages')
  const [wirdTarget, setWirdTargetValue] = useState(5)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (!name.trim() && profile.name !== 'كابتن') setName(profile.name)
    if (city === 'القاهرة' && profile.city !== 'القاهرة') setCity(profile.city)
    if (dayStart === '08:00' && profile.dayStart !== '08:00') setDayStart(profile.dayStart)
    if (workWindow === '09:00 - 17:00' && profile.workWindow !== '09:00 - 17:00') setWorkWindow(profile.workWindow)
    if (focusGoal === 'إنجاز أهم خطوة كل يوم' && profile.focusGoal !== 'إنجاز أهم خطوة كل يوم') setFocusGoal(profile.focusGoal)
  }, [city, dayStart, focusGoal, name, profile.city, profile.dayStart, profile.focusGoal, profile.name, profile.workWindow, workWindow])

  function next() {
    if (step === 0 && !name.trim()) {
      setNameError('اكتب اسمك أولًا.')
      return
    }
    setNameError('')
    if (step < steps.length - 1) {
      setStep((current) => current + 1)
      return
    }

    completeOnboarding({ name: name.trim() || 'كابتن', city, dayStart, workWindow, focusGoal })
    selectedHabits.forEach((title) => {
      if (!habits.some((habit) => habit.title === title)) addHabit({ title, target: 'يوميًا', frequency: 'daily', icon: 'عادة' })
    })
    setWirdTarget(wirdTarget, wirdMode)
    setCompleted(true)
  }

  function toggleStarterHabit(title: string) {
    setSelectedHabits((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title].slice(0, 3))
  }

  function changeWirdMode(mode: QuranWirdMode) {
    const option = wirdOptions.find((item) => item.value === mode) ?? wirdOptions[0]
    setWirdMode(option.value)
    setWirdTargetValue(option.target)
  }

  if (completed) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl items-center justify-center p-4 md:p-8">
        <section className="w-full rounded-[2rem] bg-card p-6 shadow-sm md:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-positive text-positive-foreground"><CheckCircle2 className="h-7 w-7" /></div>
          <p className="mt-6 text-sm text-muted-foreground">تم حفظ إعداداتك</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">مساحتك جاهزة يا {name.trim() || 'كابتن'}.</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">ابدأ بخطوة صغيرة اليوم. يمكنك تعديل الإيقاع والهدف من صفحة الحساب في أي وقت.</p>
          <div className="mt-6 rounded-2xl bg-muted/60 p-4 text-sm leading-7">
            <p className="font-semibold">خطوتك التالية المقترحة</p>
            <p className="mt-1 text-muted-foreground">افتح خطة اليوم، اختر أول عنصر مناسب لك، ثم عدّلها كما يناسب يومك. لا تحتاج إلى تجهيز كل الأقسام الآن.</p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <SummaryItem label="المدينة" value={city || 'لم تحدد بعد'} />
            <SummaryItem label="بداية اليوم" value={dayStart || 'مرنة'} />
            <SummaryItem label="الاتجاه" value={focusGoal || 'يوم أبسط وأكثر وضوحًا'} />
            <SummaryItem label="العادات" value={selectedHabits.length ? selectedHabits.join('، ') : 'تضيفها لاحقًا'} />
            <SummaryItem label="الورد" value={wirdOptions.find((option) => option.value === wirdMode)?.targetLabel ?? '5 صفحات'} />
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/daily-plan" className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">افتح خطة اليوم <ArrowLeft className="h-4 w-4" /></Link>
            <Link href="/" className="flex items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-semibold">اذهب للوحة التحكم</Link>
          </div>
        </section>
      </main>
    )
  }

  return <main className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl items-center justify-center p-4 md:p-8"><section className="w-full rounded-[2rem] bg-card p-6 shadow-sm md:p-10"><div className="flex items-start justify-between gap-4"><div><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Sparkles className="h-5 w-5" /></span><p className="mt-5 text-sm text-muted-foreground">نجهز مساحتك في دقيقتين</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">خلّي يومك شبهك.</h1></div><Link href="/" className="text-xs text-muted-foreground hover:text-foreground">تخطي الآن</Link></div><div className="mt-8 grid grid-cols-4 gap-2" aria-label="مراحل الإعداد">{steps.map((label, index) => <div key={label}><div className={`h-1.5 rounded-full ${index <= step ? 'bg-primary' : 'bg-muted'}`} /><p className={`mt-2 text-[11px] ${index === step ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</p></div>)}</div><div className="mt-10 min-h-64">{step === 0 && <div><h2 className="text-xl font-semibold">نبدأ بالأساسيات</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">المعلومات دي لتخصيص التحية والخطة اليومية فقط. في النهاية ستجد أمامك خطة يوم جاهزة تبدأ منها بدل شاشة فارغة.</p><div className="mt-7 grid gap-4 sm:grid-cols-2"><Field label="اسمك" value={name} onChange={(value) => { setName(value); if (nameError) setNameError('') }} placeholder="مثال: أحمد" required error={nameError} /><Field label="مدينتك" value={city} onChange={setCity} placeholder="القاهرة" icon={<MapPin className="h-4 w-4" />} /></div></div>}{step === 1 && <div><h2 className="text-xl font-semibold">إيقاع يومك</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">مش هنفرض جدول؛ بس هنفهم المساحة التي يمكن أن نبني عليها.</p><div className="mt-7 grid gap-4 sm:grid-cols-2"><Field label="بداية يومك" type="time" value={dayStart} onChange={setDayStart} /><Field label="وقت العمل أو الدراسة" value={workWindow} onChange={setWorkWindow} placeholder="09:00 - 17:00" /></div></div>}{step === 2 && <div><h2 className="text-xl font-semibold">ما أهم اتجاه الآن؟</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">اختيار واحد يساعدنا نعرض اقتراحات أوضح، ويمكن تغييره في أي وقت.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{focusOptions.map((goal) => <Button key={goal} type="button" variant="outline" onClick={() => setFocusGoal(goal)} aria-pressed={focusGoal === goal} className={`h-auto justify-start rounded-2xl p-4 text-right text-sm ${focusGoal === goal ? 'border-primary bg-accent font-semibold' : 'border-border/70 bg-muted/50 hover:bg-card'}`}>{goal}</Button>)}</div></div>}{step === 3 && <div><h2 className="text-xl font-semibold">نبدأ بعادة وورد مناسبين</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">اختيارات بسيطة لتجهيز أول يوم. يمكنك تخطي العادات أو تعديل كل ذلك لاحقًا من المساحات المتخصصة.</p><div className="mt-7"><p className="text-sm font-semibold">اختر حتى 3 عادات</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{habitOptions.map((habit) => <Button key={habit} type="button" variant="outline" onClick={() => toggleStarterHabit(habit)} aria-pressed={selectedHabits.includes(habit)} className={`h-auto justify-start rounded-2xl p-4 text-right text-sm ${selectedHabits.includes(habit) ? 'border-primary bg-accent font-semibold' : 'border-border/70 bg-muted/50 hover:bg-card'}`}>{habit}</Button>)}</div></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">نوع الورد<Select aria-label="نوع الورد في الإعداد الأولي" value={wirdMode} onChange={(event) => changeWirdMode(event.currentTarget.value as QuranWirdMode)} className="mt-2 h-12 w-full rounded-2xl px-4 text-sm">{wirdOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label><label className="block text-sm font-medium">هدف الورد<Select aria-label="هدف الورد في الإعداد الأولي" value={wirdTarget} onChange={(event) => setWirdTargetValue(Number(event.currentTarget.value))} className="mt-2 h-12 w-full rounded-2xl px-4 text-sm"><option value={wirdTarget}>{wirdOptions.find((option) => option.value === wirdMode)?.targetLabel ?? '5 صفحات'}</option></Select></label></div></div>}</div><div className="mt-8 flex items-center justify-between gap-3"><Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="rounded-full px-4 py-3 text-sm text-muted-foreground disabled:invisible">رجوع</Button><Button type="button" variant="default" onClick={next} className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">{step === steps.length - 1 ? <><Check className="h-4 w-4" /> ابدأ مساحتي</> : <>التالي <ArrowLeft className="h-4 w-4" /></>}</Button></div></section></main>
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-muted/70 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold leading-6">{value}</p></div>
}

function Field({ label, value, onChange, placeholder, type = 'text', icon, required = false, error = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; icon?: React.ReactNode; required?: boolean; error?: string }) { return <label className="block text-sm font-medium">{label}{required && <span className="mr-1 text-destructive" aria-hidden="true">*</span>}<span className="relative mt-2 block">{icon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}<Input autoComplete="off" required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? 'onboarding-name-error' : undefined} className={`h-12 rounded-2xl px-4 text-sm ${icon ? 'pr-10' : ''}`} /></span>{error && <span id="onboarding-name-error" role="alert" className="mt-2 block text-xs text-destructive">{error}</span>}</label> }
