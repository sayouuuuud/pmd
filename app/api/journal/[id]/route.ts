import { and, eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { journalEntry } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function textValue(value: unknown, fallback = '', maxLength = 12000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : fallback
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()
  try {
    const { id } = await context.params
    const body = await request.json() as Record<string, unknown>
    const db = getDb()
    const [entry] = await db.update(journalEntry).set({
      ...(typeof body.title === 'string' ? { title: textValue(body.title, 'يومياتي', 160) } : {}),
      ...(typeof body.body === 'string' ? { body: textValue(body.body, '', 12000) } : {}),
      ...(typeof body.mood === 'string' ? { mood: textValue(body.mood, 'محايد', 40) } : {}),
      ...(typeof body.localDate === 'string' ? { localDate: textValue(body.localDate, '', 20) } : {}),
      updatedAt: new Date(),
    }).where(and(eq(journalEntry.id, id), eq(journalEntry.userId, currentUser.id))).returning()
    if (!entry) return json({ error: 'اليومية غير موجودة' }, { status: 404 })
    return json({ entry })
  } catch {
    return backendUnavailable()
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()
  try {
    const { id } = await context.params
    const db = getDb()
    const [entry] = await db.update(journalEntry).set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(journalEntry.id, id), eq(journalEntry.userId, currentUser.id))).returning({ id: journalEntry.id })
    if (!entry) return json({ error: 'اليومية غير موجودة' }, { status: 404 })
    return json({ ok: true, id: entry.id })
  } catch {
    return backendUnavailable()
  }
}
