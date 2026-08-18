import { and, desc, eq, inArray } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { activitySession } from '@/server/db/schema'
import { getOrCreatePersonalWorkspace } from '@/server/workspaces/access'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

const sources = new Set(['windows-agent', 'manual'])
const maxBatchSize = 100

function asIso(value: unknown) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return null
  return new Date(value).toISOString()
}

function cleanSession(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  const appName = typeof body.appName === 'string' ? body.appName.trim().slice(0, 160) : ''
  const startedAt = asIso(body.startedAt)
  if (!appName || !startedAt) return null
  const endedAt = body.endedAt === undefined || body.endedAt === null ? null : asIso(body.endedAt)
  if (body.endedAt !== undefined && body.endedAt !== null && !endedAt) return null
  const idleSeconds = Number(body.idleSeconds)
  return {
    id: typeof body.id === 'string' && body.id.trim() ? body.id.trim().slice(0, 100) : crypto.randomUUID(),
    source: typeof body.source === 'string' && sources.has(body.source) ? body.source : 'windows-agent',
    appName,
    windowTitle: typeof body.windowTitle === 'string' ? body.windowTitle.trim().slice(0, 240) || null : null,
    browserDomain: typeof body.browserDomain === 'string' ? body.browserDomain.trim().slice(0, 180) || null : null,
    startedAt: new Date(startedAt),
    endedAt: endedAt ? new Date(endedAt) : null,
    idleSeconds: Number.isFinite(idleSeconds) ? Math.max(0, Math.min(86400, Math.round(idleSeconds))) : 0,
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()
  try {
    const limitValue = Number(new URL(request.url).searchParams.get('limit'))
    const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(300, Math.round(limitValue))) : 100
    const db = getDb()
    const rows = await db.select().from(activitySession).where(eq(activitySession.userId, user.id)).orderBy(desc(activitySession.startedAt)).limit(limit)
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
    const rawItems = Array.isArray(body.sessions) ? body.sessions : [body]
    const items = rawItems.slice(0, maxBatchSize).map(cleanSession).filter((item): item is NonNullable<ReturnType<typeof cleanSession>> => Boolean(item))
    if (!items.length) return json({ error: 'لا توجد جلسات نشاط صالحة للمزامنة.' }, { status: 400 })
    const db = getDb()
    const personalWorkspace = await getOrCreatePersonalWorkspace(db, user.id)
    const values = items.map((item) => ({
      ...item,
      workspaceId: personalWorkspace.id,
      userId: user.id,
      metadata: { category: typeof body.category === 'string' ? body.category : 'application' },
    }))
    const created = await db.insert(activitySession).values(values).onConflictDoNothing({ target: activitySession.id }).returning()
    return json({ items: created, accepted: items.length }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0).slice(0, 300) : []
    const db = getDb()
    if (ids.length) {
      await db.delete(activitySession).where(and(eq(activitySession.userId, user.id), inArray(activitySession.id, ids)))
    } else {
      await db.delete(activitySession).where(eq(activitySession.userId, user.id))
    }
    return json({ ok: true })
  } catch {
    return backendUnavailable()
  }
}
