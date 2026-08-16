'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Check, Clock3, Compass, LoaderCircle, MapPin, Moon, Play, RefreshCw, Sunrise, SunMedium, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { useCommandCenter } from '@/lib/command-center-store'

const prayerIcons: Record<string, typeof Sunrise> = {
  الفجر: Sunrise,
  الظهر: SunMedium,
  العصر: SunMedium,
  المغرب: Moon,
  العشاء: Moon,
}

const calculationMethods: Record<string, string> = {
  مخصص: '5',
  'الهيئة المصرية العامة للمساحة': '5',
  'رابطة العالم الإسلامي': '3',
}

type TimingState = 'idle' | 'loading' | 'success' | 'error'

type TimingsResponse = {
  source: string
  date: string | null
  hijriDate: string | null
  timings: Partial<Record<'الفجر' | 'الظهر' | 'العصر' | 'المغرب' | 'العشاء', string>>
  error?: string
}

type QuranResponse = {
  source: string
  surah?: { number?: number; name?: string; numberOfAyahs?: number }
  ayahs?: Array<{ number?: number; text?: string }>
  error?: string
}

type Reciter = { id: number; name: string; read?: string; server: string; surahTotal?: number; surahList?: string }

type RecitersResponse = { source: string; reciters?: Reciter[]; error?: string }

export function ReligiousWorkspace() {
  const { religious, togglePrayer, addWirdProgress, toggleDhikr, updateReligiousSettings, updatePrayerTimes } = useCommandCenter()
  const [timingState, setTimingState] = useState<TimingState>('idle')
  const [timingMessage, setTimingMessage] = useState('')
  const [timingDate, setTimingDate] = useState<string | null>(null)
  const [hijriDate, setHijriDate] = useState<string | null>(null)
  const [selectedSurah, setSelectedSurah] = useState(1)
  const [quranState, setQuranState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [quranMessage, setQuranMessage] = useState('')
  const [quran, setQuran] = useState<QuranResponse | null>(null)
  const [reciters, setReciters] = useState<Reciter[]>([])
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const completedPrayers = religious.prayerLogs.filter((prayer) => prayer.status === 'done').length
  const prayerPercent = Math.round((completedPrayers / Math.max(religious.prayerLogs.length, 1)) * 100)
  const wirdPercent = Math.round((religious.quran.completedMinutes / Math.max(religious.quran.targetMinutes, 1)) * 100)

  async function refreshPrayerTimes() {
    setTimingState('loading')
    setTimingMessage('جاري تحديث المواقيت من المصدر الموثوق…')
    try {
      const method = calculationMethods[religious.calculationMethod] ?? '5'
      const response = await fetch(`/api/religious/timings?city=${encodeURIComponent(religious.city)}&country=Egypt&method=${method}`, { cache: 'no-store' })
      const payload = await response.json() as TimingsResponse
      if (!response.ok || !payload.timings) throw new Error(payload.error || 'تعذر تحديث المواقيت.')
      updatePrayerTimes(payload.timings)
      setTimingDate(payload.date)
      setHijriDate(payload.hijriDate)
      setTimingState('success')
      setTimingMessage(`تم التحديث من ${payload.source}.`)
    } catch (error) {
      setTimingState('error')
      setTimingMessage(error instanceof Error ? error.message : 'تعذر تحديث المواقيت حاليًا؛ ما زالت آخر بيانات محفوظة ظاهرة.')
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshPrayerTimes() }, 450)
    return () => window.clearTimeout(timer)
  }, [religious.city, religious.calculationMethod])

  useEffect(() => {
    let active = true
    setQuranState('loading')
    setQuranMessage('جاري جلب نص السورة من المصدر الخارجي…')
    fetch(`/api/religious/quran?surah=${selectedSurah}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json() as QuranResponse
        if (!response.ok) throw new Error(payload.error || 'تعذر جلب السورة.')
        if (active) {
          setQuran(payload)
          setQuranState('success')
          setQuranMessage(`المصدر: ${payload.source}`)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setQuranState('error')
          setQuranMessage(error instanceof Error ? error.message : 'تعذر جلب نص السورة.')
        }
      })
    return () => { active = false }
  }, [selectedSurah])

  useEffect(() => {
    let active = true
    fetch('/api/religious/reciters', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json() as RecitersResponse
        if (!response.ok) throw new Error(payload.error || 'تعذر جلب القراء.')
        if (active && payload.reciters?.length) {
          setReciters(payload.reciters)
          setSelectedReciter(payload.reciters[0])
        }
      })
      .catch(() => {
        if (active) setQuranMessage((message) => message || 'تعذر تحميل كتالوج التلاوات؛ يمكنك الاستمرار في القراءة.')
      })
    return () => { active = false }
  }, [])

  function playSelectedSurah() {
    if (!selectedReciter?.server) return
    const url = `${selectedReciter.server}${String(selectedSurah).padStart(3, '0')}.mp3`
    setAudioUrl(url)
    setIsPlaying(true)
  }

  return (
    <div className="space-y-5">
      <ContentCard className="bg-surface-dark text-surface-dark-foreground" title="رفقًا بنفسك، خطوة ثابتة تكفي" description="مساحة هادئة لمتابعة عبادتك اليومية دون ضغط أو أحكام تلقائية.">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-surface-dark-foreground/75"><Compass className="h-5 w-5 text-primary" /> المدينة: {religious.city} · طريقة الحساب: {religious.calculationMethod}</div>
          <span className="rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary">{timingState === 'success' ? 'المواقيت محدثة اليوم' : 'المواقيت قابلة للتحديث'}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-surface-dark-foreground/60">
          <span>يتم حفظ تقدمك وإعداداتك فقط. نصوص القرآن والأذكار الخارجية لا تُخزّن محليًا كنص موثوق.</span>
          {timingDate && <span>التاريخ: {timingDate}{hijriDate ? ` · هجري: ${hijriDate}` : ''}</span>}
        </div>
      </ContentCard>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          {timingState === 'loading' ? <LoaderCircle className="h-4 w-4 animate-spin text-primary" /> : <RefreshCw className="h-4 w-4 text-primary" />}
          <span>{timingMessage || 'يتم جلب مواقيت اليوم من AlAdhan حسب المدينة وطريقة الحساب.'}</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => void refreshPrayerTimes()} disabled={timingState === 'loading'}>
          {timingState === 'loading' ? 'جاري التحديث' : 'تحديث المواقيت'}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <ContentCard className="lg:col-span-3" title="صلوات اليوم" description={`${completedPrayers} من ${religious.prayerLogs.length} صلوات مكتملة`} action={<span className="text-sm font-semibold text-primary">{prayerPercent}%</span>}>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${prayerPercent}%` }} /></div>
          <div className="grid gap-2 sm:grid-cols-2">
            {religious.prayerLogs.map((prayer) => {
              const Icon = prayerIcons[prayer.name] ?? Clock3
              const done = prayer.status === 'done'
              return <button key={prayer.id} type="button" onClick={() => togglePrayer(prayer.id)} className={`flex items-center gap-3 rounded-2xl border p-3 text-right transition-colors ${done ? 'border-primary/30 bg-primary/8' : 'border-border bg-background hover:bg-muted'}`}>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${done ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}><Icon className="h-5 w-5" /></span>
                <span className="flex-1"><span className="block text-sm font-semibold">صلاة {prayer.name}</span><span className="mt-1 block text-xs text-muted-foreground">{prayer.time}</span></span>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${done ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{done && <Check className="h-3.5 w-3.5" />}</span>
              </button>
            })}
          </div>
        </ContentCard>

        <ContentCard className="lg:col-span-2" title="الورد اليومي" description="التقدم محفوظ دون تخزين النص الخارجي.">
          <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><BookOpen className="h-6 w-6" /></span><div><p className="text-sm font-semibold">{religious.quran.reference}</p><p className="mt-1 text-xs text-muted-foreground">{religious.quran.completedMinutes} من {religious.quran.targetMinutes} دقيقة</p></div></div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, wirdPercent)}%` }} /></div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>{wirdPercent}% مكتمل</span><span>المتبقي {Math.max(0, religious.quran.targetMinutes - religious.quran.completedMinutes)} د</span></div>
          <div className="mt-5 flex gap-2"><Button size="sm" variant="outline" onClick={() => addWirdProgress(5)}>+ 5 دقائق</Button><Button size="sm" onClick={() => addWirdProgress(10)}>أنجزت 10 دقائق</Button></div>
        </ContentCard>
      </div>

      <ContentCard title="المصحف والتلاوة" description={quran?.surah?.name ? `${quran.surah.name} · ${quran.surah.numberOfAyahs ?? 0} آية` : 'النص والتلاوة يجلبان عند الطلب من مصادر خارجية موثوقة.'} action={<span className="text-xs text-muted-foreground">{quranMessage}</span>}>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-2 text-sm font-medium"><span>السورة</span><select value={selectedSurah} onChange={(event) => setSelectedSurah(Number(event.target.value))} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"><option value={1}>1 — الفاتحة</option><option value={2}>2 — البقرة</option><option value={18}>18 — الكهف</option><option value={36}>36 — يس</option><option value={55}>55 — الرحمن</option><option value={67}>67 — الملك</option><option value={112}>112 — الإخلاص</option></select></label>
          <label className="space-y-2 text-sm font-medium"><span>القارئ</span><select value={selectedReciter?.id ?? ''} onChange={(event) => setSelectedReciter(reciters.find((reciter) => reciter.id === Number(event.target.value)) ?? null)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" disabled={!reciters.length}><option value="">{reciters.length ? 'اختر قارئًا' : 'جاري تحميل القراء…'}</option>{reciters.map((reciter) => <option key={reciter.id} value={reciter.id}>{reciter.name}</option>)}</select></label>
          <div className="flex items-end"><Button onClick={playSelectedSurah} disabled={!selectedReciter || quranState === 'loading'}><Play className="ms-1 h-4 w-4" /> تشغيل السورة</Button></div>
        </div>
        {audioUrl && <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-3"><div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Volume2 className="h-4 w-4 text-primary" /> {selectedReciter?.name} · {isPlaying ? 'تعمل الآن' : 'متوقفة'}</div><audio controls autoPlay src={audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} className="w-full" /></div>}
        <div className="mt-4 max-h-80 overflow-y-auto rounded-2xl border border-border bg-background p-4" dir="rtl">{quranState === 'loading' && <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin text-primary" /> جاري تحميل الآيات…</div>}{quranState === 'error' && <div className="py-6 text-sm text-destructive">{quranMessage}</div>}{quranState === 'success' && quran?.ayahs?.map((ayah) => <p key={ayah.number} className="border-b border-border/60 py-3 text-lg leading-9 last:border-0">{ayah.text} <span className="me-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1 text-xs text-accent-foreground">{ayah.number}</span></p>)}</div>
        <p className="mt-3 text-xs text-muted-foreground">النص من AlQuran Cloud، والتلاوة من MP3Quran. التطبيق يحفظ تقدمك وإعداداتك فقط ولا يستضيف المحتوى الديني.</p>
      </ContentCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <ContentCard title="الأذكار" description="سجل الجلسة فقط، ويمكنك الرجوع لمصدرك الموثوق.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><DhikrButton label="أذكار الصباح" done={religious.dhikr.morning} onClick={() => toggleDhikr('morning')} /><DhikrButton label="أذكار المساء" done={religious.dhikr.evening} onClick={() => toggleDhikr('evening')} /></div>
        </ContentCard>
        <ContentCard className="lg:col-span-2" title="إعدادات المواقيت" description="الإعدادات الحالية محلية وتُزامن عند توفر الحساب وقاعدة البيانات.">
          <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> المدينة</span><input value={religious.city} onChange={(event) => updateReligiousSettings({ city: event.target.value, calculationMethod: religious.calculationMethod })} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Cairo" /></label><label className="space-y-2 text-sm font-medium"><span>طريقة الحساب</span><select value={religious.calculationMethod} onChange={(event) => updateReligiousSettings({ city: religious.city, calculationMethod: event.target.value })} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"><option>مخصص</option><option>الهيئة المصرية العامة للمساحة</option><option>رابطة العالم الإسلامي</option></select></label></div>
          <div className={`mt-4 flex items-start gap-2 rounded-2xl p-3 text-xs ${timingState === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-muted/60 text-muted-foreground'}`}><Sunrise className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {timingState === 'error' ? timingMessage : 'المصدر الحالي AlAdhan. عند فشل الشبكة تظل آخر مواقيت محفوظة ظاهرة، ولا تُستخدم البيانات كفتوى أو حكم ديني.'}</div>
        </ContentCard>
      </div>
    </div>
  )
}

function DhikrButton({ label, done, onClick }: { label: string; done: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex items-center gap-3 rounded-2xl border p-3 text-right transition-colors ${done ? 'border-primary/30 bg-primary/8' : 'border-border bg-background hover:bg-muted'}`}><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${done ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}><Moon className="h-4 w-4" /></span><span className="flex-1 text-sm font-semibold">{label}</span><span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${done ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{done && <Check className="h-3 w-3" />}</span></button>
}
