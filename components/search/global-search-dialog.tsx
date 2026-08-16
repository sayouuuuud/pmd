'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { useCommandCenter } from '@/lib/command-center-store'

type SearchResult = {
  id: string
  title: string
  subtitle: string
  section: string
  href: string
}

type SearchGroup = {
  section: string
  results: SearchResult[]
}

type GlobalSearchDialogProps = {
  open: boolean
  onClose: () => void
}

const sectionOrder = ['المهام', 'الملاحظات', 'خطة اليوم', 'التذكيرات', 'المشاريع', 'الأهداف', 'العادات', 'اليوميات', 'الفلوس', 'الترفيه', 'الديني']

export function GlobalSearchDialog({ open, onClose }: GlobalSearchDialogProps) {
  const router = useRouter()
  const { tasks, notes, goals, projects, financeEntries, planItems, reminders, entertainment, journal, habits, religious } = useCommandCenter()
  const [query, setQuery] = useState('')

  const results = useMemo<SearchResult[]>(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ar')
    if (!normalizedQuery) return []
    const matches = (value: string) => value.toLocaleLowerCase('ar').includes(normalizedQuery)

    return [
      ...tasks.filter((item) => item.status !== 'done' && (matches(item.title) || matches(item.category) || matches(item.dueLabel))).map((item) => ({ id: item.id, title: item.title, subtitle: `${item.category} · ${item.dueLabel}`, section: 'المهام', href: `/tasks#task-${item.id}` })),
      ...notes.filter((item) => matches(item.title) || matches(item.body) || matches(item.tag)).map((item) => ({ id: item.id, title: item.title, subtitle: item.tag, section: 'الملاحظات', href: `/notes#note-${item.id}` })),
      ...goals.filter((item) => item.status !== 'completed' && (matches(item.title) || matches(item.description) || matches(item.targetLabel))).map((item) => ({ id: item.id, title: item.title, subtitle: `هدف · ${item.targetLabel}`, section: 'الأهداف', href: `/goals#${item.id}` })),
      ...projects.filter((item) => matches(item.title) || matches(item.description) || matches(item.dueLabel)).map((item) => ({ id: item.id, title: item.title, subtitle: `مشروع · ${item.dueLabel}`, section: 'المشاريع', href: `/projects#${item.id}` })),
      ...financeEntries.filter((item) => matches(item.title) || matches(item.category) || matches(item.note ?? '')).map((item) => ({ id: item.id, title: item.title, subtitle: `${item.category} · ${item.amount.toLocaleString('ar-EG')} جنيه`, section: 'الفلوس', href: `/money?month=${encodeURIComponent(item.localDate.slice(0, 7))}#finance-${item.id}` })),
      ...planItems.filter((item) => item.status !== 'done' && matches(item.title)).map((item) => ({ id: item.id, title: item.title, subtitle: `خطة اليوم · ${item.time}`, section: 'خطة اليوم', href: `/daily-plan#plan-item-${item.id}` })),
      ...reminders.filter((item) => item.status !== 'done' && (matches(item.title) || matches(item.dueAt))).map((item) => ({ id: item.id, title: item.title, subtitle: `تذكير · ${item.dueAt}`, section: 'التذكيرات', href: `/reminders#reminder-${item.id}` })),
      ...entertainment.filter((item) => matches(item.title) || matches(item.genre) || matches(item.note ?? '')).map((item) => ({ id: item.id, title: item.title, subtitle: `${item.type === 'movie' ? 'فيلم' : 'مسلسل'} · ${item.genre}`, section: 'الترفيه', href: `/entertainment#entertainment-${item.id}` })),
      ...journal.filter((item) => matches(item.title) || matches(item.body) || matches(item.mood) || matches(item.localDate)).map((item) => ({ id: item.id, title: item.title || 'يوميات بلا عنوان', subtitle: `اليوميات · ${item.localDate} · ${item.mood}`, section: 'اليوميات', href: `/journal?date=${encodeURIComponent(item.localDate)}#journal-${item.id}` })),
      ...habits.filter((item) => matches(item.title) || matches(item.target)).map((item) => ({ id: item.id, title: item.title, subtitle: `عادة · ${item.target}`, section: 'العادات', href: `/habits#${item.id}` })),
      ...religious.prayerLogs.filter((item) => matches(item.name) || matches(item.localDate) || matches(item.time)).map((item) => ({ id: item.id, title: item.name, subtitle: `الصلاة · ${item.localDate} · ${item.time}`, section: 'الديني', href: '/religious' })),
    ].slice(0, 24)
  }, [entertainment, financeEntries, goals, habits, journal, notes, planItems, projects, query, reminders, religious.prayerLogs, tasks])

  const groups = useMemo<SearchGroup[]>(() => sectionOrder
    .map((section) => ({ section, results: results.filter((result) => result.section === section) }))
    .filter((group) => group.results.length > 0), [results])

  if (!open) return null

  function close() {
    setQuery('')
    onClose()
  }

  function openResult(result: SearchResult) {
    close()
    router.push(result.href)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/30 p-4 pt-20 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="global-search-dialog-title">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-card shadow-2xl">
        <h2 id="global-search-dialog-title" className="sr-only">البحث الشامل</h2>
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') close() }} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="ابحث في مهامك وملاحظاتك ومشاريعك..." aria-label="اكتب كلمة البحث" aria-controls="global-search-results" />
          <kbd className="hidden rounded-lg bg-muted px-2 py-1 text-[10px] text-muted-foreground sm:block">Esc</kbd>
          <button type="button" aria-label="إغلاق البحث" onClick={close} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <div id="global-search-results" className="max-h-[60vh] overflow-y-auto p-3" aria-live="polite">
          {!query.trim() && <div className="px-4 py-10 text-center"><p className="text-sm font-semibold">دور على أي حاجة في مساحتك</p><p className="mt-2 text-xs text-muted-foreground">المهام، الملاحظات، المشاريع، الأهداف، اليوميات، الترفيه، والعادات.</p></div>}
          {query.trim() && groups.length === 0 && <div className="px-4 py-10 text-center"><p className="text-sm font-semibold">مفيش نتائج مطابقة</p><p className="mt-2 text-xs text-muted-foreground">جرّب كلمة أقصر أو اسم القسم.</p></div>}
          {groups.length > 0 && <div className="space-y-4" aria-label={`نتائج البحث: ${results.length}`}>
            {groups.map((group) => <section key={group.section} aria-labelledby={`search-group-${group.section}`}>
              <div className="mb-1 flex items-center justify-between px-2">
                <h3 id={`search-group-${group.section}`} className="text-xs font-semibold text-muted-foreground">{group.section}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{group.results.length}</span>
              </div>
              <div className="space-y-1">
                {group.results.map((result) => <button key={`${result.section}-${result.id}`} type="button" onClick={() => openResult(result)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right transition-colors hover:bg-muted focus-visible:bg-muted" aria-label={`${result.title}، ${result.section}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{result.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{result.subtitle}</span></span>
                </button>)}
              </div>
            </section>)}
          </div>}
        </div>
      </div>
    </div>
  )
}
