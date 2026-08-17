import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { client } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'
import { getOrCreatePersonalWorkspace, getWorkspaceForMember } from '@/server/workspaces/access'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function textValue(value: unknown, fallback = '', maxLength = 240) {
  if (typeof value !== 'string') return fallback
  return value.trim().slice(0, maxLength)
}

async function resolveWorkspace(request: Request, userId: string, db: ReturnType<typeof getDb>) {
  const workspaceId = new URL(request.url).searchParams.get('workspaceId')
  if (!workspaceId) return getOrCreatePersonalWorkspace(db, userId)
  return getWorkspaceForMember(db, workspaceId, userId)
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const db = getDb()
    const currentWorkspace = await resolveWorkspace(request, currentUser.id, db)
    if (!currentWorkspace) return json({ error: 'مساحة العمل غير متاحة.' }, { status: 403 })

    const includeArchived = new URL(request.url).searchParams.get('archived') === 'true'
    const clients = await db.select().from(client)
      .where(and(eq(client.workspaceId, currentWorkspace.id), includeArchived ? isNotNull(client.archivedAt) : isNull(client.archivedAt)))
      .orderBy(desc(client.updatedAt))

    return json({ workspaceId: currentWorkspace.id, clients })
  } catch {
    return backendUnavailable()
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const body = await request.json() as Record<string, unknown>
    const name = textValue(body.name, '', 160)
    if (!name) return json({ error: 'اسم العميل مطلوب.' }, { status: 400 })

    const db = getDb()
    const currentWorkspace = await resolveWorkspace(request, currentUser.id, db)
    if (!currentWorkspace) return json({ error: 'مساحة العمل غير متاحة.' }, { status: 403 })

    const [created] = await db.insert(client).values({
      id: crypto.randomUUID(),
      workspaceId: currentWorkspace.id,
      createdBy: currentUser.id,
      name,
      company: textValue(body.company, '', 160) || null,
      email: textValue(body.email, '', 160) || null,
      phone: textValue(body.phone, '', 60) || null,
      notes: textValue(body.notes, '', 1200) || null,
    }).returning()

    if (!created) return json({ error: 'تعذر إنشاء العميل.' }, { status: 500 })
    return json({ client: created }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
