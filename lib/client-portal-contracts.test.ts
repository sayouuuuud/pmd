import { describe, expect, it } from 'vitest'
import type { ClientPortalInteraction, ClientPortalShare } from './client-portal-contracts'
import { canClientPortalRole, getActiveClientPortalShare, hasMilestoneApproval, renewClientPortalShare, scopeClientPortalProjectIds } from './client-portal-contracts'

const share: ClientPortalShare = {
  id: 'share-1', token: 'portal-old', workspaceId: 'workspace-1', clientId: 'client-1', projectIds: ['project-1'],
  role: 'reader', includePricing: false, includeSchedule: true, resources: [], status: 'active',
  expiresAt: '2026-08-20T00:00:00.000Z', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
}

describe('client portal contracts', () => {
  it('marks elapsed links as expired without mutating storage', () => {
    expect(getActiveClientPortalShare([share], share.token, new Date('2026-08-21T00:00:00.000Z'))?.status).toBe('expired')
    expect(share.status).toBe('active')
  })

  it('renews and reactivates a revoked link within the allowed duration', () => {
    const renewed = renewClientPortalShare({ ...share, status: 'revoked' }, 120, new Date('2026-08-21T00:00:00.000Z'))
    expect(renewed.status).toBe('active')
    expect(renewed.expiresAt).toBe('2026-11-19T00:00:00.000Z')
  })

  it('keeps only projects assigned to the shared client', () => {
    expect(scopeClientPortalProjectIds(['project-1', 'project-2', 'project-1'], 'client-1', [
      { id: 'project-1', clientId: 'client-1' }, { id: 'project-2', clientId: 'client-2' },
    ])).toEqual(['project-1'])
  })

  it('enforces reader and reviewer capabilities', () => {
    expect(canClientPortalRole('reader', 'comment')).toBe(false)
    expect(canClientPortalRole('reviewer', 'review')).toBe(true)
  })

  it('detects an existing milestone approval', () => {
    const interactions: ClientPortalInteraction[] = [{ id: 'interaction-1', shareId: share.id, projectId: 'project-1', milestoneId: 'milestone-1', kind: 'milestone-approval', body: 'approved', createdAt: '2026-08-21T00:00:00.000Z' }]
    expect(hasMilestoneApproval(interactions, share.id, 'project-1', 'milestone-1')).toBe(true)
    expect(hasMilestoneApproval(interactions, share.id, 'project-1', 'milestone-2')).toBe(false)
  })
})
