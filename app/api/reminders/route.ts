import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { reminder } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

const kinds = new Set(['task', 'habit', 'prayer', 'quran', 'finance'])
const statuses = new Set(['pending', 'done', 'snoozed'])

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const status = new URL(request.url).searchParams.get('status')
    const conditions = [eq(reminder.userId, user.id), isNull(reminder.archivedAt)]
    if (status && statuses.has(status)) conditions.push(eq(reminder.status, status))
    const db = getDb()
    const items = await db.select().from(reminder).where(and(...conditions)).orderBy(desc(reminder.updatedAt)).limit(300)
    return json({ items })
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
    const dueAt = typeof body.dueAt === 'string' ? body.dueAt.trim() : ''
    const kind = typeof body.kind === 'string' && kinds.has(body.kind) ? body.kind : 'task'
    if (!title) return json({ error: 'عنوان التذكير مطلوب.' }, { status: 400 })
    if (!dueAt) return json({ error: 'موعد التذكير مطلوب.' }, { status: 400 })
    const [created] = await getDb().insert(reminder).values({
      id: crypto.randomUUID(),
      userId: user.id,
      title,
      dueAt,
      kind,
      status: 'pending',
      sourceId: typeof body.sourceId === 'string' && body.sourceId.trim() ? body.sourceId.trim() : null,
      repeatLabel: typeof body.repeatLabel === 'string' && body.repeatLabel.trim() ? body.repeatLabel.trim() : null,
    }).returning()
    return json({ item: created }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
