import { createHash, randomBytes } from 'node:crypto'
import { and, desc, eq, gt, ne } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { user, workspace, workspaceInvitation, workspaceMember } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'
import { canManageClients, canManageMembers, compareWorkspaceRoles, getWorkspaceMember } from '@/server/workspaces/access'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function textValue(value: unknown, fallback = '', maxLength = 240) {
  if (typeof value !== 'string') return fallback
  return value.trim().slice(0, maxLength)
}

function normalizeEmail(value: unknown) {
  return textValue(value, '', 254).toLocaleLowerCase('en-US')
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function safeInvitation(invitation: typeof workspaceInvitation.$inferSelect) {
  return {
    id: invitation.id,
    workspaceId: invitation.workspaceId,
    invitedEmail: invitation.invitedEmail,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    createdAt: invitation.createdAt,
  }
}

async function getWorkspaceAccess(db: ReturnType<typeof getDb>, workspaceId: string, userId: string) {
  const member = await getWorkspaceMember(db, workspaceId, userId)
  if (!member) return null
  const [currentWorkspace] = await db.select().from(workspace).where(eq(workspace.id, workspaceId)).limit(1)
  if (!currentWorkspace) return null
  return { member, workspace: currentWorkspace }
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const workspaceId = textValue(new URL(request.url).searchParams.get('workspaceId'), '', 120)
    if (!workspaceId) return json({ error: 'مساحة العمل مطلوبة.' }, { status: 400 })

    const db = getDb()
    const access = await getWorkspaceAccess(db, workspaceId, currentUser.id)
    if (!access) return json({ error: 'مساحة العمل غير متاحة.' }, { status: 403 })

    const [members, invitations] = await Promise.all([
      db.select({
        id: workspaceMember.id,
        workspaceId: workspaceMember.workspaceId,
        userId: workspaceMember.userId,
        role: workspaceMember.role,
        status: workspaceMember.status,
        joinedAt: workspaceMember.joinedAt,
        name: user.name,
        email: user.email,
      })
        .from(workspaceMember)
        .innerJoin(user, eq(user.id, workspaceMember.userId))
        .where(and(eq(workspaceMember.workspaceId, workspaceId), ne(workspaceMember.status, 'revoked')))
        .orderBy(desc(workspaceMember.createdAt))
        .limit(100),
      db.select().from(workspaceInvitation)
        .where(and(
          eq(workspaceInvitation.workspaceId, workspaceId),
          eq(workspaceInvitation.status, 'pending'),
          gt(workspaceInvitation.expiresAt, new Date()),
        ))
        .orderBy(desc(workspaceInvitation.createdAt))
        .limit(100),
    ])

    return json({
      workspaceId,
      currentRole: access.member.role,
      canManage: canManageMembers(access.member.role),
      canManageMembers: canManageMembers(access.member.role),
      canManageClients: canManageClients(access.member.role),
      members,
      invitations: invitations.map(safeInvitation),
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
    const action = textValue(body.action, 'create', 30) || 'create'
    const db = getDb()

    if (action === 'accept') {
      const token = textValue(body.token, '', 512)
      if (!token) return json({ error: 'رمز الدعوة مطلوب.' }, { status: 400 })

      const [invitation] = await db.select().from(workspaceInvitation)
        .where(eq(workspaceInvitation.tokenHash, hashToken(token)))
        .limit(1)
      if (!invitation || invitation.status !== 'pending' || invitation.expiresAt <= new Date()) {
        return json({ error: 'الدعوة غير صالحة أو منتهية.' }, { status: 400 })
      }
      if (normalizeEmail(currentUser.email) !== normalizeEmail(invitation.invitedEmail)) {
        return json({ error: 'هذه الدعوة موجهة إلى بريد إلكتروني مختلف.' }, { status: 403 })
      }

      const [existingMembership] = await db.select().from(workspaceMember)
        .where(and(
          eq(workspaceMember.workspaceId, invitation.workspaceId),
          eq(workspaceMember.userId, currentUser.id),
        ))
        .limit(1)
      if (existingMembership?.status === 'active' && existingMembership.role === 'owner') {
        return json({ error: 'مالك مساحة العمل لا يحتاج إلى قبول دعوة.' }, { status: 409 })
      }
      const effectiveRole = existingMembership && compareWorkspaceRoles(existingMembership.role, invitation.role) > 0
        ? existingMembership.role
        : invitation.role
      const member = existingMembership
        ? (await db.update(workspaceMember)
          .set({ status: 'active', role: effectiveRole, joinedAt: existingMembership.joinedAt ?? new Date(), updatedAt: new Date() })
          .where(eq(workspaceMember.id, existingMembership.id))
          .returning())[0]
        : (await db.insert(workspaceMember).values({
          id: crypto.randomUUID(),
          workspaceId: invitation.workspaceId,
          userId: currentUser.id,
          role: effectiveRole,
          status: 'active',
          joinedAt: new Date(),
        }).returning())[0]
      if (!member) return json({ error: 'تعذر تفعيل عضوية مساحة العمل.' }, { status: 500 })

      const [accepted] = await db.update(workspaceInvitation)
        .set({ status: 'accepted', acceptedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(workspaceInvitation.id, invitation.id), eq(workspaceInvitation.status, 'pending')))
        .returning()
      if (!accepted) return json({ error: 'تعذر قبول الدعوة.' }, { status: 409 })

      return json({ workspaceId: invitation.workspaceId, member, invitation: safeInvitation(accepted) })
    }

    const workspaceId = textValue(body.workspaceId, '', 120)
    const invitedEmail = normalizeEmail(body.invitedEmail ?? body.email)
    const requestedRole = textValue(body.role, 'member', 40) || 'member'
    if (!workspaceId || !invitedEmail) return json({ error: 'مساحة العمل والبريد الإلكتروني مطلوبان.' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedEmail)) return json({ error: 'اكتب بريدًا إلكترونيًا صحيحًا.' }, { status: 400 })
    if (invitedEmail === normalizeEmail(currentUser.email)) return json({ error: 'أنت عضو بالفعل في حسابك الحالي.' }, { status: 400 })
    if (!['member', 'admin'].includes(requestedRole)) return json({ error: 'دور العضو غير متاح.' }, { status: 400 })

    const access = await getWorkspaceAccess(db, workspaceId, currentUser.id)
    if (!access || !canManageMembers(access.member.role)) return json({ error: 'لا تملك صلاحية دعوة أعضاء.' }, { status: 403 })
    if (access.member.role === 'admin' && requestedRole === 'admin') return json({ error: 'المدير لا يستطيع منح دور مدير لعضو آخر.' }, { status: 403 })

    const [existingUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, invitedEmail)).limit(1)
    if (existingUser) {
      const existingMember = await getWorkspaceMember(db, workspaceId, existingUser.id)
      if (existingMember) return json({ error: 'هذا المستخدم عضو بالفعل في مساحة العمل.' }, { status: 409 })
    }

    await db.update(workspaceInvitation)
      .set({ status: 'revoked', updatedAt: new Date() })
      .where(and(
        eq(workspaceInvitation.workspaceId, workspaceId),
        eq(workspaceInvitation.invitedEmail, invitedEmail),
        eq(workspaceInvitation.status, 'pending'),
      ))

    const rawToken = randomBytes(32).toString('hex')
    const [created] = await db.insert(workspaceInvitation).values({
      id: crypto.randomUUID(),
      workspaceId,
      invitedBy: currentUser.id,
      invitedEmail,
      role: requestedRole,
      tokenHash: hashToken(rawToken),
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }).returning()
    if (!created) return json({ error: 'تعذر إنشاء الدعوة.' }, { status: 500 })

    return json({ invitation: safeInvitation(created), token: rawToken, delivery: 'manual-experimental' }, { status: 201 })
  } catch {
    return backendUnavailable()
  }
}

export async function DELETE(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const body = await request.json() as Record<string, unknown>
    const invitationId = textValue(body.invitationId, '', 120)
    const workspaceId = textValue(body.workspaceId, '', 120)
    if (!invitationId || !workspaceId) return json({ error: 'بيانات الدعوة ناقصة.' }, { status: 400 })

    const db = getDb()
    const access = await getWorkspaceAccess(db, workspaceId, currentUser.id)
    if (!access || !canManageMembers(access.member.role)) return json({ error: 'لا تملك صلاحية إبطال الدعوة.' }, { status: 403 })

    const [revoked] = await db.update(workspaceInvitation)
      .set({ status: 'revoked', updatedAt: new Date() })
      .where(and(
        eq(workspaceInvitation.id, invitationId),
        eq(workspaceInvitation.workspaceId, workspaceId),
        eq(workspaceInvitation.status, 'pending'),
      ))
      .returning()
    if (!revoked) return json({ error: 'الدعوة غير موجودة أو تم التعامل معها سابقًا.' }, { status: 404 })
    return json({ invitation: safeInvitation(revoked) })
  } catch {
    return backendUnavailable()
  }
}
