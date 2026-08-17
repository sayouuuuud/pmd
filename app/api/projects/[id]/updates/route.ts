import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { project, projectUpdate } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'
import { getOrCreatePersonalWorkspace } from '@/server/workspaces/access'

export const dynamic = 'force-dynamic'

const kinds = new Set(['progress', 'decision', 'blocker', 'info'])

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

async function ownedProject(id: string, userId: string) {
  const db = getDb()
  const [item] = await db.select({ id: project.id, workspaceId: project.workspaceId }).from(project).where(and(eq(project.id, id), eq(project.userId, userId), isNull(project.archivedAt))).limit(1)
  return item
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const item = await ownedProject(id, user.id)
    if (!item) return json({ error: 'المشروع غير موجود.' }, { status: 404 })
    const db = getDb()
    const items = await db.select().from(projectUpdate).where(and(eq(projectUpdate.projectId, id), eq(projectUpdate.createdBy, user.id))).orderBy(desc(projectUpdate.createdAt)).limit(100)
    return json({ items })
  } catch {
    return backendUnavailable()
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const updateId = new URL(request.url).searchParams.get('updateId')
    if (!updateId) return json({ error: 'معرّف التحديث مطلوب.' }, { status: 400 })
    const db = getDb()
    const [deleted] = await db.delete(projectUpdate).where(and(eq(projectUpdate.id, updateId), eq(projectUpdate.projectId, id), eq(projectUpdate.createdBy, user.id))).returning({ id: projectUpdate.id })
    if (!deleted) return json({ error: 'التحديث غير موجود.' }, { status: 404 })
    return json({ ok: true })
  } catch {
    return backendUnavailable()
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(request)
  if (!user) return unauthorized()

  try {
    const { id } = await context.params
    const body = await request.json() as Record<string, unknown>
    const text = typeof body.body === 'string' ? body.body.trim() : ''
    const kind = typeof body.kind === 'string' && kinds.has(body.kind) ? body.kind : 'progress'
    if (!text) return json({ error: 'نص التحديث مطلوب.' }, { status: 400 })
    const db = getDb()
    const item = await ownedProject(id, user.id)
    if (!item) return json({ error: 'المشروع غير موجود.' }, { status: 404 })
    const workspaceId = item.workspaceId ?? (await getOrCreatePersonalWorkspace(db, user.id)).id
    const [created] = await db.insert(projectUpdate).values({ id: typeof body.id === 'string' && body.id.trim() ? body.id.trim() : crypto.randomUUID(), workspaceId, projectId: id, createdBy: user.id, body: text, kind }).returning()
    return json({ item: created }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
