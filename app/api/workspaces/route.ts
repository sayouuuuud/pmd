import { and, eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { workspace, workspaceMember } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'
import { ensureWorkspaceMember, getOrCreatePersonalWorkspace } from '@/server/workspaces/access'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function textValue(value: unknown, fallback = '', maxLength = 120) {
  if (typeof value !== 'string') return fallback
  return value.trim().slice(0, maxLength)
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const db = getDb()
    const memberships = await db
      .select({ workspace, role: workspaceMember.role })
      .from(workspaceMember)
      .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
      .where(and(eq(workspaceMember.userId, currentUser.id), eq(workspaceMember.status, 'active')))

    if (memberships.length === 0) {
      const personal = await getOrCreatePersonalWorkspace(db, currentUser.id)
      return json({ workspaces: [{ ...personal, role: 'owner' }], activeWorkspaceId: personal.id })
    }

    const personal = memberships.find((entry) => entry.workspace.kind === 'personal') ?? memberships[0]
    return json({
      workspaces: memberships.map((entry) => ({ ...entry.workspace, role: entry.role })),
      activeWorkspaceId: personal.workspace.id,
    })
  } catch {
    return backendUnavailable()
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const body = await request.json() as Record<string, unknown>
    const name = textValue(body.name)
    const kind = textValue(body.kind, 'work', 40) || 'work'
    if (!name) return json({ error: 'اسم مساحة العمل مطلوب.' }, { status: 400 })

    const db = getDb()
    const [created] = await db.insert(workspace).values({
      id: crypto.randomUUID(),
      ownerId: currentUser.id,
      name,
      kind,
    }).returning()

    if (!created) return json({ error: 'تعذر إنشاء مساحة العمل.' }, { status: 500 })
    await ensureWorkspaceMember(db, created.id, currentUser.id, 'owner')
    return json({ workspace: { ...created, role: 'owner' } }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}
