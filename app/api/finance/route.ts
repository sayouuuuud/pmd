import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { budget, financeEntry, goal, project } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

const kinds = new Set(['expense', 'income'])

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const month = new URL(request.url).searchParams.get('month')
    const conditions = [eq(financeEntry.userId, user.id), isNull(financeEntry.archivedAt)]
    if (month && /^\d{4}-\d{2}$/.test(month)) conditions.push(eq(financeEntry.localDate, month))
    const db = getDb()
    const rows = await db.select().from(financeEntry).where(and(...conditions)).orderBy(desc(financeEntry.localDate), desc(financeEntry.updatedAt)).limit(300)
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
    const amount = typeof body.amount === 'number' ? Math.round(body.amount) : Number(body.amount)
    const kind = typeof body.kind === 'string' && kinds.has(body.kind) ? body.kind : 'expense'
    const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'عام'
    const localDate = typeof body.localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.localDate) ? body.localDate : ''
    if (!title) return json({ error: 'وصف العملية مطلوب.' }, { status: 400 })
    if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'المبلغ يجب أن يكون أكبر من صفر.' }, { status: 400 })
    if (!localDate) return json({ error: 'تاريخ العملية غير صالح.' }, { status: 400 })

    const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId : null
    const goalId = typeof body.goalId === 'string' && body.goalId.trim() ? body.goalId : null
    const db = getDb()
    if (projectId) {
      const [ownedProject] = await db.select({ id: project.id }).from(project).where(and(eq(project.id, projectId), eq(project.userId, user.id), isNull(project.archivedAt))).limit(1)
      if (!ownedProject) return json({ error: 'المشروع المرتبط غير موجود.' }, { status: 400 })
    }
    if (goalId) {
      const [ownedGoal] = await db.select({ id: goal.id }).from(goal).where(and(eq(goal.id, goalId), eq(goal.userId, user.id), isNull(goal.archivedAt))).limit(1)
      if (!ownedGoal) return json({ error: 'الهدف المرتبط غير موجود.' }, { status: 400 })
    }

    const [created] = await db.insert(financeEntry).values({
      id: crypto.randomUUID(),
      userId: user.id,
      title,
      amount,
      kind,
      category,
      localDate,
      note: typeof body.note === 'string' ? body.note.trim() || null : null,
      projectId,
      goalId,
    }).returning()
    return json({ item: created }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
