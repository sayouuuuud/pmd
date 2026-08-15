import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { weeklyReview } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function textValue(value: unknown, fallback: string, maxLength = 2400) {
  if (typeof value !== 'string') return fallback
  return value.trim().slice(0, maxLength)
}

function currentWeek() {
  const now = new Date()
  const day = now.getUTCDay()
  const offset = day === 0 ? -6 : 1 - day
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset))
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  return { weekStart: start.toISOString().slice(0, 10), weekEnd: end.toISOString().slice(0, 10) }
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const db = getDb()
    const week = currentWeek()
    const [review] = await db.select().from(weeklyReview)
      .where(and(eq(weeklyReview.userId, currentUser.id), eq(weeklyReview.weekStart, week.weekStart)))
      .orderBy(desc(weeklyReview.updatedAt))
      .limit(1)
    return json({ review: review ?? { id: `review-${currentUser.id}-${week.weekStart}`, userId: currentUser.id, ...week, wentWell: '', blockers: '', nextGoal: '', status: 'draft', updatedAt: new Date() } })
  } catch {
    return backendUnavailable()
  }
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const body = await request.json() as Record<string, unknown>
    const db = getDb()
    const fallbackWeek = currentWeek()
    const weekStart = textValue(body.weekStart, fallbackWeek.weekStart, 20)
    const weekEnd = textValue(body.weekEnd, fallbackWeek.weekEnd, 20)
    const wentWell = textValue(body.wentWell, '', 2400)
    const blockers = textValue(body.blockers, '', 2400)
    const nextGoal = textValue(body.nextGoal, '', 2400)
    const status = body.status === 'completed' ? 'completed' : 'draft'
    const [review] = await db.insert(weeklyReview).values({
      id: typeof body.id === 'string' && body.id.trim() ? body.id.trim().slice(0, 120) : `review-${currentUser.id}-${weekStart}`,
      userId: currentUser.id,
      weekStart,
      weekEnd,
      wentWell,
      blockers,
      nextGoal,
      status,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [weeklyReview.userId, weeklyReview.weekStart],
      set: { weekEnd, wentWell, blockers, nextGoal, status, updatedAt: new Date() },
    }).returning()
    return json({ review })
  } catch {
    return backendUnavailable()
  }
}
