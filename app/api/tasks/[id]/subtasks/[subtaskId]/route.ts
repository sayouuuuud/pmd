import { and, eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { subtask } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string; subtaskId: string }> }

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id: taskId, subtaskId } = await context.params
    const body = await request.json() as Record<string, unknown>
    const patch: { title?: string; done?: boolean; updatedAt: Date } = { updatedAt: new Date() }
    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim().slice(0, 200)
    if (typeof body.done === 'boolean') patch.done = body.done
    const db = getDb()
    const [item] = await db.update(subtask).set(patch).where(and(eq(subtask.id, subtaskId), eq(subtask.taskId, taskId), eq(subtask.userId, user.id))).returning()
    if (!item) return json({ error: 'الخطوة الفرعية غير موجودة.' }, { status: 404 })
    return json({ item })
  } catch {
    return backendUnavailable()
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id: taskId, subtaskId } = await context.params
    const db = getDb()
    const [item] = await db.delete(subtask).where(and(eq(subtask.id, subtaskId), eq(subtask.taskId, taskId), eq(subtask.userId, user.id))).returning()
    if (!item) return json({ error: 'الخطوة الفرعية غير موجودة.' }, { status: 404 })
    return json({ item })
  } catch {
    return backendUnavailable()
  }
}
