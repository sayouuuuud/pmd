'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Archive, ArchiveRestore, Check, Clock3, ListChecks, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { useCommandCenter, type ArchiveKind, type ArchivedItem, type RestoreArchivedResult } from '@/lib/command-center-store'
import { persistWorkspaceFallback, readWorkspaceFallback, type ArchivedClient, type Client } from '@/lib/workspace-types'

type ArchiveFilter = ArchiveKind | 'client' | 'all'
type ArchivedClientItem = {
  id: string
  kind: 'client'
  title: string
  subtitle: string
  archivedAt: string
  payload: ArchivedClient
}
type ArchiveEntry = ArchivedItem | ArchivedClientItem
type ClientArchiveEntry = ArchiveEntry & { kind: 'client'; payload: ArchivedClient }

function isClientArchiveEntry(item: ArchiveEntry): item is ClientArchiveEntry {
  return item.kind === 'client' && 'workspaceId' in item.payload
}

const kindLabels: Record<ArchiveFilter, string> = {
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
  calendar: 'التقويم',
  board: 'السبورة',
  client: 'العملاء',
}

const kindOptions: ArchiveFilter[] = ['all', 'task', 'note', 'habit', 'goal', 'project', 'finance', 'reminder', 'entertainment', 'journal', 'calendar', 'board', 'client']

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'منذ فترة'
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function itemKey(item: ArchiveEntry) {
  return `${item.kind}-${item.id}`
}

function mapArchivedClient(client: Client & { archivedAt: string | Date }, workspaceName: string): ArchivedClientItem {
  const archivedAt = typeof client.archivedAt === 'string' ? client.archivedAt : new Date(client.archivedAt).toISOString()
  return {
    id: client.id,
    kind: 'client',
    title: client.name,
    subtitle: `العملاء · ${workspaceName}${client.company ? ` · ${client.company}` : ''}`,
    archivedAt,
    payload: { ...client, archivedAt },
  }
}

export function ArchiveWorkspace() {
  const searchParams = useSearchParams()
  const { archive, restoreArchivedItem } = useCommandCenter()
  const [activeKind, setActiveKind] = useState<ArchiveFilter>('all')
  const [query, setQuery] = useState('')
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [clientArchive, setClientArchive] = useState<ArchivedClientItem[]>([])
  const [clientArchiveError, setClientArchiveError] = useState('')

  useEffect(() => {
    const linkedQuery = searchParams.get('q')
    if (linkedQuery !== null) setQuery(linkedQuery)
  }, [searchParams])

  async function loadClientArchive() {
    const local = readWorkspaceFallback()
    const localItems = local.workspaces.flatMap((workspace) => (local.archivedClientsByWorkspace[workspace.id] ?? []).map((client) => mapArchivedClient(client, workspace.name)))
    try {
      const workspacesResponse = await fetch('/api/workspaces', { cache: 'no-store' })
      if (!workspacesResponse.ok) throw new Error('workspace-load-failed')
      const workspacesPayload = await workspacesResponse.json() as { workspaces: Array<{ id: string; name: string }> }
      const remoteItems = await Promise.all((workspacesPayload.workspaces ?? []).map(async (workspace) => {
        const response = await fetch(`/api/clients?workspaceId=${encodeURIComponent(workspace.id)}&archived=true`, { cache: 'no-store' })
        if (!response.ok) throw new Error('client-archive-load-failed')
        const payload = await response.json() as { clients: Array<Client & { archivedAt: string | Date | null }> }
        return (payload.clients ?? []).filter((client): client is Client & { archivedAt: string | Date } => Boolean(client.archivedAt)).map((client) => mapArchivedClient(client, workspace.name))
      }))
      setClientArchive(remoteItems.flat())
      setClientArchiveError('')
    } catch {
      setClientArchive(localItems)
      setClientArchiveError(localItems.length > 0 ? 'تظهر العملاء المؤرشفة من التخزين المحلي مؤقتًا.' : '')
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 120)
    void loadClientArchive()
    return () => window.clearTimeout(timer)
  }, [])

  const allItems = useMemo<ArchiveEntry[]>(() => {
    const unique = new Map<string, ArchiveEntry>()
    for (const item of [...archive, ...clientArchive]) unique.set(itemKey(item), item)
    return [...unique.values()]
  }, [archive, clientArchive])
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ar')
    return allItems
      .filter((item) => activeKind === 'all' || item.kind === activeKind)
      .filter((item) => !normalized || `${item.title} ${item.subtitle}`.toLocaleLowerCase('ar').includes(normalized))
      .sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))
  }, [activeKind, allItems, query])

  useEffect(() => {
    const availableKeys = new Set(allItems.map(itemKey))
    setSelectedKeys((keys) => keys.filter((key) => availableKeys.has(key)))
  }, [allItems])

  const visibleKeys = filteredItems.map(itemKey)
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selectedKeys.includes(key))
  const selectedItems = filteredItems.filter((item) => selectedKeys.includes(itemKey(item)))

  function toggleSelected(item: ArchiveEntry) {
    const key = itemKey(item)
    setSelectedKeys((keys) => keys.includes(key) ? keys.filter((entry) => entry !== key) : [...keys, key])
  }

  function toggleAllVisible() {
    setSelectedKeys((keys) => {
      if (allVisibleSelected) return keys.filter((key) => !visibleKeys.includes(key))
      return Array.from(new Set([...keys, ...visibleKeys]))
    })
  }

  async function restoreClient(item: ClientArchiveEntry): Promise<RestoreArchivedResult> {
    if (item.payload.id.startsWith('local-')) {
      const local = readWorkspaceFallback()
      const workspaceId = item.payload.workspaceId
      const archivedClients = local.archivedClientsByWorkspace[workspaceId] ?? []
      const restored = archivedClients.find((client) => client.id === item.payload.id)
      if (!restored) throw new Error('local-client-not-found')
      const next = {
        ...local,
        clientsByWorkspace: { ...local.clientsByWorkspace, [workspaceId]: [...(local.clientsByWorkspace[workspaceId] ?? []).filter((client) => client.id !== restored.id), restored] },
        archivedClientsByWorkspace: { ...local.archivedClientsByWorkspace, [workspaceId]: archivedClients.filter((client) => client.id !== restored.id) },
      }
      persistWorkspaceFallback(next)
      setClientArchive((items) => items.filter((entry) => entry.id !== item.id))
      return { restored: true, remoteSynced: true }
    }
    const response = await fetch(`/api/archive/client/${encodeURIComponent(item.payload.id)}`, { method: 'PATCH' })
    if (!response.ok) throw new Error('remote-client-restore-failed')
    await loadClientArchive()
    return { restored: true, remoteSynced: true }
  }

  async function restore(item: ArchiveEntry) {
    try {
      const result = isClientArchiveEntry(item) ? await restoreClient(item) : await restoreArchivedItem(item.id)
      if (!result.restored) {
        setMessage('العنصر المؤرشف غير موجود أو تمت استعادته مسبقًا.')
      } else {
        setSelectedKeys((keys) => keys.filter((key) => key !== itemKey(item)))
        setMessage(result.remoteSynced ? `تمت استعادة «${item.title}» إلى ${kindLabels[item.kind]}.` : `تمت استعادة «${item.title}» محليًا. ستتم المزامنة عند عودة الاتصال.`)
      }
    } catch {
      setMessage('تعذرت الاستعادة الآن. تحقق من الاتصال ثم حاول مرة أخرى.')
    }
    window.setTimeout(() => setMessage(''), 3200)
  }

  async function restoreSelected() {
    if (selectedItems.length === 0) return
    let restoredCount = 0
    let pendingSyncCount = 0
    for (const item of selectedItems) {
      try {
        const result = isClientArchiveEntry(item) ? await restoreClient(item) : await restoreArchivedItem(item.id)
        if (result.restored) {
          restoredCount += 1
          if (!result.remoteSynced) pendingSyncCount += 1
        }
      } catch {
        // Keep failed remote client restores visible for a retry.
      }
    }
    setSelectedKeys([])
    const syncNotice = pendingSyncCount > 0 ? ` ${pendingSyncCount} محليًا وتنتظر المزامنة.` : ''
    setMessage(restoredCount === selectedItems.length ? `تمت استعادة ${restoredCount} عناصر من الأرشيف.${syncNotice}` : `تمت استعادة ${restoredCount} من ${selectedItems.length} عناصر.${syncNotice} بقيت العناصر الأخرى للمحاولة مرة أخرى.`)
    window.setTimeout(() => setMessage(''), 3600)
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
            <p className="text-2xl font-bold text-foreground">{allItems.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">عنصر مؤرشف</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">البحث داخل الأرشيف</span>
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في العناصر المؤرشفة..." className="h-11 w-full px-10" aria-label="البحث داخل الأرشيف" />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية الأرشيف حسب القسم">
            {kindOptions.slice(0, 5).map((kind) => (
              <Button key={kind} type="button" size="sm" variant={activeKind === kind ? 'default' : 'outline'} onClick={() => setActiveKind(kind)} aria-pressed={activeKind === kind}>{kindLabels[kind]}</Button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {kindOptions.slice(5).map((kind) => (
            <Button key={kind} type="button" size="sm" variant={activeKind === kind ? 'default' : 'outline'} onClick={() => setActiveKind(kind)} aria-pressed={activeKind === kind}>{kindLabels[kind]}</Button>
          ))}
        </div>
        {clientArchiveError ? <p className="mt-3 text-xs text-warning">{clientArchiveError}</p> : null}
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Checkbox checked={allVisibleSelected} onChange={toggleAllVisible} disabled={filteredItems.length === 0} aria-label="تحديد كل النتائج الظاهرة" />
            تحديد كل النتائج الظاهرة
            {selectedKeys.length > 0 && <span className="text-xs font-medium text-muted-foreground">({selectedKeys.length} محدد)</span>}
          </label>
          <Button type="button" size="sm" variant="outline" onClick={() => void restoreSelected()} disabled={selectedItems.length === 0} className="border-primary/20 bg-primary/10 font-bold text-primary hover:bg-primary hover:text-primary-foreground">
            <ListChecks className="size-4" aria-hidden="true" />
            استعادة المحدد ({selectedItems.length})
          </Button>
        </div>
      </div>

      {message && <div role="status" aria-live="polite" aria-atomic="true" className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary"><Check className="size-4" aria-hidden="true" />{message}</div>}

      {!ready ? (
        <div className="grid gap-4 md:grid-cols-2" aria-label="جارٍ تحميل الأرشيف" aria-busy="true">{[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-border/60 bg-muted/50" />)}</div>
      ) : filteredItems.length === 0 ? (
        <EmptyState icon={Archive} title="لا توجد عناصر هنا" description={allItems.length === 0 ? 'عندما تؤرشف مهمة أو ملاحظة أو حدث تقويم أو أي عنصر آخر، ستجده هنا مع إمكانية استعادته.' : 'جرّب تغيير القسم أو كلمة البحث لرؤية عناصر أخرى.'} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map((item) => (
            <article key={itemKey(item)} className="group rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <label className="inline-flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={selectedKeys.includes(itemKey(item))} onChange={() => toggleSelected(item)} aria-label={`تحديد ${item.title}`} />
                  <span className="sr-only">تحديد</span>
                </label>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-primary">{kindLabels[item.kind]}</span>
                  <h3 className="mt-2 truncate text-base font-bold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => void restore(item)} className="shrink-0 border-primary/20 bg-primary/10 font-bold text-primary hover:bg-primary hover:text-primary-foreground" aria-label={`استعادة ${item.title}`}>
                  <ArchiveRestore className="size-4" aria-hidden="true" />
                  استعادة
                </Button>
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground"><Clock3 className="size-3.5" aria-hidden="true" />أُرشف {formatDate(item.archivedAt)}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
