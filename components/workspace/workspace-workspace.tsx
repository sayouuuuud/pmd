'use client'

import { useEffect, useMemo, useState } from 'react'
import { Archive, BriefcaseBusiness, Building2, Pencil, Plus, RefreshCw, Search, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type Workspace = {
  id: string
  name: string
  kind: string
  role: string
}

type Client = {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  notes: string | null
}

type WorkspaceFallback = {
  workspaces: Workspace[]
  clientsByWorkspace: Record<string, Client[]>
}

const STORAGE_KEY = 'personal-command-center-workspace-v1'
const fallback: WorkspaceFallback = {
  workspaces: [{ id: 'local-personal', name: 'مساحتي الشخصية', kind: 'personal', role: 'owner' }],
  clientsByWorkspace: { 'local-personal': [] },
}

function readFallback(): WorkspaceFallback {
  if (typeof window === 'undefined') return fallback
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '') as WorkspaceFallback
    if (Array.isArray(parsed.workspaces) && parsed.clientsByWorkspace) return parsed
  } catch {
    // The local fallback is intentionally resilient to malformed browser data.
  }
  return fallback
}

export function WorkspaceWorkspace() {
  const [data, setData] = useState<WorkspaceFallback>(fallback)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('local-personal')
  const [backendAvailable, setBackendAvailable] = useState(true)
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceKind, setWorkspaceKind] = useState('work')
  const [clientName, setClientName] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const activeWorkspace = useMemo(
    () => data.workspaces.find((item) => item.id === activeWorkspaceId) ?? data.workspaces[0],
    [activeWorkspaceId, data.workspaces],
  )
  const clients = useMemo(() => activeWorkspace ? data.clientsByWorkspace[activeWorkspace.id] ?? [] : [], [activeWorkspace, data.clientsByWorkspace])
  const visibleClients = useMemo(() => {
    const query = clientSearch.trim().toLocaleLowerCase('ar')
    if (!query) return clients
    return clients.filter((item) => [item.name, item.company, item.email, item.notes].filter(Boolean).some((value) => value?.toLocaleLowerCase('ar').includes(query)))
  }, [clientSearch, clients])

  function persist(next: WorkspaceFallback) {
    setData(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  async function loadData() {
    setLoading(true)
    setNotice('')
    try {
      const workspacesResponse = await fetch('/api/workspaces', { cache: 'no-store' })
      if (!workspacesResponse.ok) throw new Error('backend-unavailable')
      const workspacesPayload = await workspacesResponse.json() as { workspaces: Workspace[]; activeWorkspaceId: string }
      const nextWorkspaces = workspacesPayload.workspaces ?? []
      const nextClients = await Promise.all(nextWorkspaces.map(async (item) => {
        const response = await fetch(`/api/clients?workspaceId=${encodeURIComponent(item.id)}`, { cache: 'no-store' })
        if (!response.ok) return [item.id, []] as const
        const payload = await response.json() as { clients: Client[] }
        return [item.id, payload.clients ?? []] as const
      }))
      const nextData = { workspaces: nextWorkspaces, clientsByWorkspace: Object.fromEntries(nextClients) }
      setBackendAvailable(true)
      setData(nextData)
      setActiveWorkspaceId(workspacesPayload.activeWorkspaceId ?? nextWorkspaces[0]?.id ?? 'local-personal')
    } catch {
      const local = readFallback()
      setBackendAvailable(false)
      setData(local)
      setActiveWorkspaceId(local.workspaces[0]?.id ?? 'local-personal')
      setNotice('تعمل مساحة العمل بالبيانات المحلية مؤقتًا لأن قاعدة البيانات غير متاحة.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  async function createWorkspace() {
    const name = workspaceName.trim()
    if (!name || saving) return
    setSaving(true)
    setNotice('')
    if (backendAvailable) {
      try {
        const response = await fetch('/api/workspaces', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, kind: workspaceKind }),
        })
        if (!response.ok) throw new Error('create-workspace-failed')
        setWorkspaceName('')
        await loadData()
        setNotice('تم إنشاء مساحة العمل.')
        setSaving(false)
        return
      } catch {
        setBackendAvailable(false)
      }
    }

    const created: Workspace = { id: `local-${crypto.randomUUID()}`, name, kind: workspaceKind, role: 'owner' }
    persist({
      workspaces: [...data.workspaces, created],
      clientsByWorkspace: { ...data.clientsByWorkspace, [created.id]: [] },
    })
    setActiveWorkspaceId(created.id)
    setWorkspaceName('')
    setNotice('تم حفظ مساحة العمل محليًا.')
    setSaving(false)
  }

  function resetClientEditor() {
    setEditingClientId(null)
    setClientName('')
    setClientCompany('')
    setClientEmail('')
    setClientNotes('')
  }

  function beginEditClient(item: Client) {
    setEditingClientId(item.id)
    setClientName(item.name)
    setClientCompany(item.company ?? '')
    setClientEmail(item.email ?? '')
    setClientNotes(item.notes ?? '')
    setNotice('')
  }

  async function updateClient() {
    if (!editingClientId || !clientName.trim() || !activeWorkspace || saving) return
    setSaving(true)
    setNotice('')
    const payload = { name: clientName.trim(), company: clientCompany, email: clientEmail, notes: clientNotes }
    if (backendAvailable && !editingClientId.startsWith('local-')) {
      try {
        const response = await fetch(`/api/clients/${encodeURIComponent(editingClientId)}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('update-client-failed')
        resetClientEditor()
        await loadData()
        setNotice('تم تحديث بيانات العميل.')
        setSaving(false)
        return
      } catch {
        setBackendAvailable(false)
      }
    }
    const nextClients = clients.map((item) => item.id === editingClientId ? { ...item, name: payload.name, company: payload.company || null, email: payload.email || null, notes: payload.notes || null } : item)
    persist({ ...data, clientsByWorkspace: { ...data.clientsByWorkspace, [activeWorkspace.id]: nextClients } })
    resetClientEditor()
    setNotice('تم تحديث العميل محليًا.')
    setSaving(false)
  }

  async function archiveClient(item: Client) {
    if (!activeWorkspace || saving) return
    setSaving(true)
    setNotice('')
    if (backendAvailable && !item.id.startsWith('local-')) {
      try {
        const response = await fetch(`/api/clients/${encodeURIComponent(item.id)}`, { method: 'DELETE' })
        if (!response.ok) throw new Error('archive-client-failed')
        if (editingClientId === item.id) resetClientEditor()
        await loadData()
        setNotice('تمت أرشفة العميل.')
        setSaving(false)
        return
      } catch {
        setBackendAvailable(false)
      }
    }
    persist({ ...data, clientsByWorkspace: { ...data.clientsByWorkspace, [activeWorkspace.id]: clients.filter((clientItem) => clientItem.id !== item.id) } })
    if (editingClientId === item.id) resetClientEditor()
    setNotice('تمت أرشفة العميل محليًا.')
    setSaving(false)
  }

  async function createClient() {
    const name = clientName.trim()
    if (!name || !activeWorkspace || saving) return
    setSaving(true)
    setNotice('')
    const payload = { name, company: clientCompany, email: clientEmail, notes: clientNotes }
    if (backendAvailable && !activeWorkspace.id.startsWith('local-')) {
      try {
        const response = await fetch(`/api/clients?workspaceId=${encodeURIComponent(activeWorkspace.id)}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('create-client-failed')
        resetClientEditor()
        await loadData()
        setNotice('تمت إضافة العميل.')
        setSaving(false)
        return
      } catch {
        setBackendAvailable(false)
      }
    }

    const created: Client = { id: `local-${crypto.randomUUID()}`, name, company: clientCompany || null, email: clientEmail || null, phone: null, notes: clientNotes || null }
    persist({
      ...data,
      clientsByWorkspace: { ...data.clientsByWorkspace, [activeWorkspace.id]: [...clients, created] },
    })
    resetClientEditor()
    setNotice('تم حفظ العميل محليًا.')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`h-2.5 w-2.5 rounded-full ${backendAvailable ? 'bg-primary' : 'bg-warning'}`} />
          {backendAvailable ? 'مزامنة قاعدة البيانات مفعّلة' : 'وضع محلي مؤقت'}
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {notice ? <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{notice}</div> : null}

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <ContentCard title="مساحات العمل" description="افصل بين حياتك الشخصية ومشاريع العمل بدون تغيير حسابك.">
          <div className="space-y-2">
            {loading ? <p className="text-sm text-muted-foreground">جاري تحميل المساحات...</p> : null}
            {data.workspaces.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={item.id === activeWorkspace?.id ? 'secondary' : 'ghost'}
                className="h-auto w-full justify-start gap-3 rounded-2xl px-3 py-3 text-right"
                onClick={() => setActiveWorkspaceId(item.id)}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  {item.kind === 'personal' ? <Users className="h-4 w-4" /> : <BriefcaseBusiness className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="block text-xs text-muted-foreground">{item.role === 'owner' ? 'مالك' : 'عضو'}</span>
                </span>
              </Button>
            ))}
          </div>
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <Input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="اسم مساحة جديدة" aria-label="اسم مساحة العمل الجديدة" />
            <Select value={workspaceKind} onChange={(event) => setWorkspaceKind(event.target.value)} aria-label="نوع مساحة العمل">
              <option value="work">عمل حر</option>
              <option value="team">فريق تجريبي</option>
            </Select>
            <Button type="button" onClick={() => void createWorkspace()} disabled={!workspaceName.trim() || saving} className="w-full">
              <Plus className="h-4 w-4" />
              إضافة مساحة عمل
            </Button>
          </div>
        </ContentCard>

        <ContentCard title={activeWorkspace ? `عملاء ${activeWorkspace.name}` : 'العملاء'} description="ملفات عميل خفيفة مرتبطة بمساحة العمل الحالية.">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder="ابحث في العملاء" aria-label="البحث في العملاء" className="pr-9" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleClients.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    {item.company ? <p className="mt-1 truncate text-xs text-muted-foreground">{item.company}</p> : null}
                  </div>
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                {item.email ? <p className="mt-3 truncate text-xs text-muted-foreground">{item.email}</p> : null}
                <div className="mt-4 flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => beginEditClient(item)} disabled={saving} aria-label={`تعديل ${item.name}`}>
                    <Pencil className="h-4 w-4" />
                    تعديل
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void archiveClient(item)} disabled={saving} aria-label={`أرشفة ${item.name}`}>
                    <Archive className="h-4 w-4" />
                    أرشفة
                  </Button>
                </div>
              </div>
            ))}
            {!loading && visibleClients.length === 0 ? <p className="text-sm text-muted-foreground sm:col-span-2">{clients.length ? 'لا توجد نتائج مطابقة للبحث.' : 'لا يوجد عملاء في هذه المساحة بعد.'}</p> : null}
          </div>
          <div className="mt-5 space-y-3 border-t border-border pt-4">
            <Input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="اسم العميل" aria-label="اسم العميل" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={clientCompany} onChange={(event) => setClientCompany(event.target.value)} placeholder="الشركة أو النشاط" aria-label="الشركة أو النشاط" />
              <Input type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder="البريد الإلكتروني" aria-label="البريد الإلكتروني" />
            </div>
            <Textarea value={clientNotes} onChange={(event) => setClientNotes(event.target.value)} placeholder="ملاحظات أولية (اختياري)" aria-label="ملاحظات العميل" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void (editingClientId ? updateClient() : createClient())} disabled={!clientName.trim() || !activeWorkspace || saving}>
                {editingClientId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingClientId ? 'حفظ التعديل' : 'إضافة عميل'}
              </Button>
              {editingClientId ? <Button type="button" variant="outline" onClick={resetClientEditor} disabled={saving}><X className="h-4 w-4" />إلغاء</Button> : null}
            </div>
          </div>
        </ContentCard>
      </div>
    </div>
  )
}
