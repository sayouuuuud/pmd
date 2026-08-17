import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { client, financeEntry, project, projectPricing } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

const statuses = new Set(['expected', 'due', 'received', 'cancelled'])

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function parseDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const date = new Date(value.trim())
  return Number.isNaN(date.getTime()) ? undefined : date
}

async function ownedIncome(id: string, userId: string) {
  const db = getDb()
  const [item] = await db.select({ id: financeEntry.id }).from(financeEntry).where(and(eq(financeEntry.id, id), eq(financeEntry.userId, userId), eq(financeEntry.kind, 'income'), isNull(financeEntry.archivedAt))).limit(1)
  return item
}

export async function PATCH(request: Request, context: { params: Promise<{ pricingId: string }> }) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { pricingId } = await context.params
    const body = await request.json() as Record<string, unknown>
    const db = getDb()
    const [ownedPricing] = await db.select({ id: projectPricing.id, status: projectPricing.status, workspaceId: projectPricing.workspaceId }).from(projectPricing).innerJoin(project, eq(project.id, projectPricing.projectId)).where(and(eq(projectPricing.id, pricingId), eq(projectPricing.createdBy, user.id), eq(project.userId, user.id), isNull(project.archivedAt))).limit(1)
    if (!ownedPricing) return json({ error: 'الدفعة غير موجودة.' }, { status: 404 })

    const patch: Record<string, unknown> = { updatedAt: new Date() }
    if (body.clientId !== undefined) {
      if (body.clientId !== null && (typeof body.clientId !== 'string' || !body.clientId.trim())) return json({ error: 'معرّف العميل غير صالح.' }, { status: 400 })
      const requestedClientId = body.clientId === null ? null : (body.clientId as string).trim()
      if (requestedClientId) {
        const [ownedClient] = await db.select({ id: client.id }).from(client).where(and(eq(client.id, requestedClientId), eq(client.workspaceId, ownedPricing.workspaceId), isNull(client.archivedAt))).limit(1)
        if (!ownedClient) return json({ error: 'العميل غير موجود في مساحة المشروع.' }, { status: 400 })
      }
      patch.clientId = requestedClientId
    }
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || !body.title.trim()) return json({ error: 'اسم الدفعة مطلوب.' }, { status: 400 })
      patch.title = body.title.trim()
    }
    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0) return json({ error: 'المبلغ يجب أن يكون أكبر من صفر.' }, { status: 400 })
      patch.amount = Math.round(body.amount)
    }
    if (body.currency !== undefined) {
      if (typeof body.currency !== 'string' || !body.currency.trim()) return json({ error: 'العملة مطلوبة.' }, { status: 400 })
      patch.currency = body.currency.trim()
    }

    let nextStatus = ownedPricing.status
    if (body.status !== undefined) {
      if (typeof body.status !== 'string' || !statuses.has(body.status)) return json({ error: 'حالة الدفعة غير صالحة.' }, { status: 400 })
      nextStatus = body.status
      patch.status = body.status
    }

    if (body.expectedDate !== undefined) {
      if (body.expectedDate !== null && (typeof body.expectedDate !== 'string' || !body.expectedDate.trim())) return json({ error: 'تاريخ الاستحقاق غير صالح.' }, { status: 400 })
      patch.expectedDate = body.expectedDate === null ? null : (body.expectedDate as string).trim()
    }
    if (body.receivedAt !== undefined) {
      if (body.receivedAt !== null && !parseDate(body.receivedAt)) return json({ error: 'تاريخ التحصيل غير صالح.' }, { status: 400 })
      if (body.receivedAt !== null && nextStatus !== 'received') return json({ error: 'لا يمكن تسجيل تاريخ تحصيل لدفعة غير محصلة.' }, { status: 400 })
      patch.receivedAt = body.receivedAt === null ? null : parseDate(body.receivedAt)
    }
    if (body.notes !== undefined) {
      if (body.notes !== null && typeof body.notes !== 'string') return json({ error: 'الملاحظات غير صالحة.' }, { status: 400 })
      patch.notes = body.notes === null ? null : body.notes.trim()
    }

    let requestedFinanceEntryId: string | null | undefined
    if (body.financeEntryId !== undefined) {
      if (body.financeEntryId !== null && (typeof body.financeEntryId !== 'string' || !body.financeEntryId.trim())) return json({ error: 'معرّف الدخل غير صالح.' }, { status: 400 })
      requestedFinanceEntryId = body.financeEntryId === null ? null : body.financeEntryId.trim()
      if (requestedFinanceEntryId && nextStatus !== 'received') return json({ error: 'لا يمكن ربط دخل إلا بدفعة محصلة.' }, { status: 400 })
      if (requestedFinanceEntryId && !(await ownedIncome(requestedFinanceEntryId, user.id))) return json({ error: 'سجل الدخل المرتبط غير موجود.' }, { status: 400 })
      patch.financeEntryId = requestedFinanceEntryId
    }

    if (nextStatus === 'received') patch.receivedAt = patch.receivedAt ?? new Date()
    if (nextStatus !== 'received') {
      patch.receivedAt = null
      patch.financeEntryId = null
    }

    const [updated] = await db.update(projectPricing).set(patch).where(and(eq(projectPricing.id, pricingId), eq(projectPricing.createdBy, user.id))).returning()
    if (!updated) return json({ error: 'تعذر تحديث الدفعة.' }, { status: 404 })
    return json({ item: updated })
  } catch {
    return backendUnavailable()
  }
}
