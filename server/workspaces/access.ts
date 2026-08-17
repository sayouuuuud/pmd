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

export function canManageWorkspace(role: string | null | undefined) {
  return role === 'owner' || role === 'admin'
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
