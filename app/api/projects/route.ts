import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { goal, project } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

const statuses = new Set(['backlog', 'in-progress', 'paused', 'done'])

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function boundedProgress(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0
}

async function ownedGoalExists(db: ReturnType<typeof getDb>, goalId: string, userId: string) {
  const [row] = await db.select({ id: goal.id }).from(goal).where(and(eq(goal.id, goalId), eq(goal.userId, userId), isNull(goal.archivedAt))).limit(1)
  return Boolean(row)
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true'
    const db = getDb()
    const rows = await db.select().from(project).where(
      includeArchived ? eq(project.userId, user.id) : and(eq(project.userId, user.id), isNull(project.archivedAt)),
    ).orderBy(desc(project.updatedAt)).limit(100)
    return json({ items: rows })
  } catch {
    return backendUnavailable()
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const body = await request.json() as Record<string, unknown>
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) return json({ error: 'اسم المشروع مطلوب.' }, { status: 400 })
    const goalId = typeof body.goalId === 'string' && body.goalId.trim() ? body.goalId : null
    const status = typeof body.status === 'string' && statuses.has(body.status) ? body.status : 'backlog'
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const dueLabel = typeof body.dueLabel === 'string' && body.dueLabel.trim() ? body.dueLabel.trim() : 'بدون موعد'

    const db = getDb()
    if (goalId && !(await ownedGoalExists(db, goalId, user.id))) return json({ error: 'الهدف المرتبط غير موجود.' }, { status: 400 })
    const [created] = await db.insert(project).values({
      id: crypto.randomUUID(),
      userId: user.id,
      goalId,
      title,
      description,
      status,
      progress: boundedProgress(body.progress),
      dueLabel,
    }).returning()
    return json({ item: created }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
