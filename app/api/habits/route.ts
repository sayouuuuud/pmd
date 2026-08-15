import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { habit, habitLog } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
}

function previousDate(date: string) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() - 1)
  return value.toISOString().slice(0, 10)
}

function calculateStreak(habitId: string, dates: Set<string>, date: string) {
  let cursor = date
  let streak = 0
  while (dates.has(cursor)) {
    streak += 1
    cursor = previousDate(cursor)
  }
  return streak
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const db = getDb()
    const localDate = new URL(request.url).searchParams.get('date') || today()
    const habits = await db.select().from(habit).where(and(eq(habit.userId, user.id), isNull(habit.archivedAt))).orderBy(desc(habit.updatedAt)).limit(100)
    const logs = await db.select({ habitId: habitLog.habitId, localDate: habitLog.localDate, status: habitLog.status })
      .from(habitLog)
      .where(eq(habitLog.userId, user.id))
      .limit(2000)

    const datesByHabit = new Map<string, Set<string>>()
    for (const log of logs) {
      if (log.status !== 'done') continue
      const dates = datesByHabit.get(log.habitId) ?? new Set<string>()
      dates.add(log.localDate)
      datesByHabit.set(log.habitId, dates)
    }

    return json({ items: habits.map((item) => {
      const dates = datesByHabit.get(item.id) ?? new Set<string>()
      return {
        ...item,
        streak: calculateStreak(item.id, dates, localDate),
        doneToday: dates.has(localDate),
      }
    }) })
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
    if (!title) return json({ error: 'اسم العادة مطلوب.' }, { status: 400 })

    const db = getDb()
    const [created] = await db.insert(habit).values({
      id: crypto.randomUUID(),
      userId: user.id,
      title,
      icon: typeof body.icon === 'string' && body.icon.trim() ? body.icon.trim() : 'عادة',
      target: typeof body.target === 'string' && body.target.trim() ? body.target.trim() : 'يوميًا',
      frequency: typeof body.frequency === 'string' && body.frequency.trim() ? body.frequency.trim() : 'daily',
    }).returning()
    return json({ item: { ...created, streak: 0, doneToday: false } }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
