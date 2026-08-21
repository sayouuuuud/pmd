export const SYNC_QUEUE_VERSION = 1
export const SYNC_QUEUE_STORAGE_KEY = 'personal-command-center-sync-queue-v1'

export type SyncQueueStatus = 'pending' | 'processing' | 'failed'
export type SyncQueueItem = {
  id: string
  idempotencyKey: string
  entity: string
  action: string
  entityId?: string
  status: SyncQueueStatus
  attempts: number
  createdAt: string
  lastAttemptAt?: string
  nextAttemptAt?: string
  error?: string
}
export type SyncQueueEnvelope = { version: number; updatedAt: string; items: SyncQueueItem[] }
export type SyncStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export type SyncTransport = (item: SyncQueueItem) => Promise<unknown>

const MAX_ATTEMPTS = 4
const BASE_BACKOFF_MS = 1_000

function isItem(value: unknown): value is SyncQueueItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<SyncQueueItem>
  return typeof item.id === 'string' && typeof item.idempotencyKey === 'string' && typeof item.entity === 'string' && typeof item.action === 'string' && typeof item.createdAt === 'string' && typeof item.attempts === 'number' && (item.status === 'pending' || item.status === 'processing' || item.status === 'failed')
}

export function readSyncQueue(storage: SyncStorage, now = new Date()): SyncQueueItem[] {
  try {
    const raw = storage.getItem(SYNC_QUEUE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<SyncQueueEnvelope> | SyncQueueItem[]
    const candidates = Array.isArray(parsed) ? parsed : parsed.version === SYNC_QUEUE_VERSION && Array.isArray(parsed.items) ? parsed.items : []
    return candidates.filter(isItem).map((item) => item.status === 'processing' ? { ...item, status: 'pending', nextAttemptAt: now.toISOString(), error: 'تمت استعادة العملية بعد انقطاع سابق.' } : item)
  } catch {
    return []
  }
}

export function writeSyncQueue(storage: SyncStorage, items: SyncQueueItem[]) {
  const envelope: SyncQueueEnvelope = { version: SYNC_QUEUE_VERSION, updatedAt: new Date().toISOString(), items }
  if (items.length === 0) storage.removeItem(SYNC_QUEUE_STORAGE_KEY)
  else storage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(envelope))
}

export function enqueueSync(items: SyncQueueItem[], input: Pick<SyncQueueItem, 'id' | 'entity' | 'action' | 'entityId'>, now = new Date()): SyncQueueItem[] {
  const existing = items.find((item) => item.idempotencyKey === input.id)
  const next: SyncQueueItem = {
    ...input,
    idempotencyKey: input.id,
    status: 'pending',
    attempts: existing?.attempts ?? 0,
    createdAt: existing?.createdAt ?? now.toISOString(),
  }
  return [...items.filter((item) => item.idempotencyKey !== input.id), next]
}

export function retryFailed(items: SyncQueueItem[], now = new Date()) {
  return items.map((item) => item.status === 'failed' ? { ...item, status: 'pending' as const, nextAttemptAt: now.toISOString(), error: undefined } : item)
}

export async function flushSyncQueue(items: SyncQueueItem[], transport: SyncTransport, now = () => new Date()): Promise<SyncQueueItem[]> {
  let queue = [...items]
  for (const queued of queue) {
    if (queued.status !== 'pending') continue
    const currentTime = now()
    if (queued.nextAttemptAt && Date.parse(queued.nextAttemptAt) > currentTime.getTime()) continue
    const processing = { ...queued, status: 'processing' as const, attempts: queued.attempts + 1, lastAttemptAt: currentTime.toISOString() }
    queue = queue.map((item) => item.idempotencyKey === queued.idempotencyKey ? processing : item)
    try {
      const result = await transport(processing)
      if (result === null) throw new Error('تعذر الاتصال بالخادم')
      queue = queue.filter((item) => item.idempotencyKey !== queued.idempotencyKey)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر إكمال المزامنة'
      const terminal = processing.attempts >= MAX_ATTEMPTS
      const delay = BASE_BACKOFF_MS * 2 ** Math.max(0, processing.attempts - 1)
      queue = queue.map((item) => item.idempotencyKey === queued.idempotencyKey ? {
        ...processing,
        status: terminal ? 'failed' as const : 'pending' as const,
        error: message,
        nextAttemptAt: terminal ? undefined : new Date(currentTime.getTime() + delay).toISOString(),
      } : item)
    }
  }
  return queue
}
