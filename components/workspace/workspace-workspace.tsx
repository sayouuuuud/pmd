'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Archive, ArrowLeft, BriefcaseBusiness, Building2, LayoutDashboard, Mail, Pencil, Plus, RefreshCw, Search, UserMinus, UserPlus, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SystemState } from '@/components/ui/system-state'
import { persistWorkspaceFallback, readWorkspaceFallback, workspaceFallback, type Client, type Workspace, type WorkspaceFallback, type WorkspaceInvitation, type WorkspaceMember } from '@/lib/workspace-types'
import { ClientPortalManager } from '@/components/workspace/client-portal-manager'

export function WorkspaceWorkspace() {
  const [data, setData] = useState<WorkspaceFallback>(workspaceFallback)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('local-personal')
  const [backendAvailable, setBackendAvailable] = useState(true)
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceKind, setWorkspaceKind] = useState('work')
  const [clientName, setClientName] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientStatus, setClientStatus] = useState<'lead' | 'active' | 'paused'>('active')
  const [clientTags, setClientTags] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [workspaceError, setWorkspaceError] = useState('')
  const [clientError, setClientError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([])
  const [currentRole, setCurrentRole] = useState<'owner' | 'admin' | 'member' | null>(null)
  const [canManageMembers, setCanManageMembers] = useState(false)
  const [canManageClients, setCanManageClients] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteToken, setInviteToken] = useState('')
  const [generatedToken, setGeneratedToken] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [accessLoading, setAccessLoading] = useState(false)

  const activeWorkspace = useMemo(
    () => data.workspaces.find((item) => item.id === activeWorkspaceId) ?? data.workspaces[0],
    [activeWorkspaceId, data.workspaces],
  )
  const clients = useMemo(() => activeWorkspace ? data.clientsByWorkspace[activeWorkspace.id] ?? [] : [], [activeWorkspace, data.clientsByWorkspace])
  const visibleClients = useMemo(() => {
    const query = clientSearch.trim().toLocaleLowerCase('ar')
    if (!query) return clients
    return clients.filter((item) => [item.name, item.company, item.email, item.phone, item.notes, ...(item.tags ?? [])].filter(Boolean).some((value) => value?.toLocaleLowerCase('ar').includes(query)))
  }, [clientSearch, clients])

  function persist(next: WorkspaceFallback) {
    setData(next)
    persistWorkspaceFallback(next)
  }

  async function loadWorkspaceAccess(workspaceId: string) {
    if (!backendAvailable || workspaceId.startsWith('local-')) {
      setMembers([])
      setInvitations([])
      setCurrentRole(activeWorkspace?.role ?? 'owner')
      setCanManageMembers(false)
      setCanManageClients(activeWorkspace?.role === 'owner' || activeWorkspace?.role === 'admin')
      return
    }
    setAccessLoading(true)
    try {
      const response = await fetch(`/api/workspaces/invitations?workspaceId=${encodeURIComponent(workspaceId)}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('workspace-access-failed')
      const payload = await response.json() as { members?: WorkspaceMember[]; invitations?: WorkspaceInvitation[]; currentRole?: 'owner' | 'admin' | 'member'; canManage?: boolean; canManageMembers?: boolean; canManageClients?: boolean }
      setMembers(payload.members ?? [])
      setInvitations(payload.invitations ?? [])
      setCurrentRole(payload.currentRole ?? null)
      setCanManageMembers(Boolean(payload.canManageMembers ?? payload.canManage))
      setCanManageClients(Boolean(payload.canManageClients))
      if (payload.currentRole === 'admin' && inviteRole === 'admin') setInviteRole('member')
    } catch {
      setMembers([])
      setInvitations([])
      setCurrentRole(null)
      setCanManageMembers(false)
      setCanManageClients(false)
    } finally {
      setAccessLoading(false)
    }
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
        return [item.id, (payload.clients ?? []).map((client) => ({ ...client, workspaceId: item.id }))] as const
      }))
      const nextArchivedClients = await Promise.all(nextWorkspaces.map(async (item) => {
        const response = await fetch(`/api/clients?workspaceId=${encodeURIComponent(item.id)}&archived=true`, { cache: 'no-store' })
        if (!response.ok) return [item.id, []] as const
        const payload = await response.json() as { clients: Array<Client & { archivedAt: string | Date | null }> }
        return [item.id, (payload.clients ?? []).filter((client): client is Client & { archivedAt: string | Date } => Boolean(client.archivedAt)).map((client) => ({ ...client, workspaceId: item.id, archivedAt: typeof client.archivedAt === 'string' ? client.archivedAt : new Date(client.archivedAt).toISOString() }))] as const
      }))
      const nextData: WorkspaceFallback = { workspaces: nextWorkspaces, clientsByWorkspace: Object.fromEntries(nextClients), archivedClientsByWorkspace: Object.fromEntries(nextArchivedClients) }
      setBackendAvailable(true)
      setData(nextData)
      const nextActiveWorkspaceId = workspacesPayload.activeWorkspaceId ?? nextWorkspaces[0]?.id ?? 'local-personal'
      setActiveWorkspaceId(nextActiveWorkspaceId)
      await loadWorkspaceAccess(nextActiveWorkspaceId)
    } catch {
      const local = readWorkspaceFallback()
      setBackendAvailable(false)
      setData(local)
      setActiveWorkspaceId(local.workspaces[0]?.id ?? 'local-personal')
      setMembers([])
      setInvitations([])
      setCurrentRole('owner')
      setCanManageMembers(false)
      setCanManageClients(true)
      setNotice('تعمل مساحة العمل بالبيانات المحلية مؤقتًا لأن قاعدة البيانات غير متاحة.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // loadData intentionally runs once on mount; action handlers are defined inside the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createWorkspace() {
    const name = workspaceName.trim()
    if (!name) {
      setWorkspaceError('اكتب اسم مساحة العمل أولًا.')
      return
    }
    if (saving) return
    setWorkspaceError('')
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
      archivedClientsByWorkspace: { ...data.archivedClientsByWorkspace, [created.id]: [] },
    })
    setActiveWorkspaceId(created.id)
    setWorkspaceName('')
    setNotice('تم حفظ مساحة العمل محليًا.')
    setSaving(false)
  }

  function resetClientEditor() {
    setEditingClientId(null)
    setClientError('')
    setClientName('')
    setClientCompany('')
    setClientEmail('')
    setClientPhone('')
    setClientStatus('active')
    setClientTags('')
    setClientNotes('')
  }

  function beginEditClient(item: Client) {
    setEditingClientId(item.id)
    setClientName(item.name)
    setClientCompany(item.company ?? '')
    setClientEmail(item.email ?? '')
    setClientPhone(item.phone ?? '')
    setClientStatus(item.status ?? 'active')
    setClientTags((item.tags ?? []).join(', '))
    setClientNotes(item.notes ?? '')
    setClientError('')
    setNotice('')
  }

  async function updateClient() {
    if (!editingClientId || !activeWorkspace) return
    const name = clientName.trim()
    if (!name) {
      setClientError('اكتب اسم العميل أولًا.')
      return
    }
    if (clientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      setClientError('اكتب بريدًا إلكترونيًا صحيحًا أو اترك الحقل فارغًا.')
      return
    }
    if (saving) return
    setClientError('')
    setSaving(true)
    setNotice('')
    const payload = { name, company: clientCompany, email: clientEmail, phone: clientPhone, status: clientStatus, tags: clientTags.split(',').map((tag) => tag.trim()).filter(Boolean), notes: clientNotes }
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
    const nextClients = clients.map((item) => item.id === editingClientId ? { ...item, name: payload.name, company: payload.company || null, email: payload.email || null, phone: payload.phone || null, status: payload.status, tags: payload.tags, notes: payload.notes || null } : item)
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
    const archived: Client & { archivedAt: string } = { ...item, archivedAt: new Date().toISOString() }
    persist({
      ...data,
      clientsByWorkspace: { ...data.clientsByWorkspace, [activeWorkspace.id]: clients.filter((clientItem) => clientItem.id !== item.id) },
      archivedClientsByWorkspace: { ...data.archivedClientsByWorkspace, [activeWorkspace.id]: [archived, ...(data.archivedClientsByWorkspace[activeWorkspace.id] ?? []).filter((clientItem) => clientItem.id !== item.id)] },
    })
    if (editingClientId === item.id) resetClientEditor()
    setNotice('تمت أرشفة العميل محليًا.')
    setSaving(false)
  }

  async function createClient() {
    const name = clientName.trim()
    if (!activeWorkspace) return
    if (!name) {
      setClientError('اكتب اسم العميل أولًا.')
      return
    }
    if (clientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      setClientError('اكتب بريدًا إلكترونيًا صحيحًا أو اترك الحقل فارغًا.')
      return
    }
    if (saving) return
    setClientError('')
    setSaving(true)
    setNotice('')
    const payload = { name, company: clientCompany, email: clientEmail, phone: clientPhone, status: clientStatus, tags: clientTags.split(',').map((tag) => tag.trim()).filter(Boolean), notes: clientNotes }
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

    const created: Client = { id: `local-${crypto.randomUUID()}`, workspaceId: activeWorkspace.id, name, company: clientCompany || null, email: clientEmail || null, phone: clientPhone || null, status: clientStatus, tags: clientTags.split(',').map((tag) => tag.trim()).filter(Boolean), notes: clientNotes || null }
    persist({
      ...data,
      clientsByWorkspace: { ...data.clientsByWorkspace, [activeWorkspace.id]: [...clients, created] },
      archivedClientsByWorkspace: { ...data.archivedClientsByWorkspace, [activeWorkspace.id]: data.archivedClientsByWorkspace[activeWorkspace.id] ?? [] },
    })
    resetClientEditor()
    setNotice('تم حفظ العميل محليًا.')
    setSaving(false)
  }

  async function inviteMember() {
    if (!activeWorkspace || saving) return
    const email = inviteEmail.trim().toLocaleLowerCase('en-US')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('اكتب بريدًا إلكترونيًا صحيحًا.')
      return
    }
    if (!backendAvailable || activeWorkspace.id.startsWith('local-')) {
      setInviteError('الدعوات تحتاج اتصالًا بقاعدة البيانات.')
      return
    }
    setInviteError('')
    setSaving(true)
    setGeneratedToken('')
    try {
      const response = await fetch('/api/workspaces/invitations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace.id, invitedEmail: email, role: inviteRole }),
      })
      const payload = await response.json() as { error?: string; token?: string }
      if (!response.ok) throw new Error(payload.error ?? 'تعذر إنشاء الدعوة.')
      setInviteEmail('')
      setGeneratedToken(payload.token ?? '')
      await loadWorkspaceAccess(activeWorkspace.id)
      setNotice('تم إنشاء الدعوة. شارك الرمز التجريبي مع صاحب البريد.')
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'تعذر إنشاء الدعوة.')
    } finally {
      setSaving(false)
    }
  }

  async function acceptInvitation() {
    const token = inviteToken.trim()
    if (!token || saving) return
    if (!backendAvailable) {
      setInviteError('قبول الدعوات يحتاج اتصالًا بقاعدة البيانات.')
      return
    }
    setInviteError('')
    setSaving(true)
    try {
      const response = await fetch('/api/workspaces/invitations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'accept', token }),
      })
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'تعذر قبول الدعوة.')
      setInviteToken('')
      await loadData()
      setNotice('تم قبول الدعوة وتفعيل عضويتك في مساحة العمل.')
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'تعذر قبول الدعوة.')
    } finally {
      setSaving(false)
    }
  }

  async function revokeInvitation(invitation: WorkspaceInvitation) {
    if (!activeWorkspace || saving) return
    setSaving(true)
    setInviteError('')
    try {
      const response = await fetch('/api/workspaces/invitations', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace.id, invitationId: invitation.id }),
      })
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'تعذر إبطال الدعوة.')
      await loadWorkspaceAccess(activeWorkspace.id)
      setNotice('تم إبطال الدعوة.')
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'تعذر إبطال الدعوة.')
    } finally {
      setSaving(false)
    }
  }

  async function removeMember(member: WorkspaceMember) {
    if (!activeWorkspace || saving) return
    setSaving(true)
    setInviteError('')
    try {
      const response = await fetch(`/api/workspaces/members/${encodeURIComponent(member.id)}`, { method: 'DELETE' })
      const payload = await response.json() as { error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'تعذر إبطال وصول العضو.')
      await loadWorkspaceAccess(activeWorkspace.id)
      setNotice('تم إبطال وصول العضو من مساحة العمل.')
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'تعذر إبطال وصول العضو.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`h-2.5 w-2.5 rounded-full ${backendAvailable ? 'bg-primary' : 'bg-warning'}`} />
          {backendAvailable ? 'مزامنة قاعدة البيانات مفعّلة' : 'وضع محلي مؤقت'}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/workspace/dashboard" className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-2 text-xs font-semibold"><LayoutDashboard className="h-4 w-4" /> لوحة العمل <ArrowLeft className="h-3.5 w-3.5" /></Link>
          <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      {notice ? <div role="status" aria-live="polite" aria-atomic="true" className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{notice}</div> : null}

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <ContentCard title="مساحات العمل" description="افصل بين حياتك الشخصية ومشاريع العمل بدون تغيير حسابك.">
          <div className="space-y-2">
            {loading ? <p role="status" aria-live="polite" aria-busy="true" className="text-sm text-muted-foreground">جاري تحميل المساحات...</p> : null}
            {data.workspaces.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={item.id === activeWorkspace?.id ? 'secondary' : 'ghost'}
                className="h-auto w-full justify-start gap-3 rounded-2xl px-3 py-3 text-right"
                onClick={() => { setActiveWorkspaceId(item.id); void loadWorkspaceAccess(item.id) }}
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
            <Input value={workspaceName} onChange={(event) => { setWorkspaceName(event.target.value); if (workspaceError) setWorkspaceError('') }} placeholder="اسم مساحة جديدة" aria-label="اسم مساحة العمل الجديدة" aria-invalid={Boolean(workspaceError)} aria-describedby={workspaceError ? 'workspace-name-error' : undefined} />
            {workspaceError && <p id="workspace-name-error" role="alert" aria-live="assertive" aria-atomic="true" className="text-xs text-destructive">{workspaceError}</p>}
            <Select value={workspaceKind} onChange={(event) => setWorkspaceKind(event.target.value)} aria-label="نوع مساحة العمل">
              <option value="work">عمل حر</option>
              <option value="team">فريق تجريبي</option>
            </Select>
            <Button type="button" onClick={() => void createWorkspace()} disabled={saving} className="w-full">
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
                  <Link href={`/workspace/clients/${encodeURIComponent(item.id)}`} className="min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <p className="truncate font-medium">{item.name}</p>
                    {item.company ? <p className="mt-1 truncate text-xs text-muted-foreground">{item.company}</p> : null}<div className="mt-2 flex flex-wrap gap-1"><span className="rounded-full bg-accent px-2 py-1 text-[10px] text-accent-foreground">{item.status === 'lead' ? 'عميل محتمل' : item.status === 'paused' ? 'متوقف' : 'نشط'}</span>{(item.tags ?? []).slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-card px-2 py-1 text-[10px] text-muted-foreground">{tag}</span>)}</div>
                  </Link>
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                {item.email ? <p className="mt-3 truncate text-xs text-muted-foreground">{item.email}</p> : null}{item.phone ? <p dir="ltr" className="mt-1 truncate text-right text-xs text-muted-foreground">{item.phone}</p> : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link href={`/workspace/clients/${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-xs font-semibold text-primary">فتح الملف <ArrowLeft className="h-3.5 w-3.5" /></Link>
                  {canManageClients ? <>
                    <Button type="button" variant="ghost" size="sm" onClick={() => beginEditClient(item)} disabled={saving} aria-label={`تعديل ${item.name}`}>
                      <Pencil className="h-4 w-4" />
                      تعديل
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void archiveClient(item)} disabled={saving} aria-label={`أرشفة ${item.name}`}>
                      <Archive className="h-4 w-4" />
                      أرشفة
                    </Button>
                  </> : <span className="text-xs text-muted-foreground">للقراءة فقط</span>}
                </div>
              </div>
            ))}
            {!loading && visibleClients.length === 0 ? <p className="text-sm text-muted-foreground sm:col-span-2">{clients.length ? 'لا توجد نتائج مطابقة للبحث.' : 'لا يوجد عملاء في هذه المساحة بعد.'}</p> : null}
          </div>
          {!canManageClients ? <SystemState kind="permission" title="صلاحية قراءة فقط" description="يمكنك استعراض العملاء في هذه المساحة، بينما الإضافة والتعديل والأرشفة متاحة لمالك المساحة ومديريها." /> : null}
          {canManageClients ? <div className="mt-5 space-y-3 border-t border-border pt-4">
            <Input value={clientName} onChange={(event) => { setClientName(event.target.value); if (clientError) setClientError('') }} placeholder="اسم العميل" aria-label="اسم العميل" aria-invalid={Boolean(clientError)} aria-describedby={clientError ? 'client-form-error' : undefined} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={clientCompany} onChange={(event) => setClientCompany(event.target.value)} placeholder="الشركة أو النشاط" aria-label="الشركة أو النشاط" />
              <Input type="email" value={clientEmail} onChange={(event) => { setClientEmail(event.target.value); if (clientError) setClientError('') }} placeholder="البريد الإلكتروني" aria-label="البريد الإلكتروني" aria-invalid={Boolean(clientError)} aria-describedby={clientError ? 'client-form-error' : undefined} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2"><Input dir="ltr" value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="رقم الهاتف" aria-label="رقم هاتف العميل" className="text-right" /><Select value={clientStatus} onChange={(event) => setClientStatus(event.target.value as 'lead' | 'active' | 'paused')} aria-label="حالة العميل"><option value="lead">عميل محتمل</option><option value="active">نشط</option><option value="paused">متوقف</option></Select></div><Input value={clientTags} onChange={(event) => setClientTags(event.target.value)} placeholder="وسوم مفصولة بفواصل" aria-label="وسوم العميل" /><Textarea value={clientNotes} onChange={(event) => setClientNotes(event.target.value)} placeholder="ملاحظات أولية (اختياري)" aria-label="ملاحظات العميل" />
            {clientError && <p id="client-form-error" role="alert" aria-live="assertive" aria-atomic="true" className="text-xs text-destructive">{clientError}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void (editingClientId ? updateClient() : createClient())} disabled={!activeWorkspace || saving}>
                {editingClientId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingClientId ? 'حفظ التعديل' : 'إضافة عميل'}
              </Button>
              {editingClientId ? <Button type="button" variant="outline" onClick={resetClientEditor} disabled={saving}><X className="h-4 w-4" />إلغاء</Button> : null}
            </div>
          </div> : null}
        </ContentCard>
      </div>

      <ContentCard title="أعضاء ودعوات مساحة العمل" description="إدارة وصول الفريق بطريقة تجريبية؛ لا يوجد إرسال بريد آلي حتى الآن.">
        {activeWorkspace?.id.startsWith('local-') ? <p className="rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">إدارة الأعضاء والدعوات متاحة عند اتصال قاعدة البيانات فقط.</p> : null}
        {accessLoading ? <p role="status" aria-live="polite" aria-busy="true" className="text-sm text-muted-foreground">جاري تحميل العضوية...</p> : null}
        {inviteError ? <p role="alert" aria-live="assertive" aria-atomic="true" className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{inviteError}</p> : null}

        {canManageMembers && activeWorkspace ? <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <p className="font-medium">دعوة عضو جديد</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
            <Input type="email" value={inviteEmail} onChange={(event) => { setInviteEmail(event.target.value); if (inviteError) setInviteError('') }} placeholder="البريد الإلكتروني للعضو" aria-label="البريد الإلكتروني للعضو" />
            <Select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} aria-label="دور العضو">
              <option value="member">عضو</option>
              {currentRole === 'owner' ? <option value="admin">مدير</option> : null}
            </Select>
            <Button type="button" onClick={() => void inviteMember()} disabled={saving || activeWorkspace.id.startsWith('local-')}>
              <Mail className="h-4 w-4" />
              إنشاء دعوة
            </Button>
          </div>
          {generatedToken ? <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-sm">
            <p className="font-medium text-primary">رمز الدعوة التجريبي</p>
            <code dir="ltr" className="mt-2 block break-all rounded-xl bg-background px-3 py-2 text-xs">{generatedToken}</code>
            <p className="mt-2 text-xs text-muted-foreground">انسخ الرمز وأرسله يدويًا إلى البريد المدعو. الرمز لا يُخزّن بصورته الأصلية.</p>
          </div> : null}
        </div> : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">الأعضاء الحاليون</p>
                {currentRole ? <p className="mt-1 text-xs text-muted-foreground">دورك الحالي: {currentRole === 'owner' ? 'مالك' : currentRole === 'admin' ? 'مدير' : 'عضو'}</p> : null}
              </div>
              <span className="text-xs text-muted-foreground">{members.length}</span>
            </div>
            <div className="space-y-2">
              {members.map((member) => <div key={member.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Users className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{member.name}</span>
                  <span dir="ltr" className="block truncate text-right text-xs text-muted-foreground">{member.email}</span>
                </span>
                <span className="text-xs text-muted-foreground">{member.role === 'owner' ? 'مالك' : member.role === 'admin' ? 'مدير' : 'عضو'}</span>
                {canManageMembers && member.role !== 'owner' && (currentRole === 'owner' || member.role !== 'admin') ? <Button type="button" variant="ghost" size="sm" onClick={() => void removeMember(member)} disabled={saving} aria-label={`إبطال وصول ${member.name}`}><UserMinus className="h-4 w-4" /></Button> : null}
              </div>)}
              {!accessLoading && members.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد عضويات ظاهرة لهذه المساحة.</p> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-medium">الدعوات المعلقة</p>
              <span className="text-xs text-muted-foreground">{invitations.length}</span>
            </div>
            <div className="space-y-2">
              {invitations.map((invitation) => <div key={invitation.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span dir="ltr" className="min-w-0 flex-1 truncate text-right text-sm">{invitation.invitedEmail}</span>
                {canManageMembers ? <Button type="button" variant="ghost" size="sm" onClick={() => void revokeInvitation(invitation)} disabled={saving} aria-label={`إبطال دعوة ${invitation.invitedEmail}`}><X className="h-4 w-4" /></Button> : null}
              </div>)}
              {!accessLoading && invitations.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد دعوات معلقة.</p> : null}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><p className="font-medium">قبول دعوة برمز</p></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input dir="ltr" value={inviteToken} onChange={(event) => { setInviteToken(event.target.value); if (inviteError) setInviteError('') }} placeholder="ألصق رمز الدعوة هنا" aria-label="رمز الدعوة" className="text-left" />
            <Button type="button" variant="outline" onClick={() => void acceptInvitation()} disabled={saving || !inviteToken.trim()}>قبول الدعوة</Button>
          </div>
          <p className="text-xs text-muted-foreground">سيتم التحقق من أن البريد الحالي يطابق البريد الذي أُرسلت إليه الدعوة قبل تفعيل العضوية.</p>
        </div>
      </ContentCard>

      {activeWorkspace ? <ClientPortalManager workspace={activeWorkspace} clients={clients} canManage={canManageClients} /> : null}
    </div>
  )
}
