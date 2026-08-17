import { and, eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { workspace, workspaceMember } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'
import { canManageWorkspace, getWorkspaceMember } from '@/server/workspaces/access'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

export async function DELETE(request: Request, context: { params: Promise<{ memberId: string }> }) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const { memberId } = await context.params
    const db = getDb()
    const [target] = await db.select({ member: workspaceMember, workspace })
      .from(workspaceMember)
      .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
      .where(eq(workspaceMember.id, memberId))
      .limit(1)
    if (!target) return json({ error: 'العضو غير موجود.' }, { status: 404 })

    const actor = await getWorkspaceMember(db, target.member.workspaceId, currentUser.id)
    if (!actor || !canManageWorkspace(actor.role)) return json({ error: 'لا تملك صلاحية إبطال وصول هذا العضو.' }, { status: 403 })
    if (target.member.role === 'owner' || target.member.userId === target.workspace.ownerId) {
      return json({ error: 'لا يمكن إزالة مالك مساحة العمل.' }, { status: 400 })
    }
    if (actor.role === 'admin' && target.member.role === 'admin') {
      return json({ error: 'لا يمكن للمدير إزالة مدير آخر.' }, { status: 403 })
    }
    if (target.member.status === 'revoked') {
      return json({ error: 'تم إبطال وصول هذا العضو مسبقًا.' }, { status: 409 })
    }

    const [revoked] = await db.update(workspaceMember)
      .set({ status: 'revoked', updatedAt: new Date() })
      .where(and(eq(workspaceMember.id, memberId), eq(workspaceMember.status, 'active')))
      .returning({ id: workspaceMember.id, workspaceId: workspaceMember.workspaceId, userId: workspaceMember.userId, role: workspaceMember.role, status: workspaceMember.status })
    if (!revoked) return json({ error: 'تعذر إبطال وصول العضو.' }, { status: 409 })
    return json({ member: revoked })
  } catch {
    return backendUnavailable()
  }
}
