import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { project, projectPricing } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'
import { getOrCreatePersonalWorkspace } from '@/server/workspaces/access'

export const dynamic = 'force-dynamic'

const statuses = new Set(['expected', 'due', 'received', 'cancelled'])

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
    if (!(await ownedProject(id, user.id))) return json({ error: 'المشروع غير موجود.' }, { status: 404 })
    const db = getDb()
    const items = await db.select().from(projectPricing).where(and(eq(projectPricing.projectId, id), eq(projectPricing.createdBy, user.id))).orderBy(desc(projectPricing.createdAt)).limit(100)
    return json({ items })
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
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const amount = typeof body.amount === 'number' && Number.isFinite(body.amount) ? Math.max(0, Math.round(body.amount)) : undefined
    if (!title || amount === undefined) return json({ error: 'اسم الدفعة والمبلغ مطلوبان.' }, { status: 400 })
    const db = getDb()
    const item = await ownedProject(id, user.id)
    if (!item) return json({ error: 'المشروع غير موجود.' }, { status: 404 })
    const workspaceId = item.workspaceId ?? (await getOrCreatePersonalWorkspace(db, user.id)).id
    const status = typeof body.status === 'string' && statuses.has(body.status) ? body.status : 'expected'
    const [created] = await db.insert(projectPricing).values({ id: typeof body.id === 'string' && body.id.trim() ? body.id.trim() : crypto.randomUUID(), workspaceId, projectId: id, createdBy: user.id, title, amount, currency: typeof body.currency === 'string' && body.currency.trim() ? body.currency.trim() : 'جنيه', status, expectedDate: typeof body.expectedDate === 'string' && body.expectedDate.trim() ? body.expectedDate.trim() : null, notes: typeof body.notes === 'string' ? body.notes.trim() : null }).returning()
    return json({ item: created }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
