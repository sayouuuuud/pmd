import { and, eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { dailyPlanItem } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

const statuses = new Set(['pending', 'done', 'snoozed'])

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const body = await request.json() as Record<string, unknown>
    const patch: Partial<typeof dailyPlanItem.$inferInsert> = { updatedAt: new Date() }
    if (typeof body.status === 'string' && statuses.has(body.status)) patch.status = body.status
    if (typeof body.startAt === 'string') patch.startAt = body.startAt
    if (typeof body.endAt === 'string') patch.endAt = body.endAt
    if (typeof body.position === 'number') patch.position = body.position
    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim()
    if (body.isManualOverride === true || body.isManualOverride === false) patch.isManualOverride = body.isManualOverride
    const db = getDb()
    const [updated] = await db.update(dailyPlanItem).set(patch).where(and(eq(dailyPlanItem.id, id), eq(dailyPlanItem.userId, user.id))).returning()
    if (!updated) return json({ error: 'عنصر خطة اليوم غير موجود.' }, { status: 404 })
    return json({ item: updated })
  } catch {
    return backendUnavailable()
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const db = getDb()
    const [deleted] = await db.delete(dailyPlanItem).where(and(eq(dailyPlanItem.id, id), eq(dailyPlanItem.userId, user.id))).returning({ id: dailyPlanItem.id })
    if (!deleted) return json({ error: 'عنصر خطة اليوم غير موجود.' }, { status: 404 })
    return json({ ok: true })
  } catch {
    return backendUnavailable()
  }
}
