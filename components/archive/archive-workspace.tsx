'use client'

import { useEffect, useMemo, useState } from 'react'
import { Archive, ArchiveRestore, Check, Clock3, Search } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useCommandCenter, type ArchiveKind, type ArchivedItem } from '@/lib/command-center-store'

const kindLabels: Record<ArchiveKind | 'all', string> = {
  all: 'كل الأقسام',
  task: 'المهام',
  note: 'الملاحظات',
  habit: 'العادات',
  goal: 'الأهداف',
  project: 'المشاريع',
  finance: 'الفلوس',
  reminder: 'التذكيرات',
  entertainment: 'الترفيه',
  journal: 'اليوميات',
  board: 'السبورة',
}

const kindOptions: Array<ArchiveKind | 'all'> = ['all', 'task', 'note', 'habit', 'goal', 'project', 'finance', 'reminder', 'entertainment', 'journal', 'board']

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'منذ فترة'
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function itemKey(item: ArchivedItem) {
  return `${item.kind}-${item.id}`
}

export function ArchiveWorkspace() {
  const { archive, restoreArchivedItem } = useCommandCenter()
  const [activeKind, setActiveKind] = useState<ArchiveKind | 'all'>('all')
  const [query, setQuery] = useState('')
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 120)
    return () => window.clearTimeout(timer)
  }, [])

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ar')
    return archive
      .filter((item) => activeKind === 'all' || item.kind === activeKind)
      .filter((item) => !normalized || `${item.title} ${item.subtitle}`.toLocaleLowerCase('ar').includes(normalized))
      .sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))
  }, [activeKind, archive, query])

  function restore(item: ArchivedItem) {
    restoreArchivedItem(item.id)
    setMessage(`تمت استعادة «${item.title}» إلى ${kindLabels[item.kind]}.`)
    window.setTimeout(() => setMessage(''), 3200)
  }

  return (
    <section className="space-y-6" aria-labelledby="archive-heading">
      <div className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Archive className="size-3.5" aria-hidden="true" />
              مساحة آمنة قبل الحذف النهائي
            </div>
            <h2 id="archive-heading" className="text-2xl font-bold tracking-tight text-foreground">الأرشيف</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">كل ما تنقله من الأقسام يبقى هنا ويمكن استعادته في أي وقت. لا يتم حذف بياناتك مباشرة.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 px-5 py-4 text-center">
            <p className="text-2xl font-bold text-foreground">{archive.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">عنصر مؤرشف</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">البحث داخل الأرشيف</span>
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في العناصر المؤرشفة..." className="h-11 w-full rounded-xl border border-border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية الأرشيف حسب القسم">
            {kindOptions.slice(0, 5).map((kind) => (
              <button key={kind} type="button" onClick={() => setActiveKind(kind)} aria-pressed={activeKind === kind} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${activeKind === kind ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}>
                {kindLabels[kind]}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {kindOptions.slice(5).map((kind) => (
            <button key={kind} type="button" onClick={() => setActiveKind(kind)} aria-pressed={activeKind === kind} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${activeKind === kind ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}>
              {kindLabels[kind]}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div role="status" className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
          <Check className="size-4" aria-hidden="true" />
          {message}
        </div>
      )}

      {!ready ? (
        <div className="grid gap-4 md:grid-cols-2" aria-label="جارٍ تحميل الأرشيف" aria-busy="true">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-border/60 bg-muted/50" />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState icon={Archive} title="لا توجد عناصر هنا" description={archive.length === 0 ? 'عندما تؤرشف مهمة أو ملاحظة أو أي عنصر آخر، ستجده هنا مع إمكانية استعادته.' : 'جرّب تغيير القسم أو كلمة البحث لرؤية عناصر أخرى.'} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map((item) => (
            <article key={itemKey(item)} className="group rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-primary">{kindLabels[item.kind]}</span>
                  <h3 className="mt-2 truncate text-base font-bold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                <button type="button" onClick={() => restore(item)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground" aria-label={`استعادة ${item.title}`}>
                  <ArchiveRestore className="size-4" aria-hidden="true" />
                  استعادة
                </button>
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" aria-hidden="true" />
                أُرشف {formatDate(item.archivedAt)}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
