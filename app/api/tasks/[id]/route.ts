import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { project, task } from '@/server/db/schema'
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
    if (body.priority === 'high' || body.priority === 'medium' || body.priority === 'low') patch.priority = body.priority
    if (body.status === 'todo' || body.status === 'in-progress' || body.status === 'done') patch.status = body.status
    if (typeof body.dueLabel === 'string') patch.dueLabel = body.dueLabel
    if (typeof body.category === 'string' && body.category.trim()) patch.category = body.category.trim()
    if (typeof body.description === 'string') patch.description = body.description.trim()
    if (typeof body.recurring === 'boolean') patch.recurring = body.recurring
    if (body.projectId === null) patch.projectId = null
    if (typeof body.projectId === 'string' && body.projectId.trim()) {
      const projectId = body.projectId.trim()
      const db = getDb()
      const [ownedProject] = await db.select({ id: project.id }).from(project).where(and(eq(project.id, projectId), eq(project.userId, user.id), isNull(project.archivedAt))).limit(1)
      if (!ownedProject) return json({ error: 'المشروع المرتبط غير موجود.' }, { status: 400 })
      patch.projectId = projectId
    }

    const db = getDb()
    const [updated] = await db.update(task).set(patch).where(and(eq(task.id, id), eq(task.userId, user.id), isNull(task.archivedAt))).returning()
    if (!updated) return json({ error: 'المهمة غير موجودة.' }, { status: 404 })
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
    const [updated] = await db.update(task).set({ archivedAt: new Date(), updatedAt: new Date() }).where(and(eq(task.id, id), eq(task.userId, user.id), isNull(task.archivedAt))).returning()
    if (!updated) return json({ error: 'المهمة غير موجودة.' }, { status: 404 })
    return json({ item: updated })
  } catch {
    return backendUnavailable()
  }
}
