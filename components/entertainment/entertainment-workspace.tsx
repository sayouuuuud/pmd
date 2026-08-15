'use client'

import { Archive, Check, Clapperboard, Download, Film, ListPlus, Play, Search, Star, Tv } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ContentCard } from '@/components/ui/content-card'
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

    <ContentCard title="رفّ الترفيه" description="خلي وقت الراحة مقصودًا: اختار ما ستشاهده، سجّل تجربتك، واحتفظ بالترشيحات المهمة.">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في الأفلام والمسلسلات..." aria-label="البحث في الترفيه" className="w-full rounded-2xl border border-input bg-background py-3 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | EntertainmentType)} aria-label="نوع العمل" className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="all">كل الأنواع</option>
            <option value="movie">أفلام</option>
            <option value="series">مسلسلات</option>
          </select>
          <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)} aria-label="تصنيف الترفيه" className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
          </select>
          <button type="button" onClick={() => setOnlyRecommended((value) => !value)} className={`rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${onlyRecommended ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent'}`}>مرشّح لحد</button>
          <button type="button" onClick={() => setOnlyDownloads((value) => !value)} className={`rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${onlyDownloads ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent'}`}>عايز أنزله</button>
          <button type="button" onClick={() => setShowForm((value) => !value)} className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><ListPlus className="h-4 w-4" />إضافة عمل</button>
        </div>
      </div>
    </ContentCard>

    {showForm && <ContentCard title="إضافة فيلم أو مسلسل" description="أضف التفاصيل الأساسية، وبعد المشاهدة يمكنك تسجيل التقييم والانطباع.">
      <form onSubmit={createItem} className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input name="title" required placeholder="اسم الفيلم أو المسلسل" className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <select name="type" defaultValue="movie" className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="movie">فيلم</option><option value="series">مسلسل</option></select>
        <input name="genre" required placeholder="التصنيف، مثال: دراما" className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <input name="year" type="number" min="1888" max="2100" placeholder="سنة الإصدار (اختياري)" className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <textarea name="note" placeholder="ملاحظة شخصية أو سبب الإضافة" className="min-h-24 rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring md:col-span-2" />
        <label className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm"><input name="recommend" type="checkbox" className="h-4 w-4 accent-primary" />أريد ترشيحه لشخص</label>
        <label className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm"><input name="downloadWanted" type="checkbox" className="h-4 w-4 accent-primary" />أضيفه لقائمة التحميل</label>
        <div className="flex gap-2 md:col-span-2"><button type="submit" className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">حفظ في عايز أتفرج</button><button type="button" onClick={() => setShowForm(false)} className="rounded-2xl bg-muted px-5 py-3 text-sm font-medium">إلغاء</button></div>
      </form>
    </ContentCard>}

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {columns.map((column) => {
        const items = filteredItems.filter((item) => item.status === column.id)
        return <ContentCard key={column.id} title={column.title} description={column.description} action={<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{items.length}</span>}>
          <div className="space-y-3">
            {items.map((item) => <EntertainmentCard key={item.id} item={item} onMove={(status) => moveEntertainment(item.id, status)} onUpdate={(patch) => updateEntertainment(item.id, patch)} onArchive={() => archiveEntertainment(item.id)} />)}
            {items.length === 0 && <div className="rounded-2xl bg-muted px-4 py-10 text-center text-sm text-muted-foreground">لا توجد عناصر هنا حسب الفلاتر الحالية.</div>}
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
  return <article className="rounded-2xl border border-border bg-background p-3 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">{item.type === 'movie' ? <Film className="h-5 w-5" /> : <Tv className="h-5 w-5" />}</div>
      <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="truncate text-sm font-semibold">{item.title}</h3><button type="button" onClick={onArchive} aria-label={`أرشفة ${item.title}`} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"><Archive className="h-4 w-4" /></button></div><p className="mt-1 text-xs text-muted-foreground">{item.type === 'movie' ? 'فيلم' : 'مسلسل'} · {item.genre}{item.year ? ` · ${item.year}` : ''}</p></div>
    </div>
    {item.note && <p className="mt-3 rounded-xl bg-muted/70 px-3 py-2 text-xs leading-6 text-muted-foreground">{item.note}</p>}
    {item.status === 'completed' && <div className="mt-3 space-y-2 rounded-xl bg-muted/70 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">تقييمك</span><div className="flex gap-1" dir="ltr">{[1, 2, 3, 4, 5].map((rating) => <button type="button" key={rating} onClick={() => onUpdate({ rating })} aria-label={`تقييم ${rating} من 5`} className={`rounded p-0.5 ${rating <= (item.rating ?? 0) ? 'text-warning-foreground' : 'text-muted-foreground'}`}><Star className="h-4 w-4 fill-current" /></button>)}</div></div><input value={item.impression ?? ''} onChange={(event) => onUpdate({ impression: event.target.value })} placeholder="سطر انطباع شخصي" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" /></div>}
    <div className="mt-3 flex flex-wrap items-center gap-2"><select value={item.status} onChange={(event) => onMove(event.target.value as EntertainmentStatus)} aria-label={`حالة ${item.title}`} className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"><option value="want">عايز أتفرج</option><option value="watching">بتفرج</option><option value="completed">خلصت</option></select><button type="button" onClick={() => onUpdate({ recommend: !item.recommend })} className={`rounded-xl px-2.5 py-2 text-xs ${item.recommend ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}><Star className="inline h-3.5 w-3.5" /> ترشيح</button><button type="button" onClick={() => onUpdate({ downloadWanted: !item.downloadWanted })} className={`rounded-xl px-2.5 py-2 text-xs ${item.downloadWanted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}><Download className="inline h-3.5 w-3.5" /> تحميل</button></div>
  </article>
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Film; tone: 'primary' | 'accent' | 'success' | 'warning' }) {
  const toneClass = { primary: 'bg-primary/15 text-primary', accent: 'bg-accent text-accent-foreground', success: 'bg-success/15 text-success', warning: 'bg-warning/15 text-warning-foreground' }[tone]
  return <div className="rounded-3xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneClass}`}><Icon className="h-5 w-5" /></div></div></div>
}

function QuickList({ label, count, icon: Icon, active, onClick }: { label: string; count: number; icon: typeof Star; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-right transition-colors ${active ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted'}`}><span className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-primary" />{label}</span><span className="text-lg font-semibold">{count}</span></button>
}

