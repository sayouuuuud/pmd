import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { financeEntry, goal, project } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

const kinds = new Set(['expense', 'income'])
const recurrences = new Set(['none', 'weekly', 'monthly'])

async function ownedEntry(id: string, userId: string) {
  const db = getDb()
  const [row] = await db.select().from(financeEntry).where(and(eq(financeEntry.id, id), eq(financeEntry.userId, userId), isNull(financeEntry.archivedAt))).limit(1)
  return row
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const current = await ownedEntry(id, user.id)
    if (!current) return json({ error: 'العملية غير موجودة.' }, { status: 404 })
    const body = await request.json() as Record<string, unknown>
    const patch: Record<string, unknown> = { updatedAt: new Date() }

    if (body.title !== undefined) {
      const title = typeof body.title === 'string' ? body.title.trim() : ''
      if (!title) return json({ error: 'وصف العملية لا يمكن أن يكون فارغًا.' }, { status: 400 })
      patch.title = title
    }
    if (body.amount !== undefined) {
      const amount = typeof body.amount === 'number' ? Math.round(body.amount) : Number(body.amount)
      if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'المبلغ يجب أن يكون أكبر من صفر.' }, { status: 400 })
      patch.amount = amount
    }
    if (body.kind !== undefined) {
      if (typeof body.kind !== 'string' || !kinds.has(body.kind)) return json({ error: 'نوع العملية غير صالح.' }, { status: 400 })
      patch.kind = body.kind
    }
    if (body.category !== undefined) patch.category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'عام'
    if (body.recurrence !== undefined) {
      if (typeof body.recurrence !== 'string' || !recurrences.has(body.recurrence)) return json({ error: 'تكرار العملية غير صالح.' }, { status: 400 })
      patch.recurrence = body.recurrence
    }
    if (body.localDate !== undefined) {
      if (typeof body.localDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.localDate)) return json({ error: 'تاريخ العملية غير صالح.' }, { status: 400 })
      patch.localDate = body.localDate
    }
    if (body.note !== undefined) patch.note = typeof body.note === 'string' ? body.note.trim() || null : null

    const db = getDb()
    for (const [key, table, label] of [[ 'projectId', project, 'المشروع المرتبط' ], [ 'goalId', goal, 'الهدف المرتبط' ]] as const) {
      if (body[key] === undefined) continue
      const value = typeof body[key] === 'string' && body[key].trim() ? body[key] : null
      if (value) {
        const [owned] = await db.select({ id: table.id }).from(table).where(and(eq(table.id, value), eq(table.userId, user.id), isNull(table.archivedAt))).limit(1)
        if (!owned) return json({ error: `${label} غير موجود.` }, { status: 400 })
      }
      patch[key] = value
    }

    const [updated] = await db.update(financeEntry).set(patch).where(and(eq(financeEntry.id, id), eq(financeEntry.userId, user.id))).returning()
    return json({ item: updated })
  } catch {
    return backendUnavailable()
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const [archived] = await getDb().update(financeEntry).set({ archivedAt: new Date(), updatedAt: new Date() }).where(and(eq(financeEntry.id, id), eq(financeEntry.userId, user.id), isNull(financeEntry.archivedAt))).returning()
    if (!archived) return json({ error: 'العملية غير موجودة.' }, { status: 404 })
    return json({ item: archived })
  } catch {
    return backendUnavailable()
  }
}
