'use client'

import { Archive, Check, Clapperboard, Download, Film, ListPlus, Play, Search, Sparkles, Star, Tv } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ContentCard } from '@/components/ui/content-card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { useCommandCenter, type EntertainmentItem, type EntertainmentStatus, type EntertainmentType } from '@/lib/command-center-store'

const columns: { id: EntertainmentStatus; title: string; description: string; icon: typeof Film }[] = [
  { id: 'want', title: 'عايز أتفرج', description: 'اختياراتك القادمة', icon: ListPlus },
  { id: 'watching', title: 'بتفرج', description: 'اللي مفتوح حاليًا', icon: Play },
  { id: 'completed', title: 'خلصت', description: 'تجاربك وانطباعاتك', icon: Check },
]

const genres = ['كل الأنواع', 'دراما', 'كوميديا', 'خيال علمي', 'غموض', 'أكشن', 'وثائقي', 'دراما هادئة', 'أخرى']

export function EntertainmentWorkspace() {
  const { entertainment, addEntertainment, updateEntertainment, moveEntertainment, archiveEntertainment } = useCommandCenter()
  const [query, setQuery] = useState('')
  const [genreFilter, setGenreFilter] = useState('كل الأنواع')
  const [typeFilter, setTypeFilter] = useState<'all' | EntertainmentType>('all')
  const [showForm, setShowForm] = useState(false)
  const [onlyRecommended, setOnlyRecommended] = useState(false)
  const [onlyDownloads, setOnlyDownloads] = useState(false)
  const [dismissedSuggestionId, setDismissedSuggestionId] = useState<string | undefined>()

  const filteredItems = useMemo(() => entertainment.filter((item) => {
    const matchesQuery = !query.trim() || `${item.title} ${item.genre} ${item.note ?? ''}`.toLocaleLowerCase('ar').includes(query.trim().toLocaleLowerCase('ar'))
    const matchesGenre = genreFilter === 'كل الأنواع' || item.genre === genreFilter
    const matchesType = typeFilter === 'all' || item.type === typeFilter
    const matchesRecommended = !onlyRecommended || item.recommend
    const matchesDownloads = !onlyDownloads || item.downloadWanted
    return matchesQuery && matchesGenre && matchesType && matchesRecommended && matchesDownloads
  }), [entertainment, genreFilter, onlyDownloads, onlyRecommended, query, typeFilter])

  const completed = entertainment.filter((item) => item.status === 'completed')
  const recommended = entertainment.filter((item) => item.recommend)
  const downloads = entertainment.filter((item) => item.downloadWanted)
  const averageRating = completed.filter((item) => item.rating).length
    ? (completed.reduce((sum, item) => sum + (item.rating ?? 0), 0) / completed.filter((item) => item.rating).length).toFixed(1)
    : '—'
  const suggestion = useMemo(() => {
    const ratedCompleted = completed.filter((item) => item.rating).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    const preferredGenre = ratedCompleted[0]?.genre
    const candidates = entertainment
      .filter((item) => item.status === 'want' && item.id !== dismissedSuggestionId)
      .map((item) => ({ item, score: (item.recommend ? 3 : 0) + (preferredGenre && item.genre === preferredGenre ? 4 : 0) }))
      .sort((a, b) => b.score - a.score)
    const selected = candidates[0]?.item
    if (!selected) return undefined
    return { item: selected, preferredGenre }
  }, [completed, dismissedSuggestionId, entertainment])
  const monthlyStats = useMemo(() => {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const watchedThisMonth = completed.filter((item) => isEntertainmentInMonth(item.createdAt, monthKey))
    const ratedThisMonth = watchedThisMonth.filter((item) => item.rating)
    const genreCounts = watchedThisMonth.reduce<Record<string, number>>((counts, item) => {
      counts[item.genre] = (counts[item.genre] ?? 0) + 1
      return counts
    }, {})
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return {
      label: new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(now),
      watchedCount: watchedThisMonth.length,
      average: ratedThisMonth.length ? (ratedThisMonth.reduce((sum, item) => sum + (item.rating ?? 0), 0) / ratedThisMonth.length).toFixed(1) : '—',
      topGenre: topGenre ?? 'لا يوجد بعد',
    }
  }, [completed])

  function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    const genre = String(form.get('genre') ?? '').trim()
    if (!title || !genre) return
    const yearValue = Number(form.get('year') ?? 0)
    addEntertainment({
      title,
      type: String(form.get('type') ?? 'movie') as EntertainmentType,
      genre,
      year: Number.isFinite(yearValue) && yearValue > 0 ? yearValue : undefined,
      note: String(form.get('note') ?? '').trim() || undefined,
      recommend: form.get('recommend') === 'on',
      downloadWanted: form.get('downloadWanted') === 'on',
      status: 'want',
    })
    event.currentTarget.reset()
    setShowForm(false)
  }

  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <SummaryCard label="إجمالي القائمة" value={entertainment.length} icon={Clapperboard} tone="primary" />
      <SummaryCard label="بتفرج حاليًا" value={entertainment.filter((item) => item.status === 'watching').length} icon={Play} tone="accent" />
      <SummaryCard label="خلصت" value={completed.length} icon={Check} tone="success" />
      <SummaryCard label="متوسط التقييم" value={averageRating === '—' ? 'لا يوجد' : `${averageRating} / 5`} icon={Star} tone="warning" />
    </div>

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ContentCard title="اقتراحك القادم" description="اقتراح بسيط من قائمتك، مستند إلى الأعمال التي قيّمتها سابقًا.">
        {suggestion ? <div className="flex flex-col gap-4 rounded-2xl bg-accent/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Sparkles className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate font-semibold">{suggestion.item.title}</p><p className="mt-1 text-xs text-muted-foreground">{suggestion.item.type === 'movie' ? 'فيلم' : 'مسلسل'} · {suggestion.item.genre}{suggestion.preferredGenre === suggestion.item.genre ? ' · قريب من ذوقك الأعلى تقييمًا' : suggestion.item.recommend ? ' · معلّم كترشيح' : ''}</p></div></div>
          <div className="flex shrink-0 gap-2"><Button type="button" size="sm" onClick={() => { moveEntertainment(suggestion.item.id, 'watching'); setDismissedSuggestionId(suggestion.item.id) }} className="rounded-xl px-3 py-2 text-xs font-semibold">ابدأ المشاهدة</Button><Button type="button" size="sm" variant="ghost" onClick={() => setDismissedSuggestionId(suggestion.item.id)} className="rounded-xl bg-muted px-3 py-2 text-xs font-medium">اقتراح آخر</Button></div>
        </div> : <EmptyState icon={Sparkles} title="لا يوجد اقتراح بعد" description="أضف عملاً إلى قائمة المشاهدة أو قيّم تجربة مكتملة ليظهر اقتراح مناسب." />}
      </ContentCard>
      <ContentCard title={`إحصائيات ${monthlyStats.label}`} description="صورة سريعة عن الأعمال التي أنهيتها خلال الشهر الحالي.">
        <div className="grid grid-cols-3 gap-2"><MiniStat label="أعمال مكتملة" value={monthlyStats.watchedCount} /><MiniStat label="متوسط التقييم" value={monthlyStats.average === '—' ? '—' : `${monthlyStats.average}/5`} /><MiniStat label="التصنيف الأبرز" value={monthlyStats.topGenre} /></div>
      </ContentCard>
    </div>

    <ContentCard title="رفّ الترفيه" description="خلي وقت الراحة مقصودًا: اختار ما ستشاهده، سجّل تجربتك، واحتفظ بالترشيحات المهمة.">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في الأفلام والمسلسلات..." aria-label="البحث في الترفيه" className="w-full rounded-2xl py-3 pr-10 pl-4" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | EntertainmentType)} aria-label="نوع العمل" className="rounded-2xl px-3 py-3">
            <option value="all">كل الأنواع</option>
            <option value="movie">أفلام</option>
            <option value="series">مسلسلات</option>
          </Select>
          <Select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)} aria-label="تصنيف الترفيه" className="rounded-2xl px-3 py-3">
            {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
          </Select>
          <Button type="button" variant={onlyRecommended ? 'default' : 'ghost'} onClick={() => setOnlyRecommended((value) => !value)} className={`rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${onlyRecommended ? '' : 'bg-muted text-foreground hover:bg-accent'}`}>مرشّح لحد</Button>
          <Button type="button" variant={onlyDownloads ? 'default' : 'ghost'} onClick={() => setOnlyDownloads((value) => !value)} className={`rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${onlyDownloads ? '' : 'bg-muted text-foreground hover:bg-accent'}`}>عايز أنزله</Button>
          <Button type="button" onClick={() => setShowForm((value) => !value)} className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold"><ListPlus className="h-4 w-4" />إضافة عمل</Button>
        </div>
      </div>
    </ContentCard>

    {showForm && <ContentCard title="إضافة فيلم أو مسلسل" description="أضف التفاصيل الأساسية، وبعد المشاهدة يمكنك تسجيل التقييم والانطباع.">
      <form onSubmit={createItem} className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input name="title" required aria-label="اسم الفيلم أو المسلسل" placeholder="اسم الفيلم أو المسلسل" className="rounded-2xl px-4 py-3" />
        <Select name="type" aria-label="نوع العمل" defaultValue="movie" className="rounded-2xl px-4 py-3"><option value="movie">فيلم</option><option value="series">مسلسل</option></Select>
        <Input name="genre" required aria-label="تصنيف العمل" placeholder="التصنيف، مثال: دراما" className="rounded-2xl px-4 py-3" />
        <Input name="year" type="number" min="1888" max="2100" aria-label="سنة الإصدار الاختيارية" placeholder="سنة الإصدار (اختياري)" className="rounded-2xl px-4 py-3" />
        <Textarea name="note" aria-label="ملاحظة العمل" placeholder="ملاحظة شخصية أو سبب الإضافة" className="min-h-24 rounded-2xl px-4 py-3 md:col-span-2" />
        <label className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm"><Checkbox name="recommend" />أريد ترشيحه لشخص</label>
        <label className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm"><Checkbox name="downloadWanted" />أضيفه لقائمة التحميل</label>
        <div className="flex gap-2 md:col-span-2"><Button type="submit" className="rounded-2xl px-5 py-3 text-sm font-semibold">حفظ في عايز أتفرج</Button><Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-2xl bg-muted px-5 py-3 text-sm font-medium">إلغاء</Button></div>
      </form>
    </ContentCard>}

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {columns.map((column) => {
        const items = filteredItems.filter((item) => item.status === column.id)
        return <ContentCard key={column.id} title={column.title} description={column.description} action={<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{items.length}</span>}>
          <div className="space-y-3">
            {items.map((item) => <EntertainmentCard key={item.id} item={item} onMove={(status) => moveEntertainment(item.id, status)} onUpdate={(patch) => updateEntertainment(item.id, patch)} onArchive={() => archiveEntertainment(item.id)} />)}
            {items.length === 0 && <EmptyState icon={column.icon} title="لا توجد عناصر هنا" description="جرّب تغيير الفلاتر أو أضف عملًا جديدًا إلى رفّ الترفيه." />}
          </div>
        </ContentCard>
      })}
    </div>

    <ContentCard title="قوائم سريعة" description="اختصارات تساعدك تختار وقت الراحة بدل ما تضيعه في التصفح.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickList label="مرشّح لحد" count={recommended.length} icon={Star} active={onlyRecommended} onClick={() => setOnlyRecommended((value) => !value)} />
        <QuickList label="عايز أنزله" count={downloads.length} icon={Download} active={onlyDownloads} onClick={() => setOnlyDownloads((value) => !value)} />
        <QuickList label="أعمال مكتملة" count={completed.length} icon={Check} active={false} onClick={() => { setOnlyRecommended(false); setOnlyDownloads(false); setGenreFilter('كل الأنواع'); setTypeFilter('all'); setQuery('') }} />
      </div>
    </ContentCard>
  </div>
}

function EntertainmentCard({ item, onMove, onUpdate, onArchive }: { item: EntertainmentItem; onMove: (status: EntertainmentStatus) => void; onUpdate: (patch: Partial<EntertainmentItem>) => void; onArchive: () => void }) {
  return <article id={`entertainment-${item.id}`} className="scroll-mt-24 rounded-2xl border border-border bg-background p-3 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">{item.type === 'movie' ? <Film className="h-5 w-5" /> : <Tv className="h-5 w-5" />}</div>
      <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="truncate text-sm font-semibold">{item.title}</h3><Button type="button" variant="ghost" size="icon-sm" onClick={onArchive} aria-label={`أرشفة ${item.title}`} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"><Archive className="h-4 w-4" /></Button></div><p className="mt-1 text-xs text-muted-foreground">{item.type === 'movie' ? 'فيلم' : 'مسلسل'} · {item.genre}{item.year ? ` · ${item.year}` : ''}</p></div>
    </div>
    {item.note && <p className="mt-3 rounded-xl bg-muted/70 px-3 py-2 text-xs leading-6 text-muted-foreground">{item.note}</p>}
    {item.status === 'completed' && <div className="mt-3 space-y-2 rounded-xl bg-muted/70 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">تقييمك</span><div className="flex gap-1" dir="ltr">{[1, 2, 3, 4, 5].map((rating) => <Button variant="ghost" size="icon-xs" type="button" key={rating} onClick={() => onUpdate({ rating })} aria-label={`تقييم ${rating} من 5`} className={`rounded p-0.5 ${rating <= (item.rating ?? 0) ? 'text-warning-foreground' : 'text-muted-foreground'}`}><Star className="h-4 w-4 fill-current" /></Button>)}</div></div><Input value={item.impression ?? ''} onChange={(event) => onUpdate({ impression: event.target.value })} aria-label={`انطباعك عن ${item.title}`} placeholder="سطر انطباع شخصي" className="w-full rounded-xl px-3 py-2 text-xs" /></div>}
    <div className="mt-3 flex flex-wrap items-center gap-2"><Select value={item.status} onChange={(event) => onMove(event.target.value as EntertainmentStatus)} aria-label={`حالة ${item.title}`} className="min-w-0 flex-1 rounded-xl px-3 py-2 text-xs"><option value="want">عايز أتفرج</option><option value="watching">بتفرج</option><option value="completed">خلصت</option></Select><Button type="button" variant={item.recommend ? 'default' : 'ghost'} onClick={() => onUpdate({ recommend: !item.recommend })} className={`rounded-xl px-2.5 py-2 text-xs ${item.recommend ? '' : 'bg-muted text-muted-foreground'}`}><Star className="inline h-3.5 w-3.5" /> ترشيح</Button><Button type="button" variant={item.downloadWanted ? 'default' : 'ghost'} onClick={() => onUpdate({ downloadWanted: !item.downloadWanted })} className={`rounded-xl px-2.5 py-2 text-xs ${item.downloadWanted ? '' : 'bg-muted text-muted-foreground'}`}><Download className="inline h-3.5 w-3.5" /> تحميل</Button></div>
  </article>
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Film; tone: 'primary' | 'accent' | 'success' | 'warning' }) {
  const toneClass = { primary: 'bg-primary/15 text-primary', accent: 'bg-accent text-accent-foreground', success: 'bg-success/15 text-success', warning: 'bg-warning/15 text-warning-foreground' }[tone]
  return <div className="rounded-3xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneClass}`}><Icon className="h-5 w-5" /></div></div></div>
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl bg-muted p-3 text-center"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value}</p></div>
}

function isEntertainmentInMonth(createdAt: string, monthKey: string) {
  const timestamp = Date.parse(createdAt)
  if (!Number.isNaN(timestamp)) {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === monthKey
  }
  return /الآن|اليوم|أمس|منذ/.test(createdAt)
}

function QuickList({ label, count, icon: Icon, active, onClick }: { label: string; count: number; icon: typeof Star; active: boolean; onClick: () => void }) {
  return <Button type="button" variant="ghost" onClick={onClick} className={`flex h-auto w-full items-center justify-between rounded-2xl border px-4 py-4 text-right transition-colors ${active ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted'}`}><span className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-primary" />{label}</span><span className="text-lg font-semibold">{count}</span></Button>
}

