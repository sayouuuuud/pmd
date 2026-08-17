import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { client } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'
import { getWorkspaceForMember } from '@/server/workspaces/access'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function textValue(value: unknown, fallback = '', maxLength = 240) {
  if (typeof value !== 'string') return fallback
  return value.trim().slice(0, maxLength)
}

async function ownedClient(db: ReturnType<typeof getDb>, clientId: string, userId: string) {
  const [row] = await db.select({ item: client }).from(client).where(and(eq(client.id, clientId), eq(client.createdBy, userId), isNull(client.archivedAt))).limit(1)
  if (!row) return null
  const workspace = await getWorkspaceForMember(db, row.item.workspaceId, userId)
  return workspace ? row.item : null
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const { id } = await context.params
    const db = getDb()
    const item = await ownedClient(db, id, currentUser.id)
    if (!item) return json({ error: 'العميل غير موجود.' }, { status: 404 })
    return json({ client: item })
  } catch {
    return backendUnavailable()
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const { id } = await context.params
    const body = await request.json() as Record<string, unknown>
    const db = getDb()
    const existing = await ownedClient(db, id, currentUser.id)
    if (!existing) return json({ error: 'العميل غير موجود.' }, { status: 404 })

    const patch: Record<string, unknown> = { updatedAt: new Date() }
    if (body.name !== undefined) {
      const name = textValue(body.name, '', 160)
      if (!name) return json({ error: 'اسم العميل مطلوب.' }, { status: 400 })
      patch.name = name
    }
    if (body.company !== undefined) patch.company = textValue(body.company, '', 160) || null
    if (body.email !== undefined) patch.email = textValue(body.email, '', 160) || null
    if (body.phone !== undefined) patch.phone = textValue(body.phone, '', 60) || null
    if (body.notes !== undefined) patch.notes = textValue(body.notes, '', 1200) || null
    if (body.status !== undefined) {
      const status = textValue(body.status, '', 32)
      if (!['active', 'on-hold'].includes(status)) return json({ error: 'حالة العميل غير صالحة.' }, { status: 400 })
      patch.status = status
    }

    const [updated] = await db.update(client).set(patch).where(and(eq(client.id, existing.id), eq(client.createdBy, currentUser.id), isNull(client.archivedAt))).returning()
    if (!updated) return json({ error: 'تعذر تحديث العميل.' }, { status: 409 })
    return json({ client: updated })
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
    const existing = await ownedClient(db, id, currentUser.id)
    if (!existing) return json({ error: 'العميل غير موجود.' }, { status: 404 })
    const [archived] = await db.update(client).set({ archivedAt: new Date(), status: 'archived', updatedAt: new Date() }).where(and(eq(client.id, existing.id), eq(client.createdBy, currentUser.id), isNull(client.archivedAt))).returning()
    if (!archived) return json({ error: 'تعذر أرشفة العميل.' }, { status: 409 })
    return json({ client: archived })
  } catch {
    return backendUnavailable()
  }
}
