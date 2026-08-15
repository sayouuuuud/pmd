import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { goal } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

const horizons = new Set(['quarter', 'year', 'someday'])
const statuses = new Set(['active', 'paused', 'completed'])

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function boundedProgress(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : undefined
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const body = await request.json() as Record<string, unknown>
    const patch: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim()
    if (typeof body.description === 'string') patch.description = body.description.trim()
    if (typeof body.targetLabel === 'string') patch.targetLabel = body.targetLabel.trim()
    if (typeof body.horizon === 'string' && horizons.has(body.horizon)) patch.horizon = body.horizon
    if (typeof body.status === 'string' && statuses.has(body.status)) patch.status = body.status
    const progress = boundedProgress(body.progress)
    if (progress !== undefined) patch.progress = progress

    const db = getDb()
    const [updated] = await db.update(goal).set(patch).where(and(eq(goal.id, id), eq(goal.userId, user.id), isNull(goal.archivedAt))).returning()
    if (!updated) return json({ error: 'الهدف غير موجود.' }, { status: 404 })
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
    const [updated] = await db.update(goal).set({ archivedAt: new Date(), updatedAt: new Date() }).where(and(eq(goal.id, id), eq(goal.userId, user.id), isNull(goal.archivedAt))).returning()
    if (!updated) return json({ error: 'الهدف غير موجود.' }, { status: 404 })
    return json({ item: updated })
  } catch {
    return backendUnavailable()
  }
}
