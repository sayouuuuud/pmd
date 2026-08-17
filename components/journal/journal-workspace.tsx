'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpenText, CalendarDays, Clock3, Feather, Save, Smile, Trash2 } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { JournalEntry, useCommandCenter } from '@/lib/command-center-store'

const moods: JournalEntry['mood'][] = ['سعيد', 'هادئ', 'محايد', 'متعب', 'متوتر']

const moodStyles: Record<JournalEntry['mood'], { icon: string; className: string }> = {
  سعيد: { icon: '☀', className: 'border-positive/40 bg-positive/10 text-positive-foreground' },
  هادئ: { icon: '◌', className: 'border-accent/50 bg-accent/40 text-accent-foreground' },
  محايد: { icon: '—', className: 'border-border bg-muted text-muted-foreground' },
  متعب: { icon: '◒', className: 'border-warning/40 bg-warning/10 text-warning-foreground' },
  متوتر: { icon: '×', className: 'border-destructive/30 bg-destructive/10 text-destructive' },
}

function localDateValue(date: Date) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10)
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatLongDate(value: string) {
  return parseDate(value).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatShortDate(value: string) {
  return parseDate(value).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' })
}

type MoodChartPoint = { day: string; date: string; score: number | null; mood?: JournalEntry['mood'] }

const moodScores: Record<JournalEntry['mood'], number> = { متوتر: 1, متعب: 2, محايد: 3, هادئ: 4, سعيد: 5 }
const moodLabels: Record<number, string> = { 1: 'متوتر', 2: 'متعب', 3: 'محايد', 4: 'هادئ', 5: 'سعيد' }

function MoodTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  const score = payload[0]?.value
  return <div className="rounded-2xl border border-border bg-card px-3 py-2 text-xs shadow-lg"><p className="font-semibold">{label ? `يوم ${label}` : 'التدوينة'}</p><p className="mt-1 text-muted-foreground">المزاج: {typeof score === 'number' ? moodLabels[score] : 'غير محدد'}</p></div>
}

export function JournalWorkspace() {
  const { journal, saveJournalEntry, updateJournalEntry, archiveJournalEntry } = useCommandCenter()
  const [selectedDate, setSelectedDate] = useState('2000-01-01')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mood, setMood] = useState<JournalEntry['mood']>('محايد')
  const [notice, setNotice] = useState('')
  const [noticeIsError, setNoticeIsError] = useState(false)

  const entries = useMemo(() => [...journal].sort((a, b) => b.localDate.localeCompare(a.localDate) || b.updatedAt.localeCompare(a.updatedAt)), [journal])
  const selectedEntry = journal.find((entry) => entry.localDate === selectedDate)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestedDate = params.get('date')
    setSelectedDate(requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : localDateValue(new Date()))
  }, [])

  const calendarDays = useMemo(() => {
    const selected = parseDate(selectedDate)
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(selected)
      day.setDate(selected.getDate() - 3 + index)
      return localDateValue(day)
    })
  }, [selectedDate])

  const moodChartData = useMemo<MoodChartPoint[]>(() => {
    const [year, month] = selectedDate.slice(0, 7).split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const monthEntries = new Map(journal.filter((entry) => entry.localDate.startsWith(selectedDate.slice(0, 7))).map((entry) => [entry.localDate, entry]))
    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = String(index + 1).padStart(2, '0')
      const date = `${selectedDate.slice(0, 7)}-${day}`
      const entry = monthEntries.get(date)
      return { day: String(index + 1), date, score: entry ? moodScores[entry.mood] : null, mood: entry?.mood }
    })
  }, [journal, selectedDate])

  const moodMonthLabel = parseDate(`${selectedDate.slice(0, 7)}-01`).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })

  useEffect(() => {
    setTitle(selectedEntry?.title ?? '')
    setBody(selectedEntry?.body ?? '')
    setMood(selectedEntry?.mood ?? 'محايد')
  }, [selectedEntry?.body, selectedEntry?.id, selectedEntry?.mood, selectedEntry?.title, selectedEntry?.updatedAt])

  useEffect(() => {
    setNotice('')
    setNoticeIsError(false)
  }, [selectedDate])

  function selectDate(date: string) {
    setSelectedDate(date)
  }

  function save() {
    if (!title.trim() && !body.trim()) {
      setNotice('اكتب عنوانًا أو سطرًا واحدًا على الأقل قبل الحفظ.')
      setNoticeIsError(true)
      return
    }
    if (selectedEntry) {
      updateJournalEntry(selectedEntry.id, { localDate: selectedDate, title: title.trim() || 'يومياتي', body, mood })
    } else {
      saveJournalEntry({ localDate: selectedDate, title: title.trim() || 'يومياتي', body, mood })
    }
    setNotice('تم حفظ يومياتك محليًا، وستتم مزامنتها تلقائيًا عند توفر الحساب.')
    setNoticeIsError(false)
  }

  function archive() {
    if (!selectedEntry) return
    archiveJournalEntry(selectedEntry.id)
    setTitle('')
    setBody('')
    setMood('محايد')
    setNotice('تم نقل التدوينة إلى الأرشيف.')
    setNoticeIsError(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <JournalMetric icon={BookOpenText} label="إجمالي التدوينات" value={entries.length} />
        <JournalMetric icon={CalendarDays} label="أيام موثقة" value={new Set(entries.map((entry) => entry.localDate)).size} />
        <JournalMetric icon={Feather} label="كلمات اليوم" value={body.trim() ? body.trim().split(/\s+/).length : 0} />
        <JournalMetric icon={Clock3} label="آخر تدوينة" value={entries[0] ? formatShortDate(entries[0].localDate) : 'لا توجد'} />
      </div>

      <ContentCard title="تقلب المزاج" description={`قراءة سريعة لتدوينات ${moodMonthLabel}`}>
        {moodChartData.some((point) => point.score !== null) ? <>
          <div className="h-56 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodChartData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} dy={8} interval="preserveStartEnd" />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={(value: number) => moodLabels[value] ?? ''} width={42} />
                <ReferenceLine y={3} stroke="var(--border)" strokeDasharray="4 4" />
                <Tooltip content={<MoodTooltip />} />
                <Line type="monotone" dataKey="score" connectNulls={false} stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--card)', stroke: 'var(--primary)', strokeWidth: 1.5 }} activeDot={{ r: 5, fill: 'var(--primary)' }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>١ متوتر · ٣ محايد · ٥ سعيد</span><span>{moodChartData.filter((point) => point.score !== null).length} تدوينة موثقة هذا الشهر</span></div>
        </> : <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-xs leading-6 text-muted-foreground">لا توجد تدوينات مزاجية في {moodMonthLabel} بعد. اكتب تدوينة واحدة ليبدأ الرسم في بناء صورة عن الشهر.</div>}
      </ContentCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <ContentCard className="lg:col-span-8" title="مساحة اليوم" description={formatLongDate(selectedDate)}>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/60 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-4 w-4 text-primary" /><span>اختر اليوم الذي تريد الكتابة عنه</span></div>
              <Input aria-label="تاريخ التدوينة" type="date" value={selectedDate} onChange={(event) => selectDate(event.target.value)} className="w-auto rounded-xl px-3 py-2 text-xs" />
            </div>

            <div className="grid grid-cols-7 gap-1.5" aria-label="تقويم اليوميات">
              {calendarDays.map((date) => {
                const active = date === selectedDate
                const hasEntry = journal.some((entry) => entry.localDate === date)
                return <Button key={date} type="button" variant="ghost" onClick={() => selectDate(date)} className={`h-auto rounded-2xl border px-1 py-2 text-center transition ${active ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90' : 'border-border bg-background hover:border-primary/50'}`}><span className="block text-[10px] opacity-70">{parseDate(date).toLocaleDateString('ar-EG', { weekday: 'short' })}</span><span className="mt-1 block text-sm font-semibold">{parseDate(date).getDate()}</span><span className={`mx-auto mt-1 block h-1.5 w-1.5 rounded-full ${hasEntry ? active ? 'bg-primary-foreground' : 'bg-primary' : 'bg-transparent'}`} /></Button>
              })}
            </div>

            <label className="block space-y-2"><span className="text-sm font-semibold">عنوان اليوم</span><Input value={title} onChange={(event) => { setTitle(event.target.value); if (noticeIsError) { setNotice(''); setNoticeIsError(false) } }} aria-invalid={noticeIsError} aria-describedby={noticeIsError ? 'journal-form-error' : undefined} maxLength={120} placeholder="ما العنوان الذي يلخص يومك؟" className="rounded-2xl px-3 py-3 text-sm" /></label>
            <label className="block space-y-2"><span className="text-sm font-semibold">مساحة حرة</span><Textarea value={body} onChange={(event) => { setBody(event.target.value); if (noticeIsError) { setNotice(''); setNoticeIsError(false) } }} aria-invalid={noticeIsError} aria-describedby={noticeIsError ? 'journal-form-error' : undefined} maxLength={6000} rows={10} placeholder="اكتب ما يدور في بالك… لا تحتاج أن تكون مثاليًا أو مرتبًا." className="min-h-0 rounded-2xl px-3 py-3 text-sm leading-8" /></label>

            <div className="space-y-2"><span className="text-sm font-semibold">كيف كان مزاجك؟</span><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{moods.map((option) => <Button key={option} type="button" variant="ghost" onClick={() => setMood(option)} className={`h-auto rounded-2xl border px-2 py-2.5 text-xs font-semibold transition ${mood === option ? moodStyles[option].className : 'border-border bg-background text-muted-foreground hover:border-primary/40'}`}><span className="mb-1 block text-base">{moodStyles[option].icon}</span>{option}</Button>)}</div></div>

            <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between"><p id={noticeIsError ? 'journal-form-error' : undefined} role={notice ? (noticeIsError ? 'alert' : 'status') : undefined} aria-live={notice ? (noticeIsError ? 'assertive' : 'polite') : undefined} aria-atomic={notice ? 'true' : undefined} className={`text-xs ${noticeIsError ? 'text-destructive' : 'text-muted-foreground'}`}>{notice || (selectedEntry ? `آخر تحديث: ${selectedEntry.updatedAt}` : 'هذه المساحة تخص هذا التاريخ فقط.')}</p><div className="flex gap-2"><Button type="button" variant="outline" onClick={archive} disabled={!selectedEntry} className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold"><Trash2 className="h-4 w-4" /> أرشفة</Button><Button type="button" onClick={save} className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold"><Save className="h-4 w-4" /> حفظ التدوينة</Button></div></div>
          </div>
        </ContentCard>

        <ContentCard className="lg:col-span-4" title="دفتر الأيام" description="ارجع إلى ما كتبته عندما تحتاج إلى صورة أهدأ عن نفسك.">
          {entries.length === 0 ? <EmptyJournal /> : <div className="space-y-2">{entries.map((entry) => <Button key={entry.id} id={`journal-${entry.id}`} type="button" variant="ghost" onClick={() => selectDate(entry.localDate)} className={`h-auto w-full scroll-mt-24 rounded-2xl border p-3 text-right transition ${selectedDate === entry.localDate ? 'border-primary bg-primary/5 hover:bg-primary/10' : 'border-border bg-background hover:border-primary/40'}`}><div className="flex w-full items-start justify-between gap-2"><span className="text-xs text-muted-foreground">{formatShortDate(entry.localDate)}</span><span className={`rounded-full px-2 py-1 text-[10px] ${moodStyles[entry.mood].className}`}>{entry.mood}</span></div><p className="mt-2 w-full text-right line-clamp-1 text-sm font-semibold">{entry.title || 'يوميات بلا عنوان'}</p><p className="mt-1 w-full text-right line-clamp-2 text-xs leading-6 text-muted-foreground">{entry.body || 'لا يوجد نص إضافي.'}</p></Button>)}</div>}
          <div className="mt-4 rounded-2xl bg-surface-dark p-4 text-surface-dark-foreground"><div className="flex items-center gap-2 text-sm font-semibold"><Smile className="h-4 w-4 text-primary" /> تذكير لطيف</div><p className="mt-2 text-xs leading-6 text-surface-dark-foreground/65">لا تبحث عن يوم مثالي لتكتب عنه. سطر صادق في يوم عادي قد يكون أكثر ما تحتاجه لاحقًا.</p></div>
        </ContentCard>
      </div>
    </div>
  )
}

function JournalMetric({ icon: Icon, label, value }: { icon: typeof BookOpenText; label: string; value: number | string }) {
  return <div className="rounded-3xl bg-card p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Icon className="h-4 w-4" /></span><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>
}

function EmptyJournal() {
  return <EmptyState icon={BookOpenText} title="دفترك ما زال مفتوحًا" description="ابدأ بتدوينة قصيرة، وستظهر هنا لتعود إليها لاحقًا." />
}
