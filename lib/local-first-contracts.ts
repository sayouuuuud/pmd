export type LocalSyncState = 'local' | 'pending' | 'synced' | 'failed'

export type LocalWorkspaceRole = 'owner' | 'admin' | 'member'

/**
 * External actors are scoped to a shared project or resource in the portal.
 * They are deliberately distinct from workspace membership roles and are
 * enforced by the sharing layer in the collaboration phase.
 */
export type LocalExternalRole = 'client' | 'reader' | 'reviewer'

export type LocalShareRole = 'viewer' | 'commenter' | 'approver'

export type LocalScope = {
  userId: string
  workspaceId?: string
  role?: LocalWorkspaceRole
}

export type LocalOwnership =
  | { kind: 'personal'; userId: string }
  | { kind: 'workspace'; workspaceId: string; createdBy?: string }
  | { kind: 'shared'; workspaceId: string; resourceId: string; role: LocalShareRole | LocalExternalRole }

export type LocalRoleCapability =
  | 'read'
  | 'comment'
  | 'review'
  | 'approve'

export const LOCAL_EXTERNAL_ROLE_CAPABILITIES: Record<LocalExternalRole, readonly LocalRoleCapability[]> = {
  client: ['read', 'comment', 'review'],
  reader: ['read'],
  reviewer: ['read', 'review'],
}

export const LOCAL_SHARE_ROLE_CAPABILITIES: Record<LocalShareRole, readonly LocalRoleCapability[]> = {
  viewer: ['read'],
  commenter: ['read', 'comment'],
  approver: ['read', 'comment', 'review', 'approve'],
}

export type LocalEntityMeta = {
  id: string
  userId?: string
  workspaceId?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string | null
}

export type LocalRecord<T extends LocalEntityMeta = LocalEntityMeta> = T & {
  syncState: LocalSyncState
  syncError?: string | null
}

export type LocalStorageEnvelope<T extends LocalEntityMeta = LocalEntityMeta> = {
  version: number
  updatedAt: string
  records: LocalRecord<T>[]
}

export type LocalRepository<T extends LocalEntityMeta> = {
  list(scope: LocalScope): Promise<LocalRecord<T>[]>
  get(scope: LocalScope, id: string): Promise<LocalRecord<T> | null>
  create(scope: LocalScope, input: Omit<T, keyof LocalEntityMeta>): Promise<LocalRecord<T>>
  update(scope: LocalScope, id: string, patch: Partial<Omit<T, keyof LocalEntityMeta>>): Promise<LocalRecord<T> | null>
  archive(scope: LocalScope, id: string): Promise<LocalRecord<T> | null>
  restore(scope: LocalScope, id: string): Promise<LocalRecord<T> | null>
}

export function isLocalRecordInScope(record: LocalEntityMeta, scope: LocalScope): boolean {
  const hasUserOwnership = Boolean(record.userId)
  const hasWorkspaceOwnership = Boolean(record.workspaceId)

  // A local record without an explicit owner must never enter a user envelope.
  if (!hasUserOwnership && !hasWorkspaceOwnership) return false
  if (hasUserOwnership && record.userId !== scope.userId) return false
  if (hasWorkspaceOwnership && record.workspaceId !== scope.workspaceId) return false
  return true
}

export function getLocalOwnership(record: LocalEntityMeta): LocalOwnership | null {
  if (record.workspaceId) {
    return { kind: 'workspace', workspaceId: record.workspaceId, createdBy: record.userId }
  }
  if (record.userId) return { kind: 'personal', userId: record.userId }
  return null
}

export function createLocalStorageEnvelope<T extends LocalEntityMeta>(records: LocalRecord<T>[], version = 1): LocalStorageEnvelope<T> {
  return {
    version,
    updatedAt: new Date().toISOString(),
    records,
  }
}

export function markLocalRecordPending<T extends LocalRecord>(record: T): T {
  return { ...record, syncState: 'pending', syncError: null }
}

export function markLocalRecordSynced<T extends LocalRecord>(record: T): T {
  return { ...record, syncState: 'synced', syncError: null }
}

export function markLocalRecordFailed<T extends LocalRecord>(record: T, syncError: string): T {
  return { ...record, syncState: 'failed', syncError }
}
