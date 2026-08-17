import { and, eq, isNotNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { client, entertainmentItem, financeEntry, goal, habit, journalEntry, note, project, reminder, task } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'
import { getWorkspaceForMember } from '@/server/workspaces/access'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ kind: string; id: string }> }

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const { kind, id } = await context.params
    const db = getDb()
    let item: unknown = null

    if (kind === 'task') {
      const [updated] = await db.update(task).set({ archivedAt: null, updatedAt: new Date() }).where(and(eq(task.id, id), eq(task.userId, currentUser.id), isNotNull(task.archivedAt))).returning()
      item = updated
    } else if (kind === 'note') {
      const [updated] = await db.update(note).set({ archivedAt: null, updatedAt: new Date() }).where(and(eq(note.id, id), eq(note.userId, currentUser.id), isNotNull(note.archivedAt))).returning()
      item = updated
    } else if (kind === 'habit') {
      const [updated] = await db.update(habit).set({ archivedAt: null, updatedAt: new Date() }).where(and(eq(habit.id, id), eq(habit.userId, currentUser.id), isNotNull(habit.archivedAt))).returning()
      item = updated
    } else if (kind === 'goal') {
      const [updated] = await db.update(goal).set({ archivedAt: null, updatedAt: new Date() }).where(and(eq(goal.id, id), eq(goal.userId, currentUser.id), isNotNull(goal.archivedAt))).returning()
      item = updated
    } else if (kind === 'project') {
      const [updated] = await db.update(project).set({ archivedAt: null, updatedAt: new Date() }).where(and(eq(project.id, id), eq(project.userId, currentUser.id), isNotNull(project.archivedAt))).returning()
      item = updated
    } else if (kind === 'finance') {
      const [updated] = await db.update(financeEntry).set({ archivedAt: null, updatedAt: new Date() }).where(and(eq(financeEntry.id, id), eq(financeEntry.userId, currentUser.id), isNotNull(financeEntry.archivedAt))).returning()
      item = updated
    } else if (kind === 'reminder') {
      const [updated] = await db.update(reminder).set({ archivedAt: null, updatedAt: new Date() }).where(and(eq(reminder.id, id), eq(reminder.userId, currentUser.id), isNotNull(reminder.archivedAt))).returning()
      item = updated
    } else if (kind === 'journal') {
      const [updated] = await db.update(journalEntry).set({ archivedAt: null, updatedAt: new Date() }).where(and(eq(journalEntry.id, id), eq(journalEntry.userId, currentUser.id), isNotNull(journalEntry.archivedAt))).returning()
      item = updated
    } else if (kind === 'entertainment') {
      const [updated] = await db.update(entertainmentItem).set({ archivedAt: null, updatedAt: new Date() }).where(and(eq(entertainmentItem.id, id), eq(entertainmentItem.userId, currentUser.id), isNotNull(entertainmentItem.archivedAt))).returning()
      item = updated
    } else if (kind === 'client') {
      const [archivedClient] = await db.select({ id: client.id, workspaceId: client.workspaceId })
        .from(client)
        .where(and(eq(client.id, id), eq(client.createdBy, currentUser.id), isNotNull(client.archivedAt)))
        .limit(1)
      if (archivedClient && !(await getWorkspaceForMember(db, archivedClient.workspaceId, currentUser.id))) {
        return json({ error: 'مساحة العمل غير متاحة.' }, { status: 403 })
      }
      const [updated] = await db.update(client).set({ archivedAt: null, status: 'active', updatedAt: new Date() })
        .where(and(eq(client.id, id), eq(client.createdBy, currentUser.id), isNotNull(client.archivedAt)))
        .returning()
      item = updated
    } else {
      return json({ error: 'نوع الأرشيف غير معروف.' }, { status: 400 })
    }

    if (!item) return json({ error: 'العنصر المؤرشف غير موجود.' }, { status: 404 })
    return json({ item })
  } catch {
    return backendUnavailable()
  }
}
