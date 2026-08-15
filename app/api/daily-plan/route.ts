import { and, asc, eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { dailyPlanItem } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
}

const kinds = new Set(['task', 'habit', 'prayer', 'quran', 'rest'])
const statuses = new Set(['pending', 'done', 'snoozed'])

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const localDate = new URL(request.url).searchParams.get('date') || today()
    const db = getDb()
    const items = await db.select().from(dailyPlanItem)
      .where(and(eq(dailyPlanItem.userId, user.id), eq(dailyPlanItem.localDate, localDate)))
      .orderBy(asc(dailyPlanItem.position), asc(dailyPlanItem.startAt))
      .limit(200)
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
    if (!title) return json({ error: 'عنوان عنصر خطة اليوم مطلوب.' }, { status: 400 })
    const kind = typeof body.kind === 'string' && kinds.has(body.kind) ? body.kind : 'task'
    const status = typeof body.status === 'string' && statuses.has(body.status) ? body.status : 'pending'
    const db = getDb()
    const [created] = await db.insert(dailyPlanItem).values({
      id: crypto.randomUUID(),
      userId: user.id,
      localDate: typeof body.localDate === 'string' && body.localDate.trim() ? body.localDate : today(),
      kind,
      sourceId: typeof body.sourceId === 'string' ? body.sourceId : null,
      title,
      startAt: typeof body.startAt === 'string' ? body.startAt : null,
      endAt: typeof body.endAt === 'string' ? body.endAt : null,
      status,
      position: typeof body.position === 'number' ? body.position : 0,
      isManualOverride: body.isManualOverride === true,
    }).returning()
    return json({ item: created }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
