'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BarChart3, BookOpen, Check, Clock3, Compass, Flame, Forward, Heart, LoaderCircle, MapPin, Moon, Play, Plus, RefreshCw, Rewind, Sparkles, Sunrise, SunMedium, Trash2, Volume2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { isPrayerCompletedStatus, type MemorizationSurahStatus, type PrayerStatus, type QuranWirdMode, useCommandCenter } from '@/lib/command-center-store'
import { formatPrayerCountdown, getNextPrayerCountdown } from '@/lib/prayer-countdown'

const prayerIcons: Record<string, typeof Sunrise> = {
  الفجر: Sunrise,
  الظهر: SunMedium,
  العصر: SunMedium,
  المغرب: Moon,
  العشاء: Moon,
}

const prayerStatusOptions: Array<{ value: PrayerStatus; label: string }> = [
  { value: 'pending', label: 'لم تُسجّل' },
  { value: 'on-time', label: 'في وقتها' },
  { value: 'congregation', label: 'جماعة' },
  { value: 'qada', label: 'قضاء' },
  { value: 'missed', label: 'فائتة' },
]

const prayerStatusLabels: Record<PrayerStatus, string> = {
  pending: 'لم تُسجّل',
  done: 'في وقتها',
  'on-time': 'في وقتها',
  congregation: 'جماعة',
  qada: 'قضاء',
  missed: 'فائتة',
}

const memorizationSurahOptions = [
  { number: 1, name: 'الفاتحة' },
  { number: 2, name: 'البقرة' },
  { number: 18, name: 'الكهف' },
  { number: 36, name: 'يس' },
  { number: 55, name: 'الرحمن' },
  { number: 67, name: 'الملك' },
  { number: 112, name: 'الإخلاص' },
] as const

const memorizationStatusOptions: Array<{ value: MemorizationSurahStatus; label: string }> = [
  { value: 'learning', label: 'بحفظها' },
  { value: 'reviewing', label: 'تحتاج مراجعة' },
  { value: 'memorized', label: 'حفظتها' },
]

const memorizationReviewGuidance: Record<MemorizationSurahStatus, { nextReview: string; guidance: string }> = {
  learning: { nextReview: 'اليوم', guidance: 'جلسة حفظ جديدة' },
  reviewing: { nextReview: 'غدًا', guidance: 'مراجعة قريبة' },
  memorized: { nextReview: 'بعد 7 أيام', guidance: 'مراجعة تثبيت' },
}

const calculationMethods: Record<string, string> = {
  مخصص: '5',
  'الهيئة المصرية العامة للمساحة': '5',
  'رابطة العالم الإسلامي': '3',
}

const wirdModeOptions: Array<{ value: QuranWirdMode; label: string; unit: string; targets: Array<{ value: number; label: string }>; smallStep: number; largeStep: number }> = [
  { value: 'minutes', label: 'بالدقائق', unit: 'دقيقة', targets: [{ value: 10, label: '10 دقائق' }, { value: 20, label: '20 دقيقة' }, { value: 30, label: '30 دقيقة' }, { value: 45, label: '45 دقيقة' }, { value: 60, label: 'ساعة' }], smallStep: 5, largeStep: 10 },
  { value: 'pages', label: 'بالصفحات', unit: 'صفحة', targets: [{ value: 1, label: 'صفحة واحدة' }, { value: 2, label: 'صفحتان' }, { value: 5, label: '5 صفحات' }, { value: 10, label: '10 صفحات' }], smallStep: 1, largeStep: 5 },
  { value: 'half-juz', label: 'نصف جزء', unit: 'صفحة', targets: [{ value: 10, label: 'نصف جزء · 10 صفحات' }], smallStep: 1, largeStep: 5 },
  { value: 'juz', label: 'جزء كامل', unit: 'صفحة', targets: [{ value: 20, label: 'جزء · 20 صفحة' }], smallStep: 1, largeStep: 5 },
]

const dhikrTarget = 3
const dhikrGroups = {
  morning: { label: 'أذكار الصباح', items: [{ id: 'morning-1', label: 'تسبيح' }, { id: 'morning-2', label: 'تحميد' }, { id: 'morning-3', label: 'تكبير' }, { id: 'morning-4', label: 'استغفار' }] },
  evening: { label: 'أذكار المساء', items: [{ id: 'evening-1', label: 'تسبيح' }, { id: 'evening-2', label: 'تحميد' }, { id: 'evening-3', label: 'تكبير' }, { id: 'evening-4', label: 'استغفار' }] },
} as const

const cairoDateFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' })

function getCairoDateKey(date = new Date()) {
  const parts = cairoDateFormatter.formatToParts(date)
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function shiftDateKey(localDate: string, offset: number) {
  const date = new Date(`${localDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

type TimingState = 'idle' | 'loading' | 'success' | 'error'

type TimingsResponse = {
  source: string
  date: string | null
  hijriDate: string | null
  timings: Partial<Record<'الفجر' | 'الظهر' | 'العصر' | 'المغرب' | 'العشاء', string>>
  error?: string
}

type SurahCatalogEntry = { number: number; name: string; englishName?: string; englishNameTranslation?: string; numberOfAyahs?: number; revelationType?: string }

type QuranResponse = {
  source: string
  mode?: 'surah' | 'juz'
  catalog?: 'surahs'
  surahs?: SurahCatalogEntry[]
  surah?: { number?: number; name?: string; numberOfAyahs?: number }
  juz?: { number?: number; name?: string; englishName?: string }
  ayahs?: Array<{ number?: number; text?: string; surahNumber?: number; surahName?: string }>
  error?: string
}

type Reciter = { id: number; name: string; read?: string; server: string; surahTotal?: number; surahList?: string }

type RecitersResponse = { source: string; reciters?: Reciter[]; error?: string }

export function ReligiousWorkspace() {
  const { religious, togglePrayer, addWirdProgress, setWirdTarget, addMemorizationProgress, setMemorizationSurahStatus, saveQuranPosition, createQuranPlaylist, toggleQuranPlaylistSurah, saveQuranFavoriteAyah, removeQuranFavoriteAyah, toggleQuranListenLater, toggleQuranListened, incrementDhikr, addTasbeeh, setTasbeehTarget, resetTasbeeh, addSavedDua, removeSavedDua, updateReligiousSettings, updatePrayerTimes, toggleSunnah } = useCommandCenter()
  const [timingState, setTimingState] = useState<TimingState>('idle')
  const [timingMessage, setTimingMessage] = useState('')
  const [timingDate, setTimingDate] = useState<string | null>(null)
  const [hijriDate, setHijriDate] = useState<string | null>(null)
  const [clockMs, setClockMs] = useState(0)
  const [selectedSurah, setSelectedSurah] = useState(1)
  const [surahCatalog, setSurahCatalog] = useState<SurahCatalogEntry[]>([])
  const [surahCatalogState, setSurahCatalogState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [surahCatalogMessage, setSurahCatalogMessage] = useState('')
  const [quranMode, setQuranMode] = useState<'surah' | 'juz'>('surah')
  const [selectedJuz, setSelectedJuz] = useState(1)
  const [quranState, setQuranState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [quranMessage, setQuranMessage] = useState('')
  const [quran, setQuran] = useState<QuranResponse | null>(null)
  const [quranRetryToken, setQuranRetryToken] = useState(0)
  const [reciters, setReciters] = useState<Reciter[]>([])
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioRate, setAudioRate] = useState(1)
  const [quranFontScale, setQuranFontScale] = useState<'sm' | 'md' | 'lg'>('md')
  const [playlistName, setPlaylistName] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [duaInput, setDuaInput] = useState('')
  const [duaError, setDuaError] = useState('')
  const [playlistError, setPlaylistError] = useState('')
  const completedPrayers = religious.prayerLogs.filter((prayer) => isPrayerCompletedStatus(prayer.status)).length
  const prayerPercent = Math.round((completedPrayers / Math.max(religious.prayerLogs.length, 1)) * 100)
  const wirdMode = religious.quran.wirdMode ?? 'minutes'
  const wirdModeConfig = wirdModeOptions.find((option) => option.value === wirdMode) ?? wirdModeOptions[0]
  const wirdCompleted = wirdMode === 'minutes' ? religious.quran.completedMinutes : (religious.quran.completedPages ?? 0)
  const wirdTarget = wirdMode === 'minutes' ? religious.quran.targetMinutes : (religious.quran.targetPages ?? wirdModeConfig.targets[0].value)
  const wirdPercent = Math.round((wirdCompleted / Math.max(wirdTarget, 1)) * 100)
  const memorizationTarget = religious.quran.memorizationTarget ?? 10
  const memorizationCompleted = religious.quran.memorizationCompleted ?? 0
  const memorizationPercent = Math.round((memorizationCompleted / Math.max(memorizationTarget, 1)) * 100)
  const memorizationSurahStatus = religious.quran.memorizationSurahStatus ?? {}
  const memorizedSurahCount = memorizationSurahOptions.filter(({ number }) => memorizationSurahStatus[number] === 'memorized').length
  const memorizationReviewRows = memorizationSurahOptions.map((surah) => {
    const status = memorizationSurahStatus[surah.number] ?? 'learning'
    const statusLabel = memorizationStatusOptions.find((option) => option.value === status)?.label ?? 'بحفظها'
    return { ...surah, status, statusLabel, ...memorizationReviewGuidance[status] }
  })
  const prayerHistory = religious.prayerHistory ?? []
  const orderedPrayerHistory = prayerHistory.slice().sort((left, right) => left.localDate.localeCompare(right.localDate))
  const prayerHistoryByDate = new Map(orderedPrayerHistory.map((day) => [day.localDate, day]))
  const latestPrayerDay = orderedPrayerHistory.at(-1)
  let prayerStreak = 0
  if (latestPrayerDay && latestPrayerDay.completed >= latestPrayerDay.total) {
    let cursor = latestPrayerDay.localDate
    while (prayerHistoryByDate.get(cursor)?.completed === prayerHistoryByDate.get(cursor)?.total && (prayerHistoryByDate.get(cursor)?.total ?? 0) > 0) {
      prayerStreak += 1
      cursor = shiftDateKey(cursor, -1)
    }
  }
  const monthlyCompleted = prayerHistory.reduce((sum, day) => sum + day.completed, 0)
  const monthlyTotal = prayerHistory.reduce((sum, day) => sum + day.total, 0)
  const monthlyRate = Math.round((monthlyCompleted / Math.max(monthlyTotal, 1)) * 100)
  const prayerStatusAnalysisLabels: Record<PrayerStatus, string> = { pending: 'لم تُسجّل', done: 'في وقتها', 'on-time': 'في وقتها', congregation: 'جماعة', qada: 'قضاء', missed: 'فائتة' }
  const prayerStatusAnalysis = (['on-time', 'congregation', 'qada', 'missed', 'pending'] as const).map((status) => ({
    status,
    label: prayerStatusAnalysisLabels[status],
    count: prayerHistory.reduce((sum, day) => sum + (day.statusCounts?.[status] ?? 0) + (status === 'on-time' ? (day.statusCounts?.done ?? 0) : 0), 0),
  }))
  const missedPrayerCounts = prayerHistory.reduce<Record<string, number>>((counts, day) => {
    Object.entries(day.missedByPrayer ?? {}).forEach(([name, count]) => { counts[name] = (counts[name] ?? 0) + count })
    return counts
  }, {})
  const mostMissedPrayer = Object.entries(missedPrayerCounts).sort((left, right) => right[1] - left[1])[0]
  const tasbeehCount = religious.dhikr.tasbeehCount ?? 0
  const tasbeehTarget = religious.dhikr.tasbeehTarget ?? 100
  const tasbeehPercent = Math.round((tasbeehCount / Math.max(tasbeehTarget, 1)) * 100)
  const dhikrCompleted = (['morning', 'evening'] as const).reduce((total, session) => total + dhikrGroups[session].items.reduce((sessionTotal, item) => sessionTotal + Math.min(dhikrTarget, religious.dhikr[`${session}Progress`]?.[item.id] ?? 0), 0), 0)
  const dhikrTotal = dhikrTarget * dhikrGroups.morning.items.length * 2
  const dhikrPercent = Math.round((dhikrCompleted / Math.max(dhikrTotal, 1)) * 100)
  const quranTextClass = quranFontScale === 'sm' ? 'text-base leading-8' : quranFontScale === 'lg' ? 'text-2xl leading-[2.4]' : 'text-lg leading-9'
  const listenLater = religious.quran.listenLater ?? []
  const listenedSurahNumbers = religious.quran.listenedSurahNumbers ?? []
  const currentSurahIsLater = listenLater.includes(selectedSurah)
  const currentSurahIsListened = listenedSurahNumbers.includes(selectedSurah)
  const currentSurahLastPosition = religious.quran.lastPosition?.surahNumber === selectedSurah ? religious.quran.lastPosition : undefined
  const surahOptions: SurahCatalogEntry[] = surahCatalog.length > 0 ? surahCatalog : memorizationSurahOptions.map((surah) => ({ number: surah.number, name: surah.name }))

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
    const updateClock = () => setClockMs(Date.now())
    updateClock()
    const timer = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    setSurahCatalogState('loading')
    fetch('/api/religious/quran?catalog=surahs', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json() as QuranResponse
        if (!response.ok || !payload.surahs?.length) throw new Error(payload.error || 'تعذر تحميل فهرس السور.')
        if (active) {
          setSurahCatalog(payload.surahs)
          setSurahCatalogState('success')
          setSurahCatalogMessage('تم تحميل فهرس السور الكامل من المصدر الموثوق.')
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setSurahCatalogState('error')
          setSurahCatalogMessage(error instanceof Error ? `${error.message} تظهر قائمة مختصرة مؤقتة.` : 'تعذر تحميل الفهرس؛ تظهر قائمة مختصرة مؤقتة.')
        }
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    setQuranState('loading')
    setQuranMessage(quranMode === 'juz' ? 'جاري جلب آيات الجزء من المصدر الخارجي…' : 'جاري جلب نص السورة من المصدر الخارجي…')
    const query = quranMode === 'juz' ? `juz=${selectedJuz}` : `surah=${selectedSurah}`
    fetch(`/api/religious/quran?${query}`, { cache: 'no-store' })
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
  }, [quranMode, quranRetryToken, selectedJuz, selectedSurah])

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

  useEffect(() => {
    if (quranMode !== 'surah' || quranState !== 'success' || !currentSurahLastPosition?.ayahNumber) return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`quran-ayah-${selectedSurah}-${currentSurahLastPosition.ayahNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [currentSurahLastPosition?.ayahNumber, quranMode, quranState, selectedSurah])

  function playSelectedSurah(surahNumber = selectedSurah) {
    if (!selectedReciter?.server) return
    const url = `${selectedReciter.server}${String(surahNumber).padStart(3, '0')}.mp3`
    setAudioUrl(url)
    setIsPlaying(true)
  }

  function resumeSavedQuranPosition() {
    const saved = religious.quran.lastPosition
    if (!saved) return
    setQuranMode('surah')
    setSelectedSurah(saved.surahNumber)
    playSelectedSurah(saved.surahNumber)
  }

  function seekAudio(offsetSeconds: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.duration || Number.MAX_SAFE_INTEGER, audio.currentTime + offsetSeconds))
  }

  function saveCurrentAudioPosition() {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.currentTime) || audio.currentTime <= 0) return
    saveQuranPosition({ surahNumber: selectedSurah, positionSeconds: Math.round(audio.currentTime), ayahNumber: currentSurahLastPosition?.ayahNumber, reciterId: selectedReciter?.id })
  }

  function saveCurrentAyahPosition(ayahNumber: number) {
    const audio = audioRef.current
    const audioPosition = audio && Number.isFinite(audio.currentTime) ? Math.max(0, Math.round(audio.currentTime)) : currentSurahLastPosition?.positionSeconds ?? 0
    saveQuranPosition({ surahNumber: selectedSurah, positionSeconds: audioPosition, ayahNumber, reciterId: selectedReciter?.id })
  }

  function formatAudioTime(seconds: number) {
    const safeSeconds = Math.max(0, Math.round(seconds))
    return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`
  }

  function submitDua(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!duaInput.trim()) {
      setDuaError('اكتب الدعاء أولًا.')
      return
    }
    addSavedDua(duaInput.trim())
    setDuaInput('')
    setDuaError('')
  }

  function submitPlaylist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!playlistName.trim()) {
      setPlaylistError('اكتب اسم القائمة أولًا.')
      return
    }
    createQuranPlaylist(playlistName.trim(), selectedSurah)
    setPlaylistName('')
    setPlaylistError('')
  }

  const nextPrayer = getNextPrayerCountdown(religious.prayerLogs, clockMs)

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
        {nextPrayer && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/10 px-3 py-3"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /><div><p className="text-xs font-semibold text-surface-dark-foreground">الصلاة القادمة: {nextPrayer.name}{nextPrayer.tomorrow ? ' · غدًا' : ''}</p><p className="mt-1 text-xs text-surface-dark-foreground/70">موعدها {nextPrayer.time}</p></div></div><strong className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground" aria-label={`الوقت المتبقي لصلاة ${nextPrayer.name}`}>{formatPrayerCountdown(nextPrayer.remainingMs)}</strong></div>}
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
        <div id="prayer-tracker" className="scroll-mt-24 lg:col-span-3">
          <ContentCard className="h-full" title="صلوات اليوم" description={`${completedPrayers} من ${religious.prayerLogs.length} صلوات مكتملة`} action={<span className="text-sm font-semibold text-primary">{prayerPercent}%</span>}>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${prayerPercent}%` }} /></div>
            <div className="mb-3 flex justify-end"><Link href="/daily-plan#plan-item-plan-3" className={buttonVariants({ size: 'sm', variant: 'ghost' })}>فتح الصلاة في خطة اليوم</Link></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {religious.prayerLogs.map((prayer) => {
                const Icon = prayerIcons[prayer.name] ?? Clock3
                const done = isPrayerCompletedStatus(prayer.status)
                const statusLabel = prayerStatusLabels[prayer.status]
                return <div key={prayer.id} className={`flex items-center gap-3 rounded-2xl border p-3 text-right transition-colors ${done ? 'border-primary/30 bg-primary/8' : prayer.status === 'missed' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-background'}`}>
                  <Button type="button" variant="ghost" aria-pressed={done} onClick={() => togglePrayer(prayer.id)} className="h-auto min-w-0 flex-1 justify-start gap-3 p-0 text-right">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${done ? 'bg-primary text-primary-foreground' : prayer.status === 'missed' ? 'bg-destructive/10 text-destructive' : 'bg-accent text-accent-foreground'}`}><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">صلاة {prayer.name}</span><span className="mt-1 block text-xs text-muted-foreground">{prayer.time} · {statusLabel}</span></span>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'border-primary bg-primary text-primary-foreground' : prayer.status === 'missed' ? 'border-destructive text-destructive' : 'border-border'}`}>{done && <Check className="h-3.5 w-3.5" />}</span>
                  </Button>
                  <Select aria-label={`حالة صلاة ${prayer.name}`} value={prayer.status} onChange={(event) => togglePrayer(prayer.id, event.currentTarget.value as PrayerStatus)} className="w-24 shrink-0 rounded-xl border-border bg-background px-2 py-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {prayerStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                </div>
              })}
            </div>
          </ContentCard>
        </div>

        <div id="quran-progress" className="scroll-mt-24 lg:col-span-2">
          <ContentCard className="h-full" title="الورد اليومي" description="التقدم محفوظ دون تخزين النص الخارجي.">
          <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><BookOpen className="h-6 w-6" /></span><div><p className="text-sm font-semibold">{religious.quran.reference}</p><p className="mt-1 text-xs text-muted-foreground">{wirdCompleted} من {wirdTarget} {wirdModeConfig.unit}</p></div></div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, wirdPercent)}%` }} /></div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>{Math.min(100, wirdPercent)}% مكتمل</span><span>المتبقي {Math.max(0, wirdTarget - wirdCompleted)} {wirdModeConfig.unit}</span></div>
          <div className="mt-5 space-y-3"><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={() => addWirdProgress(wirdModeConfig.smallStep)}>+ {wirdModeConfig.smallStep} {wirdModeConfig.unit}</Button><Button size="sm" onClick={() => addWirdProgress(wirdModeConfig.largeStep)}>أنجزت {wirdModeConfig.largeStep} {wirdModeConfig.unit}</Button></div><div className="flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 text-xs text-muted-foreground"><span>نوع الورد</span><Select aria-label="نوع الورد اليومي" value={wirdMode} onChange={(event) => { const nextMode = event.currentTarget.value as QuranWirdMode; const nextConfig = wirdModeOptions.find((option) => option.value === nextMode) ?? wirdModeOptions[0]; setWirdTarget(nextConfig.targets[0].value, nextMode) }} className="rounded-xl border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{wirdModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label><label className="flex items-center gap-2 text-xs text-muted-foreground"><span>الهدف</span><Select aria-label="هدف الورد اليومي" value={wirdTarget} onChange={(event) => setWirdTarget(Number(event.currentTarget.value), wirdMode)} className="rounded-xl border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{wirdModeConfig.targets.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label><Link href="/daily-plan#plan-item-plan-4" className={buttonVariants({ size: 'sm', variant: 'ghost' })}>فتح في خطة اليوم</Link><Link href="/habits#habit-1" className={buttonVariants({ size: 'sm', variant: 'ghost' })}>فتح عادة القرآن</Link></div></div>
          </ContentCard>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ContentCard title="ثبات الصلاة" description="مؤشر مبني على الأيام المسجلة داخل حسابك." action={<Flame className="h-5 w-5 text-primary" />}>
          <div className="flex items-end justify-between gap-4"><div><p className="text-4xl font-bold tracking-tight text-primary">{prayerStreak}</p><p className="mt-1 text-sm text-muted-foreground">أيام متتالية مكتملة</p></div><div className="rounded-2xl bg-accent/60 p-3 text-left"><p className="text-xs text-muted-foreground">آخر سجل</p><p className="mt-1 text-sm font-semibold">{prayerHistory.at(-1)?.localDate ?? 'لا يوجد'}</p></div></div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-muted/50 p-3"><span className="block text-xs text-muted-foreground">آخر 30 يومًا</span><strong className="mt-1 block">{monthlyRate}%</strong></div><div className="rounded-2xl bg-muted/50 p-3"><span className="block text-xs text-muted-foreground">سجلات محفوظة</span><strong className="mt-1 block">{prayerHistory.length} يوم</strong></div></div>
          <div className="mt-5 rounded-2xl border border-border bg-background/70 p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-muted-foreground">تقويم آخر 30 يومًا</span><span className="text-[11px] text-muted-foreground">مكتمل / جزئي / غير مسجل</span></div><div className="mt-3 grid grid-cols-10 gap-1.5" aria-label="تقويم متابعة الصلاة">{Array.from({ length: 30 }, (_, index) => shiftDateKey(getCairoDateKey(), index - 29)).map((day) => { const record = prayerHistoryByDate.get(day); const complete = record && record.completed >= record.total; const partial = record && record.completed > 0 && !complete; return <span key={day} title={`${day} · ${record ? `${record.completed}/${record.total}` : 'غير مسجل'}`} className={`aspect-square rounded-md border ${complete ? 'border-primary/30 bg-primary' : partial ? 'border-partial-foreground/35 bg-partial' : 'border-border bg-muted/50'}`} /> })}</div></div>
          <div className="mt-5 rounded-2xl border border-border bg-background/70 p-3"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><BarChart3 className="h-3.5 w-3.5 text-primary" />تحليل أنواع الحالات</span><span className="text-[11px] text-muted-foreground">من السجلات المحفوظة</span></div><div className="mt-3 space-y-2.5">{prayerStatusAnalysis.map(({ status, label, count }) => { const share = Math.round((count / Math.max(prayerHistory.length * 5, 1)) * 100); return <div key={status} className="flex items-center gap-2 text-xs"><span className="w-16 shrink-0 text-muted-foreground">{label}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${status === 'missed' ? 'bg-destructive' : status === 'pending' ? 'bg-muted-foreground/40' : 'bg-primary'}`} style={{ width: `${Math.min(100, share)}%` }} /></div><strong className="w-6 text-left text-foreground">{count}</strong></div> })}</div><div className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-xs"><span className="text-muted-foreground">الأكثر فواتًا: </span><strong>{mostMissedPrayer ? `${mostMissedPrayer[0]} · ${mostMissedPrayer[1]} مرات` : 'لا توجد فائتة مسجلة'}</strong></div></div>
        </ContentCard>
        <ContentCard title="خطة الحفظ" description="تقدم تقريبي تحفظه أنت؛ لا يتم تخزين نص الآيات." action={<BookOpen className="h-5 w-5 text-primary" />}>
          <div className="flex items-center justify-between text-sm"><span>الإنجاز الحالي</span><strong>{memorizationCompleted} من {memorizationTarget} آيات</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, memorizationPercent)}%` }} /></div><div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{memorizationPercent}% مكتمل</span><span>المتبقي {Math.max(0, memorizationTarget - memorizationCompleted)}</span></div>          <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => addMemorizationProgress(1)}><Plus className="ms-1 h-3.5 w-3.5" /> آية</Button><Button size="sm" onClick={() => addMemorizationProgress(3)}>أنجزت 3 آيات</Button></div>
          <div className="mt-5 rounded-2xl border border-border bg-background/70 p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-muted-foreground">حالة السور</span><span className="text-[11px] text-muted-foreground">{memorizedSurahCount} من {memorizationSurahOptions.length} محفوظة</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{memorizationSurahOptions.map(({ number, name }) => { const status = memorizationSurahStatus[number] ?? 'learning'; return <label key={number} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs"><span className="min-w-0 font-medium">{number} — {name}</span><Select aria-label={`حالة حفظ سورة ${name}`} value={status} onChange={(event) => setMemorizationSurahStatus(number, event.currentTarget.value as MemorizationSurahStatus)} className="min-w-0 rounded-lg border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{memorizationStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label> })}</div></div>
          <div className="mt-4 rounded-2xl border border-border bg-background/70 p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-muted-foreground">جدول المراجعة المقترح</span><span className="text-[11px] text-muted-foreground">يتغير حسب حالة كل سورة</span></div><div className="mt-3 space-y-2" role="table" aria-label="جدول مراجعة السور المقترح"><div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 px-2 text-[11px] text-muted-foreground" role="row"><span role="columnheader">السورة</span><span role="columnheader">المراجعة</span><span role="columnheader">الخطة</span></div>{memorizationReviewRows.map((row) => <div key={row.number} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-xl bg-muted/40 px-2 py-2 text-xs" role="row"><span className="min-w-0 font-medium" role="cell">{row.number} — {row.name}<span className="mt-0.5 block text-[10px] text-muted-foreground">{row.statusLabel}</span></span><span className="whitespace-nowrap text-muted-foreground" role="cell">{row.nextReview}</span><span className="whitespace-nowrap rounded-lg bg-accent px-2 py-1 text-[10px] text-accent-foreground" role="cell">{row.guidance}</span></div>)}</div><p className="mt-3 text-[11px] text-muted-foreground">هذا اقتراح تنظيمي قابل للتعديل، وليس تذكيرًا تلقائيًا أو حكمًا دينيًا.</p></div>
        </ContentCard>
        <ContentCard title="السنن والنوافل" description="قائمة تذكير يومية محلية قابلة للتعديل من هاتفك." action={<Sparkles className="h-5 w-5 text-primary" />}><div className="grid gap-2">{[['duha', 'صلاة الضحى'], ['witr', 'الوتر'], ['rawatib', 'السنن الرواتب'], ['sadaqah', 'صدقة أو إحسان']].map(([id, label]) => <Button key={id} type="button" variant="ghost" onClick={() => toggleSunnah(id as 'duha' | 'witr' | 'rawatib' | 'sadaqah')} className={`h-auto w-full justify-start gap-3 rounded-2xl border p-3 text-right text-sm transition-colors ${religious.dhikr.sunnahChecks?.[id as 'duha' | 'witr' | 'rawatib' | 'sadaqah'] ? 'border-primary/30 bg-primary/8' : 'border-border bg-background hover:bg-muted'}`}>
<span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${religious.dhikr.sunnahChecks?.[id as 'duha' | 'witr' | 'rawatib' | 'sadaqah'] ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{religious.dhikr.sunnahChecks?.[id as 'duha' | 'witr' | 'rawatib' | 'sadaqah'] && <Check className="h-3 w-3" />}</span><span className="flex-1">{label}</span></Button>)}</div></ContentCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ContentCard title="السبحة الإلكترونية" description="عداد محلي بسيط للذكر، يُحفظ تقدمُه ضمن إعداداتك الشخصية." action={<span className="text-sm font-semibold text-primary">{tasbeehCount} / {tasbeehTarget}</span>}>
          <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/20 bg-accent text-2xl font-bold text-primary">{tasbeehCount % 100}</div><div className="flex-1"><p className="text-sm font-semibold">ورد التسبيح الحالي</p><p className="mt-1 text-xs text-muted-foreground">{Math.min(100, tasbeehPercent)}% من الهدف المحدد</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, tasbeehPercent)}%` }} /></div></div></div>
          <div className="mt-4 flex flex-wrap items-center gap-2"><Button size="sm" onClick={() => addTasbeeh(1)}>تسبيحة واحدة</Button><Button size="sm" variant="outline" onClick={() => addTasbeeh(10)}>+ 10</Button><Button size="sm" variant="ghost" onClick={() => addTasbeeh(33)}>+ 33</Button><label className="ms-auto flex items-center gap-2 text-xs text-muted-foreground"><span>الهدف</span><Select aria-label="هدف السبحة" value={tasbeehTarget} onChange={(event) => setTasbeehTarget(Number(event.currentTarget.value))} className="h-auto w-auto px-2 py-1.5 text-foreground"><option value={33}>33</option><option value={100}>100</option><option value={1000}>1000</option></Select></label><Button size="sm" variant="outline" onClick={resetTasbeeh}>تصفير</Button></div>
        </ContentCard>
        <ContentCard title="أدعية محفوظة" description="مساحة قصيرة لحفظ الأدعية التي تريد العودة إليها، دون جلب نصوص خارجية تلقائيًا." action={<span className="text-xs text-muted-foreground">{religious.dhikr.savedDuas?.length ?? 0} محفوظ</span>}>
          <form className="flex flex-wrap gap-2" onSubmit={submitDua} noValidate><Input value={duaInput} onChange={(event) => { setDuaInput(event.target.value); if (duaError) setDuaError('') }} placeholder="اكتب دعاءً قصيرًا" aria-label="دعاء جديد" aria-invalid={Boolean(duaError)} aria-describedby={duaError ? 'saved-dua-error' : undefined} className="min-w-0 flex-1" /><Button type="submit" size="sm">حفظ</Button>{duaError && <p id="saved-dua-error" role="alert" className="basis-full text-xs text-destructive">{duaError}</p>}</form>
          <div className="mt-3 space-y-2">{(religious.dhikr.savedDuas ?? []).map((dua, index) => <div key={`${dua}-${index}`} className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-sm"><span className="flex-1 leading-6">{dua}</span><Button type="button" size="icon" variant="ghost" aria-label="حذف الدعاء" onClick={() => removeSavedDua(index)}><Trash2 className="h-4 w-4" /></Button></div>)}</div>
        </ContentCard>
      </div>

      <ContentCard title="المصحف والتلاوة" description={quran?.mode === 'juz' && quran.juz?.name ? `${quran.juz.name} · ${quran.ayahs?.length ?? 0} آية` : quran?.surah?.name ? `${quran.surah.name} · ${quran.surah.numberOfAyahs ?? 0} آية` : 'النص والتلاوة يجلبان عند الطلب من مصادر خارجية موثوقة.'} action={<span className="text-xs text-muted-foreground">{quranMessage}</span>}>
        <div className="grid gap-3 md:grid-cols-[auto_1fr_1fr_auto]">
          <label className="space-y-2 text-sm font-medium"><span>طريقة التصفح</span><Select aria-label="طريقة تصفح المصحف" value={quranMode} onChange={(event) => setQuranMode(event.currentTarget.value as 'surah' | 'juz')}><option value="surah">سورة</option><option value="juz">جزء</option></Select></label>
          {quranMode === 'juz' ? <label className="space-y-2 text-sm font-medium"><span>الجزء</span><Select aria-label="الجزء" value={selectedJuz} onChange={(event) => setSelectedJuz(Number(event.currentTarget.value))}>{Array.from({ length: 30 }, (_, index) => index + 1).map((juz) => <option key={juz} value={juz}>الجزء {juz}</option>)}</Select></label> : <label className="space-y-2 text-sm font-medium"><span>السورة</span><Select aria-label="السورة" value={selectedSurah} onChange={(event) => setSelectedSurah(Number(event.currentTarget.value))}>{surahOptions.map((surah) => <option key={surah.number} value={surah.number}>{surah.number} — {surah.name.replace(/^سُورَةُ\s*/, '')}</option>)}</Select></label>}
          <label className="space-y-2 text-sm font-medium"><span>القارئ</span><Select value={selectedReciter?.id ?? ''} onChange={(event) => setSelectedReciter(reciters.find((reciter) => reciter.id === Number(event.target.value)) ?? null)} disabled={!reciters.length}><option value="">{reciters.length ? 'اختر قارئًا' : 'جاري تحميل القراء…'}</option>{reciters.map((reciter) => <option key={reciter.id} value={reciter.id}>{reciter.name}</option>)}</Select></label>
          <div className="flex items-end"><Button onClick={() => playSelectedSurah()} disabled={!selectedReciter || quranState === 'loading'}><Play className="ms-1 h-4 w-4" /> تشغيل السورة</Button></div>
        </div>
        {quranMode === 'surah' && <p className="mt-2 text-xs text-muted-foreground" role="status">{surahCatalogState === 'loading' ? 'جاري تحميل فهرس السور الكامل…' : surahCatalogMessage || 'يمكنك اختيار أي سورة من الفهرس الكامل.'}</p>}
        {audioUrl && <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-3"><div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-primary" /> {selectedReciter?.name} · {isPlaying ? 'تعمل الآن' : 'متوقفة'}</span><div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" variant="ghost" onClick={() => seekAudio(-15)} aria-label="رجوع 15 ثانية"><Rewind className="ms-1 h-3.5 w-3.5" /> 15 ثانية</Button><Button type="button" size="sm" variant="ghost" onClick={() => seekAudio(15)} aria-label="تقديم 15 ثانية"><Forward className="ms-1 h-3.5 w-3.5" /> 15 ثانية</Button><label className="flex items-center gap-1"><span>السرعة</span><Select aria-label="سرعة التلاوة" value={audioRate} onChange={(event) => setAudioRate(Number(event.target.value))} className="h-auto w-auto rounded-lg px-2 py-1"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></Select></label><Button type="button" size="sm" variant="ghost" onClick={saveCurrentAudioPosition}>حفظ الموضع الحالي</Button></div></div><audio ref={audioRef} controls autoPlay src={audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => { setIsPlaying(false); saveCurrentAudioPosition() }} onEnded={() => { setIsPlaying(false); saveCurrentAudioPosition() }} className="w-full" /></div>}
        {religious.quran.lastPosition && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground"><span>موضع محفوظ: السورة {religious.quran.lastPosition.surahNumber}{religious.quran.lastPosition.ayahNumber ? ` · الآية ${religious.quran.lastPosition.ayahNumber}` : ''} · {formatAudioTime(religious.quran.lastPosition.positionSeconds)}</span><Button type="button" size="sm" variant="outline" onClick={resumeSavedQuranPosition} disabled={!selectedReciter}>أكمل من حيث توقفت</Button></div>}
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_1.2fr]"><form className="flex flex-wrap gap-2" onSubmit={submitPlaylist} noValidate><Input value={playlistName} onChange={(event) => { setPlaylistName(event.target.value); if (playlistError) setPlaylistError('') }} placeholder="اسم قائمة جديدة" aria-label="اسم قائمة تلاوة جديدة" aria-invalid={Boolean(playlistError)} aria-describedby={playlistError ? 'quran-playlist-error' : undefined} className="min-w-0 flex-1" /><Button type="submit" size="sm"><Plus className="ms-1 h-3.5 w-3.5" /> إنشاء قائمة</Button>{playlistError && <p id="quran-playlist-error" role="alert" className="basis-full text-xs text-destructive">{playlistError}</p>}</form><div className="space-y-2">{(religious.quran.playlists ?? []).length === 0 ? <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">أنشئ قائمة واحفظ فيها السورة الحالية للعودة إليها لاحقًا.</p> : (religious.quran.playlists ?? []).map((playlist) => <div key={playlist.id} className="rounded-xl border border-border p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{playlist.name}</p><span className="text-xs text-muted-foreground">{playlist.surahNumbers.length} سور</span></div><div className="mt-2 flex flex-wrap gap-2">{playlist.surahNumbers.map((surahNumber) => <Button key={surahNumber} type="button" size="sm" variant={surahNumber === selectedSurah ? 'secondary' : 'outline'} onClick={() => toggleQuranPlaylistSurah(playlist.id, surahNumber)} aria-pressed={surahNumber === selectedSurah}>السورة {surahNumber}</Button>)}<Button type="button" size="sm" variant="ghost" onClick={() => toggleQuranPlaylistSurah(playlist.id, selectedSurah)}>{playlist.surahNumbers.includes(selectedSurah) ? 'إزالة الحالية' : 'إضافة الحالية'}</Button></div></div>)}</div></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2"><div><p className="text-xs font-semibold text-foreground">حالة السورة الحالية</p><p className="mt-1 text-xs text-muted-foreground">{listenLater.length} في «أسمعه بعدين» · {listenedSurahNumbers.length} تم الاستماع إليها</p></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant={currentSurahIsLater ? 'secondary' : 'outline'} onClick={() => toggleQuranListenLater(selectedSurah)}>{currentSurahIsLater ? 'إزالة من أسمعه بعدين' : 'أسمعه بعدين'}</Button><Button type="button" size="sm" variant={currentSurahIsListened ? 'secondary' : 'outline'} onClick={() => toggleQuranListened(selectedSurah)}>{currentSurahIsListened ? 'إلغاء تم الاستماع' : 'تم الاستماع'}</Button></div></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2"><span className="text-xs text-muted-foreground">حجم الخط</span><div className="flex items-center gap-1" role="group" aria-label="حجم خط المصحف"><Button type="button" size="sm" variant={quranFontScale === 'sm' ? 'secondary' : 'ghost'} onClick={() => setQuranFontScale('sm')} aria-label="حجم خط صغير">صغير</Button><Button type="button" size="sm" variant={quranFontScale === 'md' ? 'secondary' : 'ghost'} onClick={() => setQuranFontScale('md')} aria-label="حجم خط متوسط">متوسط</Button><Button type="button" size="sm" variant={quranFontScale === 'lg' ? 'secondary' : 'ghost'} onClick={() => setQuranFontScale('lg')} aria-label="حجم خط كبير">كبير</Button></div></div>
        <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-border bg-background p-4" dir="rtl">{quranState === 'loading' && <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin text-primary" /> جاري تحميل الآيات…</div>}{quranState === 'error' && <div className="flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-destructive"><span>{quranMessage}</span><Button type="button" size="sm" variant="outline" onClick={() => setQuranRetryToken((token) => token + 1)}>إعادة المحاولة</Button></div>}{quranState === 'success' && quran?.ayahs?.map((ayah) => { const ayahNumber = ayah.number ?? 0; const ayahSurahNumber = ayah.surahNumber ?? selectedSurah; const favorite = religious.quran.favoriteAyahs?.find((item) => item.surahNumber === ayahSurahNumber && item.ayahNumber === ayahNumber); const isLastReadAyah = quranMode === 'surah' && currentSurahLastPosition?.ayahNumber === ayahNumber; return <div id={`quran-ayah-${ayahSurahNumber}-${ayahNumber}`} key={`${ayahSurahNumber}-${ayahNumber}`} className={`flex items-start gap-3 border-b border-border/60 py-3 last:border-0 ${isLastReadAyah ? 'rounded-xl bg-primary/5 px-2' : ''}`}><p className={quranTextClass}>{quranMode === 'juz' && ayah.surahName ? <span className="mb-1 block text-xs font-semibold text-primary">{ayah.surahName}</span> : null}{ayah.text} <span className="me-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1 text-xs text-accent-foreground">{ayah.number}</span></p><div className="flex shrink-0 flex-wrap items-center justify-end gap-1">{quranMode === 'surah' && <Button type="button" size="sm" variant={isLastReadAyah ? 'secondary' : 'ghost'} onClick={() => saveCurrentAyahPosition(ayahNumber)} aria-label={isLastReadAyah ? `آخر موضع محفوظ عند الآية ${ayahNumber}` : `حفظ آخر موضع عند الآية ${ayahNumber}`} aria-pressed={isLastReadAyah}>{isLastReadAyah ? 'آخر موضع' : 'احفظ الموضع'}</Button>}<Button type="button" size="sm" variant={favorite ? 'secondary' : 'ghost'} onClick={() => favorite ? removeQuranFavoriteAyah(favorite.id) : saveQuranFavoriteAyah({ surahNumber: ayahSurahNumber, ayahNumber })} aria-label={favorite ? `إزالة الآية ${ayahNumber} من المفضلة` : `حفظ الآية ${ayahNumber}`} aria-pressed={Boolean(favorite)}><Heart className={`ms-1 h-4 w-4 ${favorite ? 'fill-current' : ''}`} />{favorite ? 'محفوظة' : 'حفظ الآية'}</Button></div></div>})}</div>
        {(religious.quran.favoriteAyahs ?? []).length > 0 && <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center justify-between gap-2"><div><p className="text-sm font-semibold">آياتي المفضلة</p><p className="mt-1 text-xs text-muted-foreground">أضف تدبرك الشخصي بجانب مرجع الآية. النص يُعرض من المصدر عند فتح السورة.</p></div><span className="text-xs font-semibold text-primary">{religious.quran.favoriteAyahs?.length} آية</span></div><div className="mt-3 space-y-3">{religious.quran.favoriteAyahs?.map((favorite) => <div key={favorite.id} className="rounded-xl border border-border bg-background p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">سورة {favorite.surahNumber} · الآية {favorite.ayahNumber}</p><Button type="button" size="sm" variant="ghost" onClick={() => removeQuranFavoriteAyah(favorite.id)} aria-label={`حذف الآية ${favorite.ayahNumber} من المفضلة`}><Trash2 className="ms-1 h-4 w-4" /> حذف</Button></div><label className="mt-2 block space-y-1 text-xs text-muted-foreground"><span>خانة التدبر</span><Textarea defaultValue={favorite.reflection} onBlur={(event) => saveQuranFavoriteAyah({ surahNumber: favorite.surahNumber, ayahNumber: favorite.ayahNumber, reflection: event.currentTarget.value })} placeholder="ما الذي تريد تذكره أو تطبيقه؟" className="min-h-16 text-foreground" /></label></div>)}</div></div>}
        <p className="mt-3 text-xs text-muted-foreground">النص من AlQuran Cloud، والتلاوة من MP3Quran. التطبيق يحفظ مراجع الآيات وتدبرك فقط ولا يستضيف المحتوى الديني.</p>
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
          <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> المدينة</span><Input value={religious.city} onChange={(event) => updateReligiousSettings({ city: event.target.value, calculationMethod: religious.calculationMethod })} placeholder="Cairo" /></label><label className="space-y-2 text-sm font-medium"><span>طريقة الحساب</span><Select value={religious.calculationMethod} onChange={(event) => updateReligiousSettings({ city: religious.city, calculationMethod: event.target.value })}><option>مخصص</option><option>الهيئة المصرية العامة للمساحة</option><option>رابطة العالم الإسلامي</option></Select></label></div>
          <div className={`mt-4 flex items-start gap-2 rounded-2xl p-3 text-xs ${timingState === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-muted/60 text-muted-foreground'}`}><Sunrise className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {timingState === 'error' ? timingMessage : 'المصدر الحالي AlAdhan. عند فشل الشبكة تظل آخر مواقيت محفوظة ظاهرة، ولا تُستخدم البيانات كفتوى أو حكم ديني.'}</div>
        </ContentCard>
      </div>
    </div>
  )
}
