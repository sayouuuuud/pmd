import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { goal, project } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

const statuses = new Set(['backlog', 'in-progress', 'paused', 'done'])

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function boundedProgress(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : undefined
}

async function ownedGoalExists(db: ReturnType<typeof getDb>, goalId: string, userId: string) {
  const [row] = await db.select({ id: goal.id }).from(goal).where(and(eq(goal.id, goalId), eq(goal.userId, userId), isNull(goal.archivedAt))).limit(1)
  return Boolean(row)
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
    if (typeof body.dueLabel === 'string' && body.dueLabel.trim()) patch.dueLabel = body.dueLabel.trim()
    if (typeof body.status === 'string' && statuses.has(body.status)) patch.status = body.status
    const progress = boundedProgress(body.progress)
    if (progress !== undefined) patch.progress = progress
    if (body.goalId === null) patch.goalId = null
    if (typeof body.goalId === 'string' && body.goalId.trim()) {
      const db = getDb()
      if (!(await ownedGoalExists(db, body.goalId, user.id))) return json({ error: 'الهدف المرتبط غير موجود.' }, { status: 400 })
      patch.goalId = body.goalId
    }

    const db = getDb()
    const [updated] = await db.update(project).set(patch).where(and(eq(project.id, id), eq(project.userId, user.id), isNull(project.archivedAt))).returning()
    if (!updated) return json({ error: 'المشروع غير موجود.' }, { status: 404 })
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
    const [updated] = await db.update(project).set({ archivedAt: new Date(), updatedAt: new Date() }).where(and(eq(project.id, id), eq(project.userId, user.id), isNull(project.archivedAt))).returning()
    if (!updated) return json({ error: 'المشروع غير موجود.' }, { status: 404 })
    return json({ item: updated })
  } catch {
    return backendUnavailable()
  }
}
