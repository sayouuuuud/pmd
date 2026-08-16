'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BarChart3, BookOpen, Check, Clock3, Compass, Flame, Forward, LoaderCircle, MapPin, Moon, Play, Plus, RefreshCw, Rewind, Sparkles, Sunrise, SunMedium, Trash2, Volume2 } from 'lucide-react'
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

const dhikrTarget = 3
const dhikrGroups = {
  morning: { label: 'أذكار الصباح', items: [{ id: 'morning-1', label: 'تسبيح' }, { id: 'morning-2', label: 'تحميد' }, { id: 'morning-3', label: 'تكبير' }, { id: 'morning-4', label: 'استغفار' }] },
  evening: { label: 'أذكار المساء', items: [{ id: 'evening-1', label: 'تسبيح' }, { id: 'evening-2', label: 'تحميد' }, { id: 'evening-3', label: 'تكبير' }, { id: 'evening-4', label: 'استغفار' }] },
} as const

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
  const { religious, togglePrayer, addWirdProgress, addMemorizationProgress, saveQuranPosition, createQuranPlaylist, toggleQuranPlaylistSurah, incrementDhikr, addTasbeeh, addSavedDua, removeSavedDua, updateReligiousSettings, updatePrayerTimes } = useCommandCenter()
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
  const [audioRate, setAudioRate] = useState(1)
  const [playlistName, setPlaylistName] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [sunnahChecks, setSunnahChecks] = useState<Record<string, boolean>>({ duha: false, witr: false, rawatib: false, sadaqah: false })
  const [duaInput, setDuaInput] = useState('')
  const completedPrayers = religious.prayerLogs.filter((prayer) => prayer.status === 'done').length
  const prayerPercent = Math.round((completedPrayers / Math.max(religious.prayerLogs.length, 1)) * 100)
  const wirdPercent = Math.round((religious.quran.completedMinutes / Math.max(religious.quran.targetMinutes, 1)) * 100)
  const memorizationTarget = religious.quran.memorizationTarget ?? 10
  const memorizationCompleted = religious.quran.memorizationCompleted ?? 0
  const memorizationPercent = Math.round((memorizationCompleted / Math.max(memorizationTarget, 1)) * 100)
  const prayerHistory = religious.prayerHistory ?? []
  const prayerStreak = prayerHistory.slice().reverse().reduce((streak, day) => day.completed >= day.total ? streak + 1 : streak, 0)
  const monthlyCompleted = prayerHistory.reduce((sum, day) => sum + day.completed, 0)
  const monthlyTotal = prayerHistory.reduce((sum, day) => sum + day.total, 0)
  const monthlyRate = Math.round((monthlyCompleted / Math.max(monthlyTotal, 1)) * 100)
  const tasbeehCount = religious.dhikr.tasbeehCount ?? 0
  const tasbeehTarget = religious.dhikr.tasbeehTarget ?? 100
  const tasbeehPercent = Math.round((tasbeehCount / Math.max(tasbeehTarget, 1)) * 100)
  const dhikrCompleted = (['morning', 'evening'] as const).reduce((total, session) => total + dhikrGroups[session].items.reduce((sessionTotal, item) => sessionTotal + Math.min(dhikrTarget, religious.dhikr[`${session}Progress`]?.[item.id] ?? 0), 0), 0)
  const dhikrTotal = dhikrTarget * dhikrGroups.morning.items.length * 2
  const dhikrPercent = Math.round((dhikrCompleted / Math.max(dhikrTotal, 1)) * 100)

  const refreshPrayerTimes = useCallback(async () => {
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
  }, [religious.city, religious.calculationMethod, updatePrayerTimes])

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshPrayerTimes() }, 450)
    return () => window.clearTimeout(timer)
  }, [refreshPrayerTimes])

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

  useEffect(() => {
    const audio = audioRef.current
    const saved = religious.quran.lastPosition
    if (!audio || !audioUrl || !saved || saved.surahNumber !== selectedSurah || saved.positionSeconds <= 0) return
    const restorePosition = () => {
      if (Number.isFinite(audio.duration) && saved.positionSeconds < audio.duration) audio.currentTime = saved.positionSeconds
    }
    audio.addEventListener('loadedmetadata', restorePosition)
    restorePosition()
    return () => audio.removeEventListener('loadedmetadata', restorePosition)
  }, [audioUrl, religious.quran.lastPosition, selectedSurah])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = audioRate
  }, [audioRate, audioUrl])

  function playSelectedSurah() {
    if (!selectedReciter?.server) return
    const url = `${selectedReciter.server}${String(selectedSurah).padStart(3, '0')}.mp3`
    setAudioUrl(url)
    setIsPlaying(true)
  }

  function seekAudio(offsetSeconds: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.duration || Number.MAX_SAFE_INTEGER, audio.currentTime + offsetSeconds))
  }

  function saveCurrentAudioPosition() {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.currentTime) || audio.currentTime <= 0) return
    saveQuranPosition({ surahNumber: selectedSurah, positionSeconds: Math.round(audio.currentTime), reciterId: selectedReciter?.id })
  }

  function formatAudioTime(seconds: number) {
    const safeSeconds = Math.max(0, Math.round(seconds))
    return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`
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

      <div className="grid gap-5 lg:grid-cols-3">
        <ContentCard title="ثبات الصلاة" description="مؤشر مبني على الأيام المسجلة داخل حسابك." action={<Flame className="h-5 w-5 text-primary" />}>
          <div className="flex items-end justify-between gap-4"><div><p className="text-4xl font-bold tracking-tight text-primary">{prayerStreak}</p><p className="mt-1 text-sm text-muted-foreground">أيام متتالية مكتملة</p></div><div className="rounded-2xl bg-accent/60 p-3 text-left"><p className="text-xs text-muted-foreground">آخر سجل</p><p className="mt-1 text-sm font-semibold">{prayerHistory.at(-1)?.localDate ?? 'لا يوجد'}</p></div></div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-muted/50 p-3"><span className="block text-xs text-muted-foreground">آخر 30 يومًا</span><strong className="mt-1 block">{monthlyRate}%</strong></div><div className="rounded-2xl bg-muted/50 p-3"><span className="block text-xs text-muted-foreground">سجلات محفوظة</span><strong className="mt-1 block">{prayerHistory.length} يوم</strong></div></div>
        </ContentCard>
        <ContentCard title="خطة الحفظ" description="تقدم تقريبي تحفظه أنت؛ لا يتم تخزين نص الآيات." action={<BookOpen className="h-5 w-5 text-primary" />}>
          <div className="flex items-center justify-between text-sm"><span>الإنجاز الحالي</span><strong>{memorizationCompleted} من {memorizationTarget} آيات</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, memorizationPercent)}%` }} /></div><div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{memorizationPercent}% مكتمل</span><span>المتبقي {Math.max(0, memorizationTarget - memorizationCompleted)}</span></div><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => addMemorizationProgress(1)}><Plus className="ms-1 h-3.5 w-3.5" /> آية</Button><Button size="sm" onClick={() => addMemorizationProgress(3)}>أنجزت 3 آيات</Button></div>
        </ContentCard>
        <ContentCard title="السنن والنوافل" description="قائمة تذكير يومية محلية قابلة للتعديل من هاتفك." action={<Sparkles className="h-5 w-5 text-primary" />}><div className="grid gap-2">{[['duha', 'صلاة الضحى'], ['witr', 'الوتر'], ['rawatib', 'السنن الرواتب'], ['sadaqah', 'صدقة أو إحسان']].map(([id, label]) => <button key={id} type="button" onClick={() => setSunnahChecks((current) => ({ ...current, [id]: !current[id] }))} className={`flex items-center gap-3 rounded-2xl border p-3 text-right text-sm transition-colors ${sunnahChecks[id] ? 'border-primary/30 bg-primary/8' : 'border-border bg-background hover:bg-muted'}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${sunnahChecks[id] ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{sunnahChecks[id] && <Check className="h-3 w-3" />}</span><span className="flex-1">{label}</span></button>)}</div></ContentCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ContentCard title="السبحة الإلكترونية" description="عداد محلي بسيط للذكر، يُحفظ تقدمُه ضمن إعداداتك الشخصية." action={<span className="text-sm font-semibold text-primary">{tasbeehCount} / {tasbeehTarget}</span>}>
          <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/20 bg-accent text-2xl font-bold text-primary">{tasbeehCount % 100}</div><div className="flex-1"><p className="text-sm font-semibold">ورد التسبيح الحالي</p><p className="mt-1 text-xs text-muted-foreground">{Math.min(100, tasbeehPercent)}% من الهدف المحدد</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, tasbeehPercent)}%` }} /></div></div></div>
          <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => addTasbeeh(1)}>تسبيحة واحدة</Button><Button size="sm" variant="outline" onClick={() => addTasbeeh(10)}>+ 10</Button><Button size="sm" variant="ghost" onClick={() => addTasbeeh(33)}>+ 33</Button></div>
        </ContentCard>
        <ContentCard title="أدعية محفوظة" description="مساحة قصيرة لحفظ الأدعية التي تريد العودة إليها، دون جلب نصوص خارجية تلقائيًا." action={<span className="text-xs text-muted-foreground">{religious.dhikr.savedDuas?.length ?? 0} محفوظ</span>}>
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); addSavedDua(duaInput); setDuaInput('') }}><input value={duaInput} onChange={(event) => setDuaInput(event.target.value)} placeholder="اكتب دعاءً قصيرًا" aria-label="دعاء جديد" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /><Button type="submit" size="sm" disabled={!duaInput.trim()}>حفظ</Button></form>
          <div className="mt-3 space-y-2">{(religious.dhikr.savedDuas ?? []).map((dua, index) => <div key={`${dua}-${index}`} className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-sm"><span className="flex-1 leading-6">{dua}</span><Button type="button" size="icon" variant="ghost" aria-label="حذف الدعاء" onClick={() => removeSavedDua(index)}><Trash2 className="h-4 w-4" /></Button></div>)}</div>
        </ContentCard>
      </div>

      <ContentCard title="المصحف والتلاوة" description={quran?.surah?.name ? `${quran.surah.name} · ${quran.surah.numberOfAyahs ?? 0} آية` : 'النص والتلاوة يجلبان عند الطلب من مصادر خارجية موثوقة.'} action={<span className="text-xs text-muted-foreground">{quranMessage}</span>}>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-2 text-sm font-medium"><span>السورة</span><select value={selectedSurah} onChange={(event) => setSelectedSurah(Number(event.target.value))} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"><option value={1}>1 — الفاتحة</option><option value={2}>2 — البقرة</option><option value={18}>18 — الكهف</option><option value={36}>36 — يس</option><option value={55}>55 — الرحمن</option><option value={67}>67 — الملك</option><option value={112}>112 — الإخلاص</option></select></label>
          <label className="space-y-2 text-sm font-medium"><span>القارئ</span><select value={selectedReciter?.id ?? ''} onChange={(event) => setSelectedReciter(reciters.find((reciter) => reciter.id === Number(event.target.value)) ?? null)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" disabled={!reciters.length}><option value="">{reciters.length ? 'اختر قارئًا' : 'جاري تحميل القراء…'}</option>{reciters.map((reciter) => <option key={reciter.id} value={reciter.id}>{reciter.name}</option>)}</select></label>
          <div className="flex items-end"><Button onClick={playSelectedSurah} disabled={!selectedReciter || quranState === 'loading'}><Play className="ms-1 h-4 w-4" /> تشغيل السورة</Button></div>
        </div>
        {audioUrl && <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-3"><div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-primary" /> {selectedReciter?.name} · {isPlaying ? 'تعمل الآن' : 'متوقفة'}</span><div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" variant="ghost" onClick={() => seekAudio(-15)} aria-label="رجوع 15 ثانية"><Rewind className="ms-1 h-3.5 w-3.5" /> 15 ثانية</Button><Button type="button" size="sm" variant="ghost" onClick={() => seekAudio(15)} aria-label="تقديم 15 ثانية"><Forward className="ms-1 h-3.5 w-3.5" /> 15 ثانية</Button><label className="flex items-center gap-1"><span>السرعة</span><select aria-label="سرعة التلاوة" value={audioRate} onChange={(event) => setAudioRate(Number(event.target.value))} className="rounded-lg border border-border bg-background px-2 py-1"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></label><Button type="button" size="sm" variant="ghost" onClick={saveCurrentAudioPosition}>حفظ الموضع الحالي</Button></div></div><audio ref={audioRef} controls autoPlay src={audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => { setIsPlaying(false); saveCurrentAudioPosition() }} onEnded={() => { setIsPlaying(false); saveCurrentAudioPosition() }} className="w-full" /></div>}
        {religious.quran.lastPosition && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground"><span>موضع محفوظ: السورة {religious.quran.lastPosition.surahNumber} · {formatAudioTime(religious.quran.lastPosition.positionSeconds)}</span><Button type="button" size="sm" variant="outline" onClick={playSelectedSurah}>استئناف التلاوة</Button></div>}
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_1.2fr]"><form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); createQuranPlaylist(playlistName, selectedSurah); setPlaylistName('') }}><input value={playlistName} onChange={(event) => setPlaylistName(event.target.value)} placeholder="اسم قائمة جديدة" aria-label="اسم قائمة تلاوة جديدة" className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /><Button type="submit" size="sm" disabled={!playlistName.trim()}><Plus className="ms-1 h-3.5 w-3.5" /> إنشاء قائمة</Button></form><div className="space-y-2">{(religious.quran.playlists ?? []).length === 0 ? <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">أنشئ قائمة واحفظ فيها السورة الحالية للعودة إليها لاحقًا.</p> : (religious.quran.playlists ?? []).map((playlist) => <div key={playlist.id} className="rounded-xl border border-border p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{playlist.name}</p><span className="text-xs text-muted-foreground">{playlist.surahNumbers.length} سور</span></div><div className="mt-2 flex flex-wrap gap-2">{playlist.surahNumbers.map((surahNumber) => <Button key={surahNumber} type="button" size="sm" variant={surahNumber === selectedSurah ? 'secondary' : 'outline'} onClick={() => toggleQuranPlaylistSurah(playlist.id, surahNumber)} aria-pressed={surahNumber === selectedSurah}>السورة {surahNumber}</Button>)}<Button type="button" size="sm" variant="ghost" onClick={() => toggleQuranPlaylistSurah(playlist.id, selectedSurah)}>{playlist.surahNumbers.includes(selectedSurah) ? 'إزالة الحالية' : 'إضافة الحالية'}</Button></div></div>)}</div></div>
        <div className="mt-4 max-h-80 overflow-y-auto rounded-2xl border border-border bg-background p-4" dir="rtl">{quranState === 'loading' && <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin text-primary" /> جاري تحميل الآيات…</div>}{quranState === 'error' && <div className="py-6 text-sm text-destructive">{quranMessage}</div>}{quranState === 'success' && quran?.ayahs?.map((ayah) => <p key={ayah.number} className="border-b border-border/60 py-3 text-lg leading-9 last:border-0">{ayah.text} <span className="me-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1 text-xs text-accent-foreground">{ayah.number}</span></p>)}</div>
        <p className="mt-3 text-xs text-muted-foreground">النص من AlQuran Cloud، والتلاوة من MP3Quran. التطبيق يحفظ تقدمك وإعداداتك فقط ولا يستضيف المحتوى الديني.</p>
      </ContentCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <ContentCard title="الأذكار" description="عداد مستقل لكل ذكر مع حفظ تقدمك محليًا أو عبر الحساب عند توفره." action={<span className="text-sm font-semibold text-primary">{dhikrPercent}%</span>}>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted" aria-label={`التقدم الإجمالي في الأذكار ${dhikrPercent}%`}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, dhikrPercent)}%` }} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(['morning', 'evening'] as const).map((session) => {
              const group = dhikrGroups[session]
              const progress = religious.dhikr[`${session}Progress`] ?? {}
              const sessionCompleted = group.items.reduce((total, item) => total + Math.min(dhikrTarget, progress[item.id] ?? 0), 0)
              const sessionPercent = Math.round((sessionCompleted / (group.items.length * dhikrTarget)) * 100)
              return <div key={session} className="rounded-2xl border border-border bg-background p-3">
                <div className="mb-3 flex items-center justify-between gap-2"><div><p className="text-sm font-semibold">{group.label}</p><p className="mt-1 text-xs text-muted-foreground">{sessionCompleted} من {group.items.length * dhikrTarget} تكرارات</p></div><span className="text-xs font-semibold text-primary">{sessionPercent}%</span></div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${sessionPercent}%` }} /></div>
                <div className="space-y-2">{group.items.map((item) => {
                  const count = Math.min(dhikrTarget, progress[item.id] ?? 0)
                  const done = count >= dhikrTarget
                  return <div key={item.id} className={`flex items-center gap-2 rounded-xl border p-2.5 ${done ? 'border-primary/30 bg-primary/8' : 'border-border'}`}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Moon className="h-3.5 w-3.5" /></span><span className="flex-1 text-sm">{item.label}<span className="mt-0.5 block text-xs text-muted-foreground">{count} من {dhikrTarget}</span></span><Button type="button" size="sm" variant={done ? 'ghost' : 'outline'} disabled={done} onClick={() => incrementDhikr(session, item.id, dhikrTarget)} aria-label={`${item.label} — ${group.label}`}>{done ? <Check className="h-4 w-4 text-primary" /> : '+1'}</Button></div>
                })}</div>
              </div>
            })}
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><BarChart3 className="h-3.5 w-3.5 text-primary" /> التقدم الإجمالي: {dhikrCompleted} من {dhikrTotal} تكرارًا. ارجع إلى مصدرك الموثوق للنص الكامل.</p>
        </ContentCard>
        <ContentCard className="lg:col-span-2" title="إعدادات المواقيت" description="الإعدادات الحالية محلية وتُزامن عند توفر الحساب وقاعدة البيانات.">
          <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> المدينة</span><input value={religious.city} onChange={(event) => updateReligiousSettings({ city: event.target.value, calculationMethod: religious.calculationMethod })} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Cairo" /></label><label className="space-y-2 text-sm font-medium"><span>طريقة الحساب</span><select value={religious.calculationMethod} onChange={(event) => updateReligiousSettings({ city: religious.city, calculationMethod: event.target.value })} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"><option>مخصص</option><option>الهيئة المصرية العامة للمساحة</option><option>رابطة العالم الإسلامي</option></select></label></div>
          <div className={`mt-4 flex items-start gap-2 rounded-2xl p-3 text-xs ${timingState === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-muted/60 text-muted-foreground'}`}><Sunrise className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {timingState === 'error' ? timingMessage : 'المصدر الحالي AlAdhan. عند فشل الشبكة تظل آخر مواقيت محفوظة ظاهرة، ولا تُستخدم البيانات كفتوى أو حكم ديني.'}</div>
        </ContentCard>
      </div>
    </div>
  )
}
