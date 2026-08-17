import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { project, projectPricing } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

const statuses = new Set(['expected', 'due', 'received', 'cancelled'])

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function PATCH(request: Request, context: { params: Promise<{ pricingId: string }> }) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { pricingId } = await context.params
    const body = await request.json() as Record<string, unknown>
    const patch: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim()
    if (typeof body.amount === 'number' && Number.isFinite(body.amount)) patch.amount = Math.max(0, Math.round(body.amount))
    if (typeof body.currency === 'string' && body.currency.trim()) patch.currency = body.currency.trim()
    if (typeof body.status === 'string' && statuses.has(body.status)) {
      patch.status = body.status
      if (body.status === 'received') patch.receivedAt = new Date()
    }
    if (body.expectedDate === null || (typeof body.expectedDate === 'string' && body.expectedDate.trim())) patch.expectedDate = body.expectedDate === null ? null : body.expectedDate.trim()
    if (body.receivedAt === null || (typeof body.receivedAt === 'string' && body.receivedAt.trim())) patch.receivedAt = body.receivedAt === null ? null : new Date(body.receivedAt.trim())
    if (body.notes === null || typeof body.notes === 'string') patch.notes = body.notes === null ? null : body.notes.trim()

    const db = getDb()
    const [ownedPricing] = await db.select({ id: projectPricing.id }).from(projectPricing).innerJoin(project, eq(project.id, projectPricing.projectId)).where(and(eq(projectPricing.id, pricingId), eq(projectPricing.createdBy, user.id), eq(project.userId, user.id), isNull(project.archivedAt))).limit(1)
    if (!ownedPricing) return json({ error: 'الدفعة غير موجودة.' }, { status: 404 })
    const [updated] = await db.update(projectPricing).set(patch).where(and(eq(projectPricing.id, pricingId), eq(projectPricing.createdBy, user.id))).returning()
    if (!updated) return json({ error: 'تعذر تحديث الدفعة.' }, { status: 404 })
    return json({ item: updated })
  } catch {
    return backendUnavailable()
  }
}
