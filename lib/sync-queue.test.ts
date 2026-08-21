import { describe, expect, it, vi } from 'vitest'
import { enqueueSync, flushSyncQueue, readSyncQueue, retryFailed, SYNC_QUEUE_STORAGE_KEY, writeSyncQueue, type SyncStorage } from './sync-queue'

function memoryStorage(): SyncStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value) }, removeItem: (key) => { data.delete(key) } }
}

const input = { id: 'task:update:1', entity: 'المهام', action: 'تحديث', entityId: '1' }

describe('durable sync queue', () => {
  it('persists, restores and deduplicates by idempotency key', () => {
    const storage = memoryStorage()
    const once = enqueueSync([], input, new Date('2026-08-20T10:00:00Z'))
    const twice = enqueueSync(once, input, new Date('2026-08-20T11:00:00Z'))
    expect(twice).toHaveLength(1)
    expect(twice[0].createdAt).toBe('2026-08-20T10:00:00.000Z')
    writeSyncQueue(storage, twice)
    expect(readSyncQueue(storage)).toEqual(twice)
  })

  it('recovers an interrupted processing operation', () => {
    const storage = memoryStorage()
    storage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify({ version: 1, updatedAt: '', items: [{ ...enqueueSync([], input)[0], status: 'processing' }] }))
    expect(readSyncQueue(storage, new Date('2026-08-20T12:00:00Z'))[0]).toMatchObject({ status: 'pending', nextAttemptAt: '2026-08-20T12:00:00.000Z' })
  })

  it('flushes sequentially in creation order', async () => {
    const calls: string[] = []
    const queue = enqueueSync(enqueueSync([], input), { ...input, id: 'note:update:2', entityId: '2' })
    const result = await flushSyncQueue(queue, async (item) => { calls.push(item.id); return { ok: true } })
    expect(calls).toEqual(['task:update:1', 'note:update:2'])
    expect(result).toEqual([])
  })

  it('backs off and reaches a terminal failure after four attempts', async () => {
    const transport = vi.fn().mockRejectedValue(new Error('offline'))
    let queue = enqueueSync([], input, new Date('2026-08-20T10:00:00Z'))
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const time = new Date(`2026-08-20T10:00:0${attempt + 1}Z`)
      queue = queue.map((item) => ({ ...item, nextAttemptAt: time.toISOString() }))
      queue = await flushSyncQueue(queue, transport, () => time)
    }
    expect(queue[0]).toMatchObject({ status: 'failed', attempts: 4, error: 'offline' })
    expect(retryFailed(queue)[0]).toMatchObject({ status: 'pending', error: undefined })
  })
})
