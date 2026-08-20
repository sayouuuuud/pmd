import { assertVersion, requireOwnedResource, type Actor, type Membership, type MockCapability, type OwnedResource } from '../security/access-control'

export type MockUser = { id: string; name: string }
export type MockWorkspace = { id: string; name: string; ownerId: string }
export type MockResource = OwnedResource & { id: string; title: string; workspaceId: string; version: number; updatedAt: string }

export type MockSnapshot = {
  users: MockUser[]
  workspaces: MockWorkspace[]
  memberships: Membership[]
  resources: MockResource[]
}

export const MOCK_IDS = {
  owner: 'mock-user-owner',
  admin: 'mock-user-admin',
  member: 'mock-user-member',
  outsider: 'mock-user-outsider',
  revoked: 'mock-user-revoked',
  primaryWorkspace: 'mock-workspace-primary',
  otherWorkspace: 'mock-workspace-other',
} as const

export function createMockSnapshot(): MockSnapshot {
  const now = '2026-08-20T12:00:00.000Z'
  return {
    users: [
      { id: MOCK_IDS.owner, name: 'مالك تجريبي' },
      { id: MOCK_IDS.admin, name: 'مدير تجريبي' },
      { id: MOCK_IDS.member, name: 'عضو تجريبي' },
      { id: MOCK_IDS.outsider, name: 'مستخدم خارجي' },
      { id: MOCK_IDS.revoked, name: 'عضو ملغى' },
    ],
    workspaces: [
      { id: MOCK_IDS.primaryWorkspace, name: 'مساحة الفريق التجريبية', ownerId: MOCK_IDS.owner },
      { id: MOCK_IDS.otherWorkspace, name: 'مساحة معزولة', ownerId: MOCK_IDS.outsider },
    ],
    memberships: [
      { workspaceId: MOCK_IDS.primaryWorkspace, userId: MOCK_IDS.owner, role: 'owner', status: 'active' },
      { workspaceId: MOCK_IDS.primaryWorkspace, userId: MOCK_IDS.admin, role: 'admin', status: 'active' },
      { workspaceId: MOCK_IDS.primaryWorkspace, userId: MOCK_IDS.member, role: 'member', status: 'active' },
      { workspaceId: MOCK_IDS.primaryWorkspace, userId: MOCK_IDS.revoked, role: 'member', status: 'revoked' },
      { workspaceId: MOCK_IDS.otherWorkspace, userId: MOCK_IDS.outsider, role: 'owner', status: 'active' },
    ],
    resources: [
      { id: 'mock-resource-primary', workspaceId: MOCK_IDS.primaryWorkspace, title: 'مورد الفريق', version: 1, updatedAt: now },
      { id: 'mock-resource-other', workspaceId: MOCK_IDS.otherWorkspace, title: 'مورد معزول', version: 1, updatedAt: now },
    ],
  }
}

export interface ResourceRepository {
  list(actor: Actor, workspaceId: string): Promise<MockResource[]>
  get(actor: Actor, id: string): Promise<MockResource>
  update(actor: Actor, id: string, patch: { title?: string; expectedVersion?: number }): Promise<MockResource>
}

export class InMemoryResourceRepository implements ResourceRepository {
  private readonly snapshot: MockSnapshot

  constructor(snapshot: MockSnapshot = createMockSnapshot()) {
    this.snapshot = structuredClone(snapshot)
  }

  private authorize(actor: Actor, resource: MockResource | undefined, capability: MockCapability) {
    return requireOwnedResource(actor, resource, this.snapshot.memberships, capability) as MockResource
  }

  async list(actor: Actor, workspaceId: string) {
    const candidate = this.snapshot.resources.find((item) => item.workspaceId === workspaceId)
    this.authorize(actor, candidate, 'resources:read')
    return structuredClone(this.snapshot.resources.filter((item) => item.workspaceId === workspaceId))
  }

  async get(actor: Actor, id: string) {
    return structuredClone(this.authorize(actor, this.snapshot.resources.find((item) => item.id === id), 'resources:read'))
  }

  async update(actor: Actor, id: string, patch: { title?: string; expectedVersion?: number }) {
    const resource = this.authorize(actor, this.snapshot.resources.find((item) => item.id === id), 'resources:manage')
    assertVersion(resource, patch.expectedVersion)
    if (patch.title?.trim()) resource.title = patch.title.trim().slice(0, 160)
    resource.version += 1
    resource.updatedAt = new Date().toISOString()
    return structuredClone(resource)
  }
}
