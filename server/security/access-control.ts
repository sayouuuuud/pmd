export type MockWorkspaceRole = 'owner' | 'admin' | 'member'
export type MockCapability = 'workspace:read' | 'workspace:manage' | 'members:manage' | 'resources:read' | 'resources:manage'

export type Actor = { userId: string }
export type Membership = { workspaceId: string; userId: string; role: MockWorkspaceRole; status: 'active' | 'revoked' }
export type OwnedResource = { id: string; workspaceId?: string; userId?: string; version?: number }

const CAPABILITIES: Record<MockWorkspaceRole, readonly MockCapability[]> = {
  owner: ['workspace:read', 'workspace:manage', 'members:manage', 'resources:read', 'resources:manage'],
  admin: ['workspace:read', 'members:manage', 'resources:read', 'resources:manage'],
  member: ['workspace:read', 'resources:read'],
}

export class AccessError extends Error {
  constructor(public readonly status: 401 | 403 | 404 | 409, message: string) {
    super(message)
    this.name = 'AccessError'
  }
}

export function requireActor(actor: Actor | null | undefined): Actor {
  if (!actor?.userId) throw new AccessError(401, 'يجب تسجيل الدخول أولاً.')
  return actor
}

export function requireMembership(actor: Actor, workspaceId: string, memberships: readonly Membership[]): Membership {
  const membership = memberships.find((item) => item.workspaceId === workspaceId && item.userId === actor.userId && item.status === 'active')
  // Deliberately hide whether another workspace exists.
  if (!membership) throw new AccessError(404, 'المورد غير موجود.')
  return membership
}

export function requireCapability(membership: Membership, capability: MockCapability): Membership {
  if (!CAPABILITIES[membership.role].includes(capability)) throw new AccessError(403, 'لا تملك صلاحية تنفيذ هذا الإجراء.')
  return membership
}

export function requireOwnedResource(actor: Actor, resource: OwnedResource | null | undefined, memberships: readonly Membership[], capability: MockCapability = 'resources:read'): OwnedResource {
  if (!resource) throw new AccessError(404, 'المورد غير موجود.')
  if (resource.userId) {
    if (resource.userId !== actor.userId) throw new AccessError(404, 'المورد غير موجود.')
    return resource
  }
  if (!resource.workspaceId) throw new AccessError(404, 'المورد غير موجود.')
  const membership = requireMembership(actor, resource.workspaceId, memberships)
  requireCapability(membership, capability)
  return resource
}

export function assertVersion(resource: OwnedResource, expectedVersion?: number) {
  if (expectedVersion !== undefined && resource.version !== expectedVersion) {
    throw new AccessError(409, 'تم تعديل المورد في مكان آخر. حدّث البيانات ثم أعد المحاولة.')
  }
}

export function accessErrorResponse(error: unknown): Response {
  if (error instanceof AccessError) return Response.json({ error: error.message }, { status: error.status, headers: { 'cache-control': 'no-store' } })
  return Response.json({ error: 'حدث خطأ غير متوقع.' }, { status: 500, headers: { 'cache-control': 'no-store' } })
}
