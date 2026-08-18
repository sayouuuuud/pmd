import { and, eq } from 'drizzle-orm'
import type { AppDb } from '@/server/db'
import { workspace, workspaceMember } from '@/server/db/schema'

export async function getOrCreatePersonalWorkspace(db: AppDb, userId: string) {
  const [existing] = await db
    .select()
    .from(workspace)
    .where(and(eq(workspace.ownerId, userId), eq(workspace.kind, 'personal')))
    .limit(1)

  if (existing) {
    await ensureWorkspaceMember(db, existing.id, userId, 'owner')
    return existing
  }

  const workspaceId = crypto.randomUUID()
  const [created] = await db.insert(workspace).values({
    id: workspaceId,
    ownerId: userId,
    name: 'مساحتي الشخصية',
    kind: 'personal',
  }).returning()

  if (!created) throw new Error('Unable to create personal workspace')
  await ensureWorkspaceMember(db, created.id, userId, 'owner')
  return created
}

export async function ensureWorkspaceMember(db: AppDb, workspaceId: string, userId: string, role = 'member') {
  const [member] = await db
    .select()
    .from(workspaceMember)
    .where(and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, userId)))
    .limit(1)

  if (member) {
    if (member.status !== 'active') {
      const [restored] = await db.update(workspaceMember)
        .set({ status: 'active', role, joinedAt: member.joinedAt ?? new Date(), updatedAt: new Date() })
        .where(eq(workspaceMember.id, member.id))
        .returning()
      return restored ?? member
    }
    return member
  }

  const [created] = await db.insert(workspaceMember).values({
    id: crypto.randomUUID(),
    workspaceId,
    userId,
    role,
    status: 'active',
    joinedAt: new Date(),
  }).returning()

  return created
}

export async function getWorkspaceMember(db: AppDb, workspaceId: string, userId: string) {
  const [member] = await db
    .select()
    .from(workspaceMember)
    .where(and(
      eq(workspaceMember.workspaceId, workspaceId),
      eq(workspaceMember.userId, userId),
      eq(workspaceMember.status, 'active'),
    ))
    .limit(1)

  return member ?? null
}

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export type WorkspaceCapability =
  | 'workspace:read'
  | 'workspace:manage'
  | 'members:read'
  | 'members:manage'
  | 'clients:read'
  | 'clients:manage'

const ROLE_RANK: Record<WorkspaceRole, number> = { owner: 3, admin: 2, member: 1 }

const ROLE_CAPABILITIES: Record<WorkspaceRole, readonly WorkspaceCapability[]> = {
  owner: ['workspace:read', 'workspace:manage', 'members:read', 'members:manage', 'clients:read', 'clients:manage'],
  admin: ['workspace:read', 'members:read', 'members:manage', 'clients:read', 'clients:manage'],
  member: ['workspace:read', 'members:read', 'clients:read'],
}

export function normalizeWorkspaceRole(role: string | null | undefined): WorkspaceRole | null {
  return role === 'owner' || role === 'admin' || role === 'member' ? role : null
}

export function hasWorkspaceCapability(role: string | null | undefined, capability: WorkspaceCapability) {
  const normalized = normalizeWorkspaceRole(role)
  return normalized ? ROLE_CAPABILITIES[normalized].includes(capability) : false
}

export function canManageWorkspace(role: string | null | undefined) {
  return hasWorkspaceCapability(role, 'workspace:manage')
}

export function canManageMembers(role: string | null | undefined) {
  return hasWorkspaceCapability(role, 'members:manage')
}

export function canManageClients(role: string | null | undefined) {
  return hasWorkspaceCapability(role, 'clients:manage')
}

export function compareWorkspaceRoles(left: string | null | undefined, right: string | null | undefined) {
  return (ROLE_RANK[normalizeWorkspaceRole(left) ?? 'member'] ?? 0) - (ROLE_RANK[normalizeWorkspaceRole(right) ?? 'member'] ?? 0)
}

export async function getWorkspaceForMember(db: AppDb, workspaceId: string, userId: string) {
  const [row] = await db
    .select({ workspace })
    .from(workspace)
    .innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
    .where(and(
      eq(workspace.id, workspaceId),
      eq(workspaceMember.userId, userId),
      eq(workspaceMember.status, 'active'),
    ))
    .limit(1)

  return row?.workspace ?? null
}
