import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { financeEntry, project, projectPricing } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'
import { getOrCreatePersonalWorkspace } from '@/server/workspaces/access'

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

async function ownedProject(id: string, userId: string) {
  const db = getDb()
  const [item] = await db.select({ id: project.id, workspaceId: project.workspaceId }).from(project).where(and(eq(project.id, id), eq(project.userId, userId), isNull(project.archivedAt))).limit(1)
  return item
}

async function ownedIncome(id: string, userId: string) {
  const db = getDb()
  const [item] = await db.select({ id: financeEntry.id }).from(financeEntry).where(and(eq(financeEntry.id, id), eq(financeEntry.userId, userId), eq(financeEntry.kind, 'income'), isNull(financeEntry.archivedAt))).limit(1)
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
    const amount = typeof body.amount === 'number' && Number.isFinite(body.amount) && body.amount > 0 ? Math.round(body.amount) : undefined
    if (!title || amount === undefined || amount <= 0) return json({ error: 'اسم الدفعة والمبلغ الأكبر من صفر مطلوبان.' }, { status: 400 })

    const status = body.status === undefined ? 'expected' : typeof body.status === 'string' && statuses.has(body.status) ? body.status : undefined
    if (!status) return json({ error: 'حالة الدفعة غير صالحة.' }, { status: 400 })
    const expectedDate = body.expectedDate === undefined || body.expectedDate === null ? null : typeof body.expectedDate === 'string' && body.expectedDate.trim() ? body.expectedDate.trim() : undefined
    if (expectedDate === undefined) return json({ error: 'تاريخ الاستحقاق غير صالح.' }, { status: 400 })
    const receivedAt = status === 'received' ? parseDate(body.receivedAt) ?? new Date() : null
    const financeEntryId = typeof body.financeEntryId === 'string' && body.financeEntryId.trim() ? body.financeEntryId.trim() : null
    if (financeEntryId && status !== 'received') return json({ error: 'لا يمكن ربط دخل إلا بدفعة محصلة.' }, { status: 400 })

    const db = getDb()
    const item = await ownedProject(id, user.id)
    if (!item) return json({ error: 'المشروع غير موجود.' }, { status: 404 })
    if (financeEntryId && !(await ownedIncome(financeEntryId, user.id))) return json({ error: 'سجل الدخل المرتبط غير موجود.' }, { status: 400 })
    const workspaceId = item.workspaceId ?? (await getOrCreatePersonalWorkspace(db, user.id)).id
    const [created] = await db.insert(projectPricing).values({ id: typeof body.id === 'string' && body.id.trim() ? body.id.trim() : crypto.randomUUID(), workspaceId, projectId: id, createdBy: user.id, title, amount, currency: typeof body.currency === 'string' && body.currency.trim() ? body.currency.trim() : 'جنيه', status, expectedDate, receivedAt, financeEntryId, notes: typeof body.notes === 'string' ? body.notes.trim() : null }).returning()
    return json({ item: created }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
