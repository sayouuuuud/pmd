import { and, asc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { subtask, task } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function GET(request: Request, context: RouteContext) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id: taskId } = await context.params
    const db = getDb()
    const [ownedTask] = await db.select({ id: task.id }).from(task).where(and(eq(task.id, taskId), eq(task.userId, user.id), isNull(task.archivedAt))).limit(1)
    if (!ownedTask) return json({ error: 'المهمة غير موجودة.' }, { status: 404 })
    const items = await db.select().from(subtask).where(and(eq(subtask.taskId, taskId), eq(subtask.userId, user.id))).orderBy(asc(subtask.createdAt)).limit(100)
    return json({ items })
  } catch {
    return backendUnavailable()
  }
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id: taskId } = await context.params
    const body = await request.json() as Record<string, unknown>
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
    if (!title) return json({ error: 'عنوان الخطوة الفرعية مطلوب.' }, { status: 400 })
    const db = getDb()
    const [ownedTask] = await db.select({ id: task.id }).from(task).where(and(eq(task.id, taskId), eq(task.userId, user.id), isNull(task.archivedAt))).limit(1)
    if (!ownedTask) return json({ error: 'المهمة غير موجودة.' }, { status: 404 })
    const [item] = await db.insert(subtask).values({ id: typeof body.id === 'string' && body.id.trim() ? body.id.trim() : crypto.randomUUID(), userId: user.id, taskId, title, done: body.done === true }).returning()
    return json({ item }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
