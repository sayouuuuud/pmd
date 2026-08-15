import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { reminder } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

const statuses = new Set(['pending', 'done', 'snoozed'])

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const body = await request.json() as Record<string, unknown>
    const patch: Partial<typeof reminder.$inferInsert> = {}
    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim()
    if (typeof body.dueAt === 'string' && body.dueAt.trim()) patch.dueAt = body.dueAt.trim()
    if (typeof body.status === 'string' && statuses.has(body.status)) patch.status = body.status
    if (body.sourceId === null || (typeof body.sourceId === 'string' && body.sourceId.trim())) patch.sourceId = typeof body.sourceId === 'string' ? body.sourceId.trim() : null
    if (body.repeatLabel === null || (typeof body.repeatLabel === 'string' && body.repeatLabel.trim())) patch.repeatLabel = typeof body.repeatLabel === 'string' ? body.repeatLabel.trim() : null
    if (body.archived === true) patch.archivedAt = new Date()
    patch.updatedAt = new Date()
    const [updated] = await getDb().update(reminder).set(patch).where(and(eq(reminder.id, id), eq(reminder.userId, user.id), isNull(reminder.archivedAt))).returning()
    if (!updated) return json({ error: 'التذكير غير موجود.' }, { status: 404 })
    return json({ item: updated })
  } catch {
    return backendUnavailable()
  }
}

export async function DELETE(request: Request, context: Context) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const [archived] = await getDb().update(reminder).set({ archivedAt: new Date(), updatedAt: new Date() }).where(and(eq(reminder.id, id), eq(reminder.userId, user.id), isNull(reminder.archivedAt))).returning({ id: reminder.id })
    if (!archived) return json({ error: 'التذكير غير موجود.' }, { status: 404 })
    return json({ ok: true, id: archived.id })
  } catch {
    return backendUnavailable()
  }
}
