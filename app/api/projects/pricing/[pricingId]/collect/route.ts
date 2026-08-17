import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { financeEntry, project, projectPricing } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ pricingId: string }> }

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { pricingId } = await context.params
    const db = getDb()
    const result = await db.transaction(async (tx) => {
      const [pricing] = await tx.select({
        id: projectPricing.id,
        projectId: projectPricing.projectId,
        title: projectPricing.title,
        amount: projectPricing.amount,
        status: projectPricing.status,
        receivedAt: projectPricing.receivedAt,
        financeEntryId: projectPricing.financeEntryId,
        projectArchivedAt: project.archivedAt,
      }).from(projectPricing).innerJoin(project, eq(project.id, projectPricing.projectId)).where(and(
        eq(projectPricing.id, pricingId),
        eq(projectPricing.createdBy, user.id),
        eq(project.userId, user.id),
        isNull(project.archivedAt),
      )).limit(1)

      if (!pricing || pricing.projectArchivedAt) return { error: 'الدفعة غير موجودة.', status: 404 as const }
      if (pricing.status === 'cancelled') return { error: 'لا يمكن تحصيل دفعة ملغاة.', status: 409 as const }

      const receivedAt = pricing.receivedAt ?? new Date()
      let financeId = pricing.financeEntryId
      let finance

      if (financeId) {
        [finance] = await tx.select().from(financeEntry).where(and(
          eq(financeEntry.id, financeId),
          eq(financeEntry.userId, user.id),
          eq(financeEntry.kind, 'income'),
        )).limit(1)
        if (!finance) return { error: 'سجل الدخل المرتبط غير موجود أو لا تملك الوصول إليه.', status: 409 as const }
      } else {
        financeId = `pricing-income-${pricing.id}`
        const localDate = receivedAt.toISOString().slice(0, 10)
        const values = {
          id: financeId,
          userId: user.id,
          title: pricing.title,
          amount: pricing.amount,
          kind: 'income' as const,
          category: 'دخل',
          localDate,
          note: `تحصيل دفعة مشروع: ${pricing.title}`,
          projectId: pricing.projectId,
          goalId: null,
          recurrence: 'none',
          archivedAt: null,
          updatedAt: new Date(),
        }
        const [existing] = await tx.select({ id: financeEntry.id, userId: financeEntry.userId }).from(financeEntry).where(eq(financeEntry.id, financeId)).limit(1)
        if (existing && existing.userId !== user.id) return { error: 'تعذر إنشاء سجل دخل آمن لهذه الدفعة.', status: 409 as const }
        if (existing) {
          [finance] = await tx.update(financeEntry).set(values).where(and(eq(financeEntry.id, financeId), eq(financeEntry.userId, user.id))).returning()
        } else {
          [finance] = await tx.insert(financeEntry).values(values).returning()
        }
      }

      const [updated] = await tx.update(projectPricing).set({
        status: 'received',
        receivedAt,
        financeEntryId: financeId,
        updatedAt: new Date(),
      }).where(and(eq(projectPricing.id, pricing.id), eq(projectPricing.createdBy, user.id))).returning()

      if (!updated || !finance) return { error: 'تعذر حفظ التحصيل وربطه بالمالية.', status: 500 as const }
      return { item: updated, financeEntry: finance }
    })

    if ('error' in result) return json({ error: result.error }, { status: result.status })
    return json(result)
  } catch {
    return backendUnavailable()
  }
}
