import { and, asc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { calendarEvent } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'
import { getOrCreatePersonalWorkspace, getWorkspaceForMember } from '@/server/workspaces/access'

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

async function resolveWorkspaceId(bodyOrUrl: URL | Record<string, unknown>, userId: string) {
  const requested = bodyOrUrl instanceof URL ? bodyOrUrl.searchParams.get('workspaceId') : textValue(bodyOrUrl.workspaceId, 80)
  const db = getDb()
  if (requested) {
    const memberWorkspace = await getWorkspaceForMember(db, requested, userId)
    if (!memberWorkspace) return null
    return memberWorkspace.id
  }
  const personal = await getOrCreatePersonalWorkspace(db, userId)
  return personal.id
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const workspaceId = await resolveWorkspaceId(new URL(request.url), user.id)
    if (!workspaceId) return json({ error: 'مساحة العمل غير متاحة.' }, { status: 403 })
    const db = getDb()
    const items = await db.select().from(calendarEvent)
      .where(and(eq(calendarEvent.workspaceId, workspaceId), eq(calendarEvent.createdBy, user.id), isNull(calendarEvent.archivedAt)))
      .orderBy(asc(calendarEvent.startsAt)).limit(500)
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
    const title = textValue(body.title, 160)
    const description = textValue(body.description, 1000)
    const kind = textValue(body.kind, 40) || 'general'
    const status = textValue(body.status, 40) || 'planned'
    const startsAt = dateValue(body.startsAt)
    const endsAt = body.endsAt === undefined || body.endsAt === null || body.endsAt === '' ? null : dateValue(body.endsAt)
    if (!title) return json({ error: 'عنوان الحدث مطلوب.' }, { status: 400 })
    if (!startsAt) return json({ error: 'بداية الحدث غير صالحة.' }, { status: 400 })
    if (body.endsAt !== undefined && body.endsAt !== null && body.endsAt !== '' && !endsAt) return json({ error: 'نهاية الحدث غير صالحة.' }, { status: 400 })
    if (endsAt && endsAt.getTime() < startsAt.getTime()) return json({ error: 'نهاية الحدث يجب أن تكون بعد بدايته.' }, { status: 400 })
    if (!kinds.has(kind)) return json({ error: 'نوع الحدث غير صالح.' }, { status: 400 })
    if (!statuses.has(status)) return json({ error: 'حالة الحدث غير صالحة.' }, { status: 400 })
    const workspaceId = await resolveWorkspaceId(body, user.id)
    if (!workspaceId) return json({ error: 'مساحة العمل غير متاحة.' }, { status: 403 })
    const [created] = await getDb().insert(calendarEvent).values({
      id: typeof body.id === 'string' && body.id.trim() ? body.id.trim() : crypto.randomUUID(),
      workspaceId,
      createdBy: user.id,
      title,
      description: description || null,
      kind,
      startsAt,
      endsAt,
      timezone: textValue(body.timezone, 80) || 'Africa/Cairo',
      sourceType: textValue(body.sourceType, 40) || null,
      sourceId: textValue(body.sourceId, 120) || null,
      status,
    }).returning()
    return created ? json({ item: created }, { status: 201 }) : json({ error: 'تعذر إنشاء الحدث.' }, { status: 500 })
  } catch {
    return backendUnavailable()
  }
}
