import { eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { budget } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const db = getDb()
    const [existing] = await db.select().from(budget).where(eq(budget.userId, user.id)).limit(1)
    if (existing) return json({ budget: existing })
    const [created] = await db.insert(budget).values({ userId: user.id }).returning()
    return json({ budget: created })
  } catch {
    return backendUnavailable()
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const body = await request.json() as Record<string, unknown>
    const monthlyLimit = typeof body.monthlyLimit === 'number' ? Math.round(body.monthlyLimit) : Number(body.monthlyLimit)
    if (!Number.isFinite(monthlyLimit) || monthlyLimit < 0) return json({ error: 'الميزانية يجب أن تكون رقمًا غير سالب.' }, { status: 400 })
    const [updated] = await getDb().insert(budget).values({ userId: user.id, monthlyLimit }).onConflictDoUpdate({ target: budget.userId, set: { monthlyLimit, updatedAt: new Date() } }).returning()
    return json({ budget: updated })
  } catch {
    return backendUnavailable()
  }
}
