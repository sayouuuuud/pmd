import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { note } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const body = await request.json() as Record<string, unknown>
    const patch: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim()
    if (typeof body.body === 'string') patch.body = body.body.trim()
    if (typeof body.tag === 'string' && body.tag.trim()) patch.tag = body.tag.trim()
    if (typeof body.pinned === 'boolean') patch.pinned = body.pinned

    const db = getDb()
    const [updated] = await db.update(note).set(patch).where(and(eq(note.id, id), eq(note.userId, user.id), isNull(note.archivedAt))).returning()
    if (!updated) return json({ error: 'الملاحظة غير موجودة.' }, { status: 404 })
    return json({ item: updated })
  } catch {
    return backendUnavailable()
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const db = getDb()
    const [updated] = await db.update(note).set({ archivedAt: new Date(), updatedAt: new Date() }).where(and(eq(note.id, id), eq(note.userId, user.id), isNull(note.archivedAt))).returning()
    if (!updated) return json({ error: 'الملاحظة غير موجودة.' }, { status: 404 })
    return json({ item: updated })
  } catch {
    return backendUnavailable()
  }
}
