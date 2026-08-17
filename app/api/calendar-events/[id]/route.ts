import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { calendarEvent } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'
import { getWorkspaceForMember } from '@/server/workspaces/access'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

const kinds = new Set(['general', 'task', 'reminder', 'pricing', 'plan', 'habit', 'prayer', 'quran'])
const statuses = new Set(['planned', 'done', 'cancelled'])

function textValue(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function dateValue(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

async function findOwnedEvent(id: string, userId: string) {
  const db = getDb()
  const [event] = await db.select().from(calendarEvent)
    .where(and(eq(calendarEvent.id, id), eq(calendarEvent.createdBy, userId), isNull(calendarEvent.archivedAt))).limit(1)
  if (!event) return null
  const memberWorkspace = await getWorkspaceForMember(db, event.workspaceId, userId)
  return memberWorkspace ? event : null
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const current = await findOwnedEvent(id, user.id)
    if (!current) return json({ error: 'الحدث غير موجود.' }, { status: 404 })
    const body = await request.json() as Record<string, unknown>
    const patch: Record<string, unknown> = {}
    if (body.title !== undefined) {
      const title = textValue(body.title, 160)
      if (!title) return json({ error: 'عنوان الحدث مطلوب.' }, { status: 400 })
      patch.title = title
    }
    if (body.description !== undefined) patch.description = textValue(body.description, 1000) || null
    if (body.kind !== undefined) {
      const kind = textValue(body.kind, 40)
      if (!kinds.has(kind)) return json({ error: 'نوع الحدث غير صالح.' }, { status: 400 })
      patch.kind = kind
    }
    if (body.status !== undefined) {
      const status = textValue(body.status, 40)
      if (!statuses.has(status)) return json({ error: 'حالة الحدث غير صالحة.' }, { status: 400 })
      patch.status = status
    }
    if (body.startsAt !== undefined) {
      const startsAt = dateValue(body.startsAt)
      if (!startsAt) return json({ error: 'بداية الحدث غير صالحة.' }, { status: 400 })
      patch.startsAt = startsAt
    }
    if (body.endsAt !== undefined) {
      const endsAt = body.endsAt === null || body.endsAt === '' ? null : dateValue(body.endsAt)
      if (body.endsAt !== null && body.endsAt !== '' && !endsAt) return json({ error: 'نهاية الحدث غير صالحة.' }, { status: 400 })
      patch.endsAt = endsAt
    }
    if (patch.startsAt instanceof Date || patch.endsAt instanceof Date || patch.endsAt === null) {
      const nextStart = patch.startsAt instanceof Date ? patch.startsAt : current.startsAt
      const nextEnd = patch.endsAt === null ? null : patch.endsAt instanceof Date ? patch.endsAt : current.endsAt
      if (nextEnd && nextEnd.getTime() < nextStart.getTime()) return json({ error: 'نهاية الحدث يجب أن تكون بعد بدايته.' }, { status: 400 })
    }
    if (body.timezone !== undefined) patch.timezone = textValue(body.timezone, 80) || 'Africa/Cairo'
    if (Object.keys(patch).length === 0) return json({ item: current })
    const [updated] = await getDb().update(calendarEvent).set({ ...patch, updatedAt: new Date() }).where(eq(calendarEvent.id, id)).returning()
    return updated ? json({ item: updated }) : json({ error: 'تعذر تحديث الحدث.' }, { status: 500 })
  } catch {
    return backendUnavailable()
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const current = await findOwnedEvent(id, user.id)
    if (!current) return json({ error: 'الحدث غير موجود.' }, { status: 404 })
    const [archived] = await getDb().update(calendarEvent).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(calendarEvent.id, id)).returning()
    return archived ? json({ item: archived }) : json({ error: 'تعذر أرشفة الحدث.' }, { status: 500 })
  } catch {
    return backendUnavailable()
  }
}
