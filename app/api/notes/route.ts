import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { note } from '@/server/db/schema'
import { getCurrentUser, unauthorized, backendUnavailable } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true'
    const db = getDb()
    const rows = await db.select().from(note).where(
      includeArchived
        ? eq(note.userId, user.id)
        : and(eq(note.userId, user.id), isNull(note.archivedAt)),
    ).orderBy(desc(note.updatedAt)).limit(200)
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
    const bodyText = typeof body.body === 'string' ? body.body.trim() : ''
    const tag = typeof body.tag === 'string' && body.tag.trim() ? body.tag.trim() : 'عام'
    if (!title && !bodyText) return json({ error: 'أدخل عنوان الملاحظة أو محتواها.' }, { status: 400 })

    const db = getDb()
    const [created] = await db.insert(note).values({
      id: crypto.randomUUID(),
      userId: user.id,
      title: title || 'ملاحظة سريعة',
      body: bodyText,
      tag,
      pinned: body.pinned === true,
      sourceTaskId: typeof body.sourceTaskId === 'string' ? body.sourceTaskId : null,
    }).returning()
    return json({ item: created }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
