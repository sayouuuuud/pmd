import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { journalEntry } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function textValue(value: unknown, fallback = '', maxLength = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : fallback
}

function dateValue(value: unknown) {
  const valueText = textValue(value, new Date().toISOString().slice(0, 10), 20)
  return /^\d{4}-\d{2}-\d{2}$/u.test(valueText) ? valueText : new Date().toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()
  try {
    const url = new URL(request.url)
    const requestedDate = url.searchParams.get('date')
    const db = getDb()
    const entries = await db.select().from(journalEntry)
      .where(requestedDate ? and(eq(journalEntry.userId, currentUser.id), eq(journalEntry.localDate, dateValue(requestedDate))) : eq(journalEntry.userId, currentUser.id))
      .orderBy(desc(journalEntry.localDate), desc(journalEntry.updatedAt))
      .limit(200)
    return json({ entries })
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
    const localDate = dateValue(body.localDate)
    const [entry] = await db.insert(journalEntry).values({
      id: textValue(body.id, `journal-${currentUser.id}-${localDate}`, 120),
      userId: currentUser.id,
      localDate,
      title: textValue(body.title, 'يومياتي', 160),
      body: textValue(body.body, '', 12000),
      mood: textValue(body.mood, 'محايد', 40),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [journalEntry.userId, journalEntry.localDate],
      set: { title: textValue(body.title, 'يومياتي', 160), body: textValue(body.body, '', 12000), mood: textValue(body.mood, 'محايد', 40), updatedAt: new Date() },
    }).returning()
    return json({ entry }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
