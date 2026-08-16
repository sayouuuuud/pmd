import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { habit, habitLog } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const body = await request.json() as Record<string, unknown>
    const localDate = typeof body.localDate === 'string' && body.localDate.trim() ? body.localDate : today()
    const status = body.status === 'skipped' ? 'skipped' : 'done'
    const db = getDb()
    const [ownedHabit] = await db.select({ id: habit.id }).from(habit).where(and(eq(habit.id, id), eq(habit.userId, user.id)))
    if (!ownedHabit) return json({ error: 'العادة غير موجودة.' }, { status: 404 })

    const [item] = await db.insert(habitLog).values({
      id: crypto.randomUUID(),
      userId: user.id,
      habitId: id,
      localDate,
      status,
    }).onConflictDoUpdate({
      target: [habitLog.userId, habitLog.habitId, habitLog.localDate],
      set: { status, updatedAt: new Date() },
    }).returning()
    return json({ item })
  } catch {
    return backendUnavailable()
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const searchParams = new URL(request.url).searchParams
    const db = getDb()

    if (searchParams.get('action') === 'archive') {
      const [item] = await db.update(habit)
        .set({ archivedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(habit.id, id), eq(habit.userId, user.id), isNull(habit.archivedAt)))
        .returning()
      if (!item) return json({ error: 'العادة غير موجودة أو مؤرشفة بالفعل.' }, { status: 404 })
      return json({ item })
    }

    const localDate = searchParams.get('date') || today()
    await db.delete(habitLog).where(and(eq(habitLog.habitId, id), eq(habitLog.userId, user.id), eq(habitLog.localDate, localDate)))
    return json({ ok: true })
  } catch {
    return backendUnavailable()
  }
}
