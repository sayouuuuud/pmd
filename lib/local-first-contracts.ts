export type LocalSyncState = 'local' | 'pending' | 'synced' | 'failed'

export type LocalScope = {
  userId: string
  workspaceId?: string
  role?: 'owner' | 'admin' | 'member'
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
  if (record.userId && record.userId !== scope.userId) return false
  if (record.workspaceId && record.workspaceId !== scope.workspaceId) return false
  return true
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
