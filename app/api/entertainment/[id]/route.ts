import { and, eq } from 'drizzle-orm'
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()
  try {
    const { id } = await context.params
    const body = await request.json() as Record<string, unknown>
    const patch: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof body.title === 'string') patch.title = textValue(body.title, 'عمل جديد', 200)
    if (typeof body.type === 'string') patch.type = textValue(body.type, 'movie', 30)
    if (typeof body.genre === 'string') patch.genre = textValue(body.genre, 'عام', 80)
    if (body.year !== undefined) patch.year = integerValue(body.year)
    if (typeof body.note === 'string') patch.note = textValue(body.note, '', 4000) || null
    if (typeof body.status === 'string' && ['want', 'watching', 'done'].includes(body.status)) patch.status = body.status
    if (body.rating !== undefined) patch.rating = integerValue(body.rating)
    if (typeof body.impression === 'string') patch.impression = textValue(body.impression, '', 4000) || null
    if (body.recommend !== undefined) patch.recommend = booleanValue(body.recommend)
    if (body.downloadWanted !== undefined) patch.downloadWanted = booleanValue(body.downloadWanted)
    const db = getDb()
    const [item] = await db.update(entertainmentItem).set(patch)
      .where(and(eq(entertainmentItem.id, id), eq(entertainmentItem.userId, currentUser.id))).returning()
    if (!item) return json({ error: 'العنصر غير موجود' }, { status: 404 })
    return json({ item })
  } catch {
    return backendUnavailable()
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()
  try {
    const { id } = await context.params
    const db = getDb()
    const [item] = await db.update(entertainmentItem).set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(entertainmentItem.id, id), eq(entertainmentItem.userId, currentUser.id))).returning({ id: entertainmentItem.id })
    if (!item) return json({ error: 'العنصر غير موجود' }, { status: 404 })
    return json({ ok: true, id: item.id })
  } catch {
    return backendUnavailable()
  }
}
