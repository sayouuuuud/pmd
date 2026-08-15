import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { project, task } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

const priorities = new Set(['high', 'medium', 'low'])
const statuses = new Set(['todo', 'in-progress', 'done'])

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const db = getDb()
    const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true'
    const rows = await db.select().from(task).where(
      includeArchived
        ? eq(task.userId, user.id)
        : and(eq(task.userId, user.id), isNull(task.archivedAt)),
    ).orderBy(desc(task.updatedAt)).limit(200)
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
    const priority = typeof body.priority === 'string' && priorities.has(body.priority) ? body.priority : 'medium'
    const status = typeof body.status === 'string' && statuses.has(body.status) ? body.status : 'todo'
    const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'عام'
    if (!title) return json({ error: 'عنوان المهمة مطلوب.' }, { status: 400 })

    const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId : null
    const db = getDb()
    if (projectId) {
      const [ownedProject] = await db.select({ id: project.id }).from(project).where(and(eq(project.id, projectId), eq(project.userId, user.id), isNull(project.archivedAt))).limit(1)
      if (!ownedProject) return json({ error: 'المشروع المرتبط غير موجود.' }, { status: 400 })
    }
    const [created] = await db.insert(task).values({
      id: crypto.randomUUID(),
      userId: user.id,
      title,
      description: typeof body.description === 'string' ? body.description.trim() : null,
      priority,
      status,
      dueDate: typeof body.dueDate === 'string' ? body.dueDate : null,
      dueLabel: typeof body.dueLabel === 'string' ? body.dueLabel : null,
      category,
      recurring: body.recurring === true,
      sourceNoteId: typeof body.sourceNoteId === 'string' ? body.sourceNoteId : null,
      projectId,
    }).returning()
    return json({ item: created }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
