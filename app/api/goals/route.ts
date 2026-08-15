import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { goal } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

const horizons = new Set(['quarter', 'year', 'someday'])
const statuses = new Set(['active', 'paused', 'completed'])

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function boundedProgress(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true'
    const db = getDb()
    const rows = await db.select().from(goal).where(
      includeArchived ? eq(goal.userId, user.id) : and(eq(goal.userId, user.id), isNull(goal.archivedAt)),
    ).orderBy(desc(goal.updatedAt)).limit(100)
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
    if (!title) return json({ error: 'عنوان الهدف مطلوب.' }, { status: 400 })
    const horizon = typeof body.horizon === 'string' && horizons.has(body.horizon) ? body.horizon : 'quarter'
    const status = typeof body.status === 'string' && statuses.has(body.status) ? body.status : 'active'
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const targetLabel = typeof body.targetLabel === 'string' ? body.targetLabel.trim() : ''

    const db = getDb()
    const [created] = await db.insert(goal).values({
      id: crypto.randomUUID(),
      userId: user.id,
      title,
      description,
      horizon,
      status,
      progress: boundedProgress(body.progress),
      targetLabel,
    }).returning()
    return json({ item: created }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
