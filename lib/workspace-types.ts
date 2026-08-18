'use client'

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export type Workspace = {
  id: string
  name: string
  kind: string
  role: WorkspaceRole
}

export type Client = {
  id: string
  workspaceId: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  notes: string | null
}

export type ArchivedClient = Client & {
  archivedAt: string
}

export type WorkspaceMember = {
  id: string
  workspaceId: string
  userId: string
  role: WorkspaceRole
  status: string
  joinedAt: string | Date | null
  name: string
  email: string
}

export type WorkspaceInvitation = {
  id: string
  workspaceId: string
  invitedEmail: string
  role: WorkspaceRole
  status: string
  expiresAt: string | Date
  acceptedAt: string | Date | null
  createdAt: string | Date
}

export type WorkspaceFallback = {
  workspaces: Workspace[]
  clientsByWorkspace: Record<string, Client[]>
  archivedClientsByWorkspace: Record<string, ArchivedClient[]>
}

export const WORKSPACE_STORAGE_KEY = 'personal-command-center-workspace-v1'

export const workspaceFallback: WorkspaceFallback = {
  workspaces: [{ id: 'local-personal', name: 'مساحتي الشخصية', kind: 'personal', role: 'owner' }],
  clientsByWorkspace: { 'local-personal': [] },
  archivedClientsByWorkspace: { 'local-personal': [] },
}

function normalizeClient(value: unknown, workspaceId: string): Client | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Partial<Client>
  if (typeof item.id !== 'string' || typeof item.name !== 'string') return null
  return {
    id: item.id,
    workspaceId: typeof item.workspaceId === 'string' && item.workspaceId ? item.workspaceId : workspaceId,
    name: item.name,
    company: typeof item.company === 'string' ? item.company : null,
    email: typeof item.email === 'string' ? item.email : null,
    phone: typeof item.phone === 'string' ? item.phone : null,
    notes: typeof item.notes === 'string' ? item.notes : null,
  }
}

export function readWorkspaceFallback(): WorkspaceFallback {
  if (typeof window === 'undefined') return workspaceFallback
  try {
    const parsed = JSON.parse(window.localStorage.getItem(WORKSPACE_STORAGE_KEY) ?? '') as Partial<WorkspaceFallback>
    if (!Array.isArray(parsed.workspaces) || !parsed.clientsByWorkspace) return workspaceFallback
    const workspaces = parsed.workspaces.filter((item): item is Workspace => Boolean(item && typeof item.id === 'string' && typeof item.name === 'string'))
    const clientsByWorkspace = Object.fromEntries(workspaces.map((workspace) => [
      workspace.id,
      Array.isArray(parsed.clientsByWorkspace?.[workspace.id])
        ? parsed.clientsByWorkspace[workspace.id].map((item) => normalizeClient(item, workspace.id)).filter((item): item is Client => Boolean(item))
        : [],
    ]))
    const archivedClientsByWorkspace = Object.fromEntries(workspaces.map((workspace) => [
      workspace.id,
      Array.isArray(parsed.archivedClientsByWorkspace?.[workspace.id])
        ? parsed.archivedClientsByWorkspace[workspace.id]
          .map((item) => {
            const client = normalizeClient(item, workspace.id)
            return client && typeof item.archivedAt === 'string' ? { ...client, archivedAt: item.archivedAt } : null
          })
          .filter((item): item is ArchivedClient => Boolean(item))
        : [],
    ]))
    return { workspaces, clientsByWorkspace, archivedClientsByWorkspace }
  } catch {
    return workspaceFallback
  }
}

export function persistWorkspaceFallback(next: WorkspaceFallback) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(next))
}
