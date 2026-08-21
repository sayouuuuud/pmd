import { describe, expect, it } from 'vitest'
import { AccessError, requireActor, requireCapability, requireMembership, requireOwnedResource } from './access-control'
import { createMockSnapshot, InMemoryResourceRepository, MOCK_IDS } from '../mock/repository'

const snapshot = createMockSnapshot()
const actor = (userId: string) => ({ userId })

describe('access control', () => {
  it('requires a server-resolved actor', () => {
    expect(() => requireActor(null)).toThrowError(AccessError)
    expect(() => requireActor(actor(MOCK_IDS.owner))).not.toThrow()
  })

  it('enforces the role capability matrix', () => {
    const member = requireMembership(actor(MOCK_IDS.member), MOCK_IDS.primaryWorkspace, snapshot.memberships)
    expect(() => requireCapability(member, 'resources:read')).not.toThrow()
    expect(() => requireCapability(member, 'resources:manage')).toThrowError(expect.objectContaining({ status: 403 }))
  })

  it('hides cross-workspace and revoked memberships as not found', () => {
    const resource = snapshot.resources.find((item) => item.id === 'mock-resource-primary')
    expect(() => requireOwnedResource(actor(MOCK_IDS.outsider), resource, snapshot.memberships)).toThrowError(expect.objectContaining({ status: 404 }))
    expect(() => requireOwnedResource(actor(MOCK_IDS.revoked), resource, snapshot.memberships)).toThrowError(expect.objectContaining({ status: 404 }))
  })

  it('does not trust a client-selected workspace', async () => {
    const repository = new InMemoryResourceRepository(snapshot)
    await expect(repository.list(actor(MOCK_IDS.outsider), MOCK_IDS.primaryWorkspace)).rejects.toMatchObject({ status: 404 })
    await expect(repository.get(actor(MOCK_IDS.owner), 'mock-resource-other')).rejects.toMatchObject({ status: 404 })
  })

  it('allows managers and detects stale updates', async () => {
    const repository = new InMemoryResourceRepository(snapshot)
    await expect(repository.update(actor(MOCK_IDS.member), 'mock-resource-primary', { title: 'مرفوض', expectedVersion: 1 })).rejects.toMatchObject({ status: 403 })
    const updated = await repository.update(actor(MOCK_IDS.admin), 'mock-resource-primary', { title: 'تم التحديث', expectedVersion: 1 })
    expect(updated).toMatchObject({ title: 'تم التحديث', version: 2 })
    await expect(repository.update(actor(MOCK_IDS.owner), 'mock-resource-primary', { title: 'قديم', expectedVersion: 1 })).rejects.toMatchObject({ status: 409 })
  })
})
