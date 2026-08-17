import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { project, projectUpdate } from '@/server/db/schema'
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
    const items = await db.select({ id: projectUpdate.id, projectId: projectUpdate.projectId, body: projectUpdate.body, kind: projectUpdate.kind, createdAt: projectUpdate.createdAt })
      .from(projectUpdate)
      .innerJoin(project, eq(project.id, projectUpdate.projectId))
      .where(and(eq(project.userId, user.id), isNull(project.archivedAt)))
      .orderBy(desc(projectUpdate.createdAt))
      .limit(200)
    return json({ items })
  } catch {
    return backendUnavailable()
  }
}
