import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { entertainmentItem } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function textValue(value: unknown, fallback = '', maxLength = 5000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : fallback
}

function integerValue(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && /^\d{1,4}$/u.test(value.trim())) return Number(value.trim())
  return null
}

function booleanValue(value: unknown) {
  return value === true || value === 'true'
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()
  try {
    const db = getDb()
    const items = await db.select().from(entertainmentItem)
      .where(and(eq(entertainmentItem.userId, currentUser.id), isNull(entertainmentItem.archivedAt)))
      .orderBy(desc(entertainmentItem.updatedAt))
      .limit(500)
    return json({ items })
  } catch {
    return backendUnavailable()
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()
  try {
    const body = await request.json() as Record<string, unknown>
    const db = getDb()
    const id = textValue(body.id, `entertainment-${crypto.randomUUID()}`, 120)
    const [item] = await db.insert(entertainmentItem).values({
      id,
      userId: currentUser.id,
      title: textValue(body.title, 'عمل جديد', 200),
      type: textValue(body.type, 'movie', 30),
      genre: textValue(body.genre, 'عام', 80),
      year: integerValue(body.year),
      note: textValue(body.note, '', 4000) || null,
      status: ['want', 'watching', 'done'].includes(textValue(body.status, 'want', 20)) ? textValue(body.status, 'want', 20) : 'want',
      rating: integerValue(body.rating),
      impression: textValue(body.impression, '', 4000) || null,
      recommend: booleanValue(body.recommend),
      downloadWanted: booleanValue(body.downloadWanted),
      archivedAt: null,
      updatedAt: new Date(),
    }).returning()
    return json({ item }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
