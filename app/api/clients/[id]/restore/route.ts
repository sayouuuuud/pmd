import { and, eq, isNotNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { client } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'
import { getWorkspaceForMember } from '@/server/workspaces/access'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const { id } = await context.params
    const db = getDb()
    const [row] = await db.select({ item: client }).from(client)
      .where(and(eq(client.id, id), eq(client.createdBy, currentUser.id), isNotNull(client.archivedAt)))
      .limit(1)
    if (!row) return json({ error: 'العميل المؤرشف غير موجود.' }, { status: 404 })

    const workspace = await getWorkspaceForMember(db, row.item.workspaceId, currentUser.id)
    if (!workspace) return json({ error: 'مساحة العمل غير متاحة.' }, { status: 403 })

    const [restored] = await db.update(client).set({ archivedAt: null, status: 'active', updatedAt: new Date() })
      .where(and(eq(client.id, id), eq(client.createdBy, currentUser.id), isNotNull(client.archivedAt)))
      .returning()
    if (!restored) return json({ error: 'تعذر استعادة العميل.' }, { status: 409 })
    return json({ client: restored })
  } catch {
    return backendUnavailable()
  }
}
