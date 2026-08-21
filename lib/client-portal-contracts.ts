import { LOCAL_EXTERNAL_ROLE_CAPABILITIES, LOCAL_SHARE_ROLE_CAPABILITIES, type LocalExternalRole, type LocalRoleCapability, type LocalShareRole } from '@/lib/local-first-contracts'

export type ClientPortalShareStatus = 'active' | 'revoked' | 'expired'
export type ClientPortalInteractionKind = 'comment' | 'change-request' | 'milestone-approval'
export type ClientPortalAuditAction = 'created' | 'renewed' | 'rotated' | 'revoked' | 'commented' | 'change-requested' | 'milestone-approved'

export type ClientPortalResource = {
  id: string
  title: string
  url: string
  description?: string
}

export type ClientPortalShare = {
  id: string
  token: string
  workspaceId: string
  clientId: string
  projectIds: string[]
  role: LocalExternalRole | LocalShareRole
  includePricing: boolean
  includeSchedule: boolean
  resources: ClientPortalResource[]
  status: ClientPortalShareStatus
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export type ClientPortalInteraction = {
  id: string
  shareId: string
  projectId: string
  milestoneId?: string
  kind: ClientPortalInteractionKind
  body: string
  createdAt: string
}

export type ClientPortalAuditEvent = {
  id: string
  shareId: string
  action: ClientPortalAuditAction
  projectId?: string
  detail: string
  createdAt: string
}

export type ClientPortalFallback = {
  shares: ClientPortalShare[]
  interactions: ClientPortalInteraction[]
  auditEvents: ClientPortalAuditEvent[]
}

export const CLIENT_PORTAL_STORAGE_KEY = 'personal-command-center-client-portal-v1'

export const clientPortalFallback: ClientPortalFallback = { shares: [], interactions: [], auditEvents: [] }

export function canClientPortalRole(role: ClientPortalShare['role'], capability: LocalRoleCapability) {
  const capabilities = role === 'client' || role === 'reader' || role === 'reviewer' ? LOCAL_EXTERNAL_ROLE_CAPABILITIES[role] : LOCAL_SHARE_ROLE_CAPABILITIES[role]
  return capabilities.includes(capability)
}

export function isClientPortalShareUsable(share: ClientPortalShare, now = new Date()) {
  return share.status === 'active' && (!share.expiresAt || new Date(share.expiresAt) > now)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeRole(value: unknown): ClientPortalShare['role'] {
  return value === 'client' || value === 'reader' || value === 'reviewer' || value === 'viewer' || value === 'commenter' || value === 'approver' ? value : 'client'
}

function normalizeResources(value: unknown): ClientPortalResource[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!isObject(item) || typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.url !== 'string') return []
    return [{ id: item.id, title: item.title, url: item.url, description: typeof item.description === 'string' ? item.description : undefined }]
  })
}

function normalizeShare(value: unknown): ClientPortalShare | null {
  if (!isObject(value)) return null
  if (typeof value.id !== 'string' || typeof value.token !== 'string' || typeof value.workspaceId !== 'string' || typeof value.clientId !== 'string') return null
  const projectIds = Array.isArray(value.projectIds) ? value.projectIds.filter((item): item is string => typeof item === 'string') : []
  const status = value.status === 'revoked' || value.status === 'expired' ? value.status : 'active'
  return {
    id: value.id,
    token: value.token,
    workspaceId: value.workspaceId,
    clientId: value.clientId,
    projectIds,
    role: normalizeRole(value.role),
    includePricing: booleanValue(value.includePricing, false),
    includeSchedule: booleanValue(value.includeSchedule, true),
    resources: normalizeResources(value.resources),
    status,
    expiresAt: typeof value.expiresAt === 'string' ? value.expiresAt : null,
    createdAt: stringValue(value.createdAt, new Date().toISOString()),
    updatedAt: stringValue(value.updatedAt, new Date().toISOString()),
  }
}

function normalizeInteraction(value: unknown): ClientPortalInteraction | null {
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.shareId !== 'string' || typeof value.projectId !== 'string' || typeof value.body !== 'string') return null
  const kind = value.kind === 'change-request' || value.kind === 'milestone-approval' ? value.kind : 'comment'
  return { id: value.id, shareId: value.shareId, projectId: value.projectId, milestoneId: typeof value.milestoneId === 'string' ? value.milestoneId : undefined, kind, body: value.body, createdAt: stringValue(value.createdAt, new Date().toISOString()) }
}

function normalizeAuditEvent(value: unknown): ClientPortalAuditEvent | null {
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.shareId !== 'string' || typeof value.detail !== 'string') return null
  const actions: ClientPortalAuditAction[] = ['created', 'renewed', 'rotated', 'revoked', 'commented', 'change-requested', 'milestone-approved']
  if (!actions.includes(value.action as ClientPortalAuditAction)) return null
  return { id: value.id, shareId: value.shareId, action: value.action as ClientPortalAuditAction, projectId: typeof value.projectId === 'string' ? value.projectId : undefined, detail: value.detail, createdAt: stringValue(value.createdAt, new Date().toISOString()) }
}

export function readClientPortalFallback(): ClientPortalFallback {
  if (typeof window === 'undefined') return clientPortalFallback
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CLIENT_PORTAL_STORAGE_KEY) ?? '') as Partial<ClientPortalFallback>
    return {
      shares: Array.isArray(parsed.shares) ? parsed.shares.map(normalizeShare).filter((item): item is ClientPortalShare => Boolean(item)) : [],
      interactions: Array.isArray(parsed.interactions) ? parsed.interactions.map(normalizeInteraction).filter((item): item is ClientPortalInteraction => Boolean(item)) : [],
      auditEvents: Array.isArray(parsed.auditEvents) ? parsed.auditEvents.map(normalizeAuditEvent).filter((item): item is ClientPortalAuditEvent => Boolean(item)) : [],
    }
  } catch {
    return clientPortalFallback
  }
}

export function persistClientPortalFallback(next: ClientPortalFallback) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CLIENT_PORTAL_STORAGE_KEY, JSON.stringify(next))
}

export function getActiveClientPortalShare(shares: ClientPortalShare[], token: string, now = new Date()) {
  const share = shares.find((item) => item.token === token)
  if (!share) return null
  if (share.status !== 'active') return { ...share, status: share.status } satisfies ClientPortalShare
  if (share.expiresAt && new Date(share.expiresAt) <= now) return { ...share, status: 'expired' as const }
  return share
}

export function createClientPortalToken() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `portal-${crypto.randomUUID().replaceAll('-', '')}`
  return `portal-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export function createClientPortalId(prefix: string) {
  return `${prefix}-${createClientPortalToken().slice(6)}`
}

export function renewClientPortalShare(share: ClientPortalShare, days: number, now = new Date()): ClientPortalShare {
  const safeDays = Math.min(90, Math.max(1, Math.round(days) || 14))
  return { ...share, status: 'active', expiresAt: new Date(now.getTime() + safeDays * 86_400_000).toISOString(), updatedAt: now.toISOString() }
}

export function rotateClientPortalShare(share: ClientPortalShare, now = new Date()): ClientPortalShare {
  return { ...share, token: createClientPortalToken(), status: 'active', updatedAt: now.toISOString() }
}

export function hasMilestoneApproval(interactions: ClientPortalInteraction[], shareId: string, projectId: string, milestoneId: string) {
  return interactions.some((item) => item.shareId === shareId && item.projectId === projectId && item.milestoneId === milestoneId && item.kind === 'milestone-approval')
}

export function scopeClientPortalProjectIds(projectIds: string[], clientId: string, projects: Array<{ id: string; clientId?: string }>) {
  const allowed = new Set(projects.filter((project) => project.clientId === clientId).map((project) => project.id))
  return [...new Set(projectIds)].filter((id) => allowed.has(id))
}
