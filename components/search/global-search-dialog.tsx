'use client'

import { useEffect, useMemo, useState, type RefObject } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCommandCenter } from '@/lib/command-center-store'
import { contextHref } from '@/lib/context-links'
import { readWorkspaceFallback, type Client } from '@/lib/workspace-types'
import type { CalendarEvent } from '@/lib/command-center-store'

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
  triggerRef?: RefObject<HTMLElement | null>
}

const sectionOrder = ['المهام', 'الملاحظات', 'خطة اليوم', 'التذكيرات', 'التقويم', 'المشاريع', 'تحديثات المشاريع', 'التسعير والدفعات', 'العملاء', 'الأهداف', 'العادات', 'اليوميات', 'الفلوس', 'الترفيه', 'الديني', 'الأرشيف']

export function GlobalSearchDialog({ open, onClose, triggerRef }: GlobalSearchDialogProps) {
  const router = useRouter()
  const { tasks, notes, goals, projects, projectUpdates, projectPricings, financeEntries, planItems, reminders, entertainment, journal, habits, religious, archive } = useCommandCenter()
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [customCalendarEvents, setCustomCalendarEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    if (!open || typeof window === 'undefined') return
    const workspace = readWorkspaceFallback()
    const localClients = Object.values(workspace.clientsByWorkspace).flat()
    setClients(localClients)
    try {
      const parsed = JSON.parse(window.localStorage.getItem('personal-command-center-calendar-events-v1') ?? '[]')
      setCustomCalendarEvents(Array.isArray(parsed) ? parsed as CalendarEvent[] : [])
    } catch {
      setCustomCalendarEvents([])
    }
  }, [open])

  const calendarItems = useMemo(() => [
    ...customCalendarEvents.map((item) => ({ id: `event-${item.id}`, title: item.title, subtitle: `التقويم · ${item.startsAt.slice(0, 16).replace('T', ' ')}`, href: `/calendar?date=${encodeURIComponent(item.startsAt.slice(0, 10))}` })),
    ...tasks.filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.dueLabel)).map((item) => ({ id: `task-${item.id}`, title: item.title, subtitle: `التقويم · ${item.dueLabel}`, href: `/calendar?date=${encodeURIComponent(item.dueLabel)}` })),
    ...reminders.map((item) => ({ id: `reminder-${item.id}`, title: item.title, subtitle: `التقويم · ${item.dueAt}`, href: '/calendar' })),
    ...planItems.filter((item): item is typeof item & { localDate: string } => Boolean(item.localDate)).map((item) => ({ id: `plan-${item.id}`, title: item.title, subtitle: `التقويم · ${item.localDate} · ${item.time}`, href: `/calendar?date=${encodeURIComponent(item.localDate)}` })),
  ], [customCalendarEvents, planItems, reminders, tasks])

  const results = useMemo<SearchResult[]>(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ar')
    if (!normalizedQuery) return []
    const matches = (value: string) => value.toLocaleLowerCase('ar').includes(normalizedQuery)

    return [
      ...tasks.filter((item) => matches(item.title) || matches(item.category) || matches(item.dueLabel)).map((item) => ({ id: item.id, title: item.title, subtitle: `${item.category} · ${item.dueLabel}`, section: 'المهام', href: contextHref('task', item.id) })),
      ...notes.filter((item) => matches(item.title) || matches(item.body) || matches(item.tag)).map((item) => ({ id: item.id, title: item.title, subtitle: item.tag, section: 'الملاحظات', href: `/notes#note-${item.id}` })),
      ...goals.filter((item) => matches(item.title) || matches(item.description) || matches(item.targetLabel)).map((item) => ({ id: item.id, title: item.title, subtitle: `هدف · ${item.targetLabel}`, section: 'الأهداف', href: contextHref('goal', item.id) })),
      ...projects.filter((item) => matches(item.title) || matches(item.description) || matches(item.dueLabel) || matches(item.nextStep ?? '')).map((item) => ({ id: item.id, title: item.title, subtitle: `مشروع · ${item.dueLabel}${item.nextStep ? ` · ${item.nextStep}` : ''}`, section: 'المشاريع', href: contextHref('project', item.id) })),
      ...projectUpdates.filter((item) => matches(item.body) || matches(item.kind) || matches(item.createdAt)).map((item) => ({ id: item.id, title: item.body.slice(0, 80), subtitle: `تحديث مشروع · ${projects.find((project) => project.id === item.projectId)?.title ?? 'مشروع'}`, section: 'تحديثات المشاريع', href: `${contextHref('project', item.projectId)}&tab=updates` })),
      ...projectPricings.filter((item) => matches(item.title) || matches(item.currency) || matches(item.notes ?? '')).map((item) => ({ id: item.id, title: item.title, subtitle: `دفعة · ${item.amount.toLocaleString('ar-EG')} ${item.currency} · ${item.status}`, section: 'التسعير والدفعات', href: `${contextHref('project', item.projectId)}&tab=pricing` })),
      ...clients.filter((item) => matches(item.name) || matches(item.company ?? '') || matches(item.email ?? '') || matches(item.phone ?? '') || matches(item.notes ?? '')).map((item) => ({ id: item.id, title: item.name, subtitle: `عميل${item.company ? ` · ${item.company}` : ''}`, section: 'العملاء', href: `/workspace?clientId=${encodeURIComponent(item.id)}` })),
      ...financeEntries.filter((item) => matches(item.title) || matches(item.category) || matches(item.note ?? '')).map((item) => ({ id: item.id, title: item.title, subtitle: `${item.category} · ${item.amount.toLocaleString('ar-EG')} جنيه`, section: 'الفلوس', href: `/money?month=${encodeURIComponent(item.localDate.slice(0, 7))}#finance-${item.id}` })),
      ...planItems.filter((item) => matches(item.title)).map((item) => ({ id: item.id, title: item.title, subtitle: `خطة اليوم · ${item.time}`, section: 'خطة اليوم', href: `/daily-plan#plan-item-${item.id}` })),
      ...reminders.filter((item) => matches(item.title) || matches(item.dueAt)).map((item) => ({ id: item.id, title: item.title, subtitle: `تذكير · ${item.dueAt}`, section: 'التذكيرات', href: `/reminders#reminder-${item.id}` })),
      ...calendarItems.filter((item) => matches(item.title) || matches(item.subtitle)).map((item) => ({ ...item, section: 'التقويم' })),
      ...entertainment.filter((item) => matches(item.title) || matches(item.genre) || matches(item.note ?? '')).map((item) => ({ id: item.id, title: item.title, subtitle: `${item.type === 'movie' ? 'فيلم' : 'مسلسل'} · ${item.genre}`, section: 'الترفيه', href: `/entertainment#entertainment-${item.id}` })),
      ...journal.filter((item) => matches(item.title) || matches(item.body) || matches(item.mood) || matches(item.localDate)).map((item) => ({ id: item.id, title: item.title || 'يوميات بلا عنوان', subtitle: `اليوميات · ${item.localDate} · ${item.mood}`, section: 'اليوميات', href: `/journal?date=${encodeURIComponent(item.localDate)}#journal-${item.id}` })),
      ...habits.filter((item) => matches(item.title) || matches(item.target)).map((item) => ({ id: item.id, title: item.title, subtitle: `عادة · ${item.target}`, section: 'العادات', href: contextHref('habit', item.id) })),
      ...religious.prayerLogs.filter((item) => matches(item.name) || matches(item.localDate) || matches(item.time)).map((item) => ({ id: item.id, title: item.name, subtitle: `الصلاة · ${item.localDate} · ${item.time}`, section: 'الديني', href: contextHref('prayer') })),
      ...archive.filter((item) => matches(item.title) || matches(item.subtitle)).map((item) => ({ id: `${item.kind}-${item.id}`, title: item.title, subtitle: `أرشيف · ${item.subtitle}`, section: 'الأرشيف', href: `/archive?q=${encodeURIComponent(item.title)}` })),
    ].slice(0, 24)
  }, [archive, calendarItems, clients, entertainment, financeEntries, goals, habits, journal, notes, planItems, projectPricings, projectUpdates, projects, query, reminders, religious.prayerLogs, tasks])

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
    <Dialog triggerRef={triggerRef} open={open} onOpenChange={(nextOpen) => { if (!nextOpen) close() }} title="البحث الشامل" hideHeader className="max-w-2xl overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} className="h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 py-0 text-sm shadow-none outline-none focus-visible:border-0 focus-visible:ring-0" placeholder="ابحث في كل أقسام مساحتك..." aria-label="اكتب كلمة البحث" aria-controls="global-search-results" />
        <kbd className="hidden rounded-lg bg-muted px-2 py-1 text-[10px] text-muted-foreground sm:block">Esc</kbd>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="إغلاق البحث" onClick={close}><X className="h-4 w-4" aria-hidden="true" /></Button>
      </div>
      <div id="global-search-results" className="max-h-[60vh] overflow-y-auto p-3" aria-live="polite">
        {!query.trim() && <div className="px-4 py-10 text-center"><p className="text-sm font-semibold">دور على أي حاجة في مساحتك</p><p className="mt-2 text-xs text-muted-foreground">المهام، الملاحظات، خطة اليوم، التذكيرات، التقويم، المشاريع، العملاء، التحديثات، التسعير، الأهداف، العادات، اليوميات، الفلوس، الترفيه، الديني، والأرشيف.</p></div>}
        {query.trim() && groups.length === 0 && <div className="px-4 py-10 text-center"><p className="text-sm font-semibold">مفيش نتائج مطابقة</p><p className="mt-2 text-xs text-muted-foreground">جرّب كلمة أقصر أو اسم القسم.</p></div>}
        {groups.length > 0 && <div className="space-y-4" aria-label={`نتائج البحث: ${results.length}`}>
          {groups.map((group) => <section key={group.section} aria-labelledby={`search-group-${group.section}`}>
            <div className="mb-1 flex items-center justify-between px-2">
              <h3 id={`search-group-${group.section}`} className="text-xs font-semibold text-muted-foreground">{group.section}</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{group.results.length}</span>
            </div>
            <div className="space-y-1">
              {group.results.map((result) => <Button key={`${result.section}-${result.id}`} type="button" variant="ghost" onClick={() => openResult(result)} className="h-auto w-full justify-start gap-3 rounded-2xl px-3 py-3 text-right" aria-label={`${result.title}، ${result.section}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{result.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{result.subtitle}</span></span>
              </Button>)}
            </div>
          </section>)}
        </div>}
      </div>
    </Dialog>
  )
}
