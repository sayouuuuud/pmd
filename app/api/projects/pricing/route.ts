import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { project, projectPricing } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const db = getDb()
    const items = await db.select({ id: projectPricing.id, projectId: projectPricing.projectId, title: projectPricing.title, amount: projectPricing.amount, currency: projectPricing.currency, status: projectPricing.status, expectedDate: projectPricing.expectedDate, receivedAt: projectPricing.receivedAt, financeEntryId: projectPricing.financeEntryId, notes: projectPricing.notes, createdAt: projectPricing.createdAt })
      .from(projectPricing)
      .innerJoin(project, eq(project.id, projectPricing.projectId))
      .where(and(eq(project.userId, user.id), isNull(project.archivedAt)))
      .orderBy(desc(projectPricing.createdAt))
      .limit(200)
    return json({ items })
  } catch {
    return backendUnavailable()
  }
}
