export type ActivitySource = 'windows-agent' | 'manual'
export type ActivityCategory = 'application' | 'browser' | 'idle'
export type ActivitySyncState = 'local' | 'pending' | 'synced' | 'failed'

export type ActivitySession = {
  id: string
  source: ActivitySource
  category: ActivityCategory
  appName: string
  windowTitle?: string
  browserDomain?: string
  startedAt: string
  endedAt?: string
  idleSeconds: number
  syncState: ActivitySyncState
  syncError?: string | null
  createdAt: string
}

export type ActivitySettings = {
  collectorEnabled: boolean
  paused: boolean
  collectWindowTitle: boolean
  collectBrowserDomain: boolean
  idleThresholdSeconds: number
  excludedApps: string[]
  excludedDomains: string[]
  retentionDays: number
  lastSyncAt?: string
  lastSyncError?: string | null
}

export type ActivitySessionInput = Pick<ActivitySession, 'source' | 'category' | 'appName' | 'startedAt'> & Partial<Pick<ActivitySession, 'windowTitle' | 'browserDomain' | 'endedAt' | 'idleSeconds' | 'syncState'>>

export const defaultActivitySettings: ActivitySettings = {
  collectorEnabled: false,
  paused: false,
  collectWindowTitle: false,
  collectBrowserDomain: true,
  idleThresholdSeconds: 300,
  excludedApps: [],
  excludedDomains: [],
  retentionDays: 30,
}

export function normalizeActivitySettings(value: unknown, fallback: ActivitySettings = defaultActivitySettings): ActivitySettings {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const cleanList = (input: unknown) => Array.isArray(input)
    ? input.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim().slice(0, 120)).slice(0, 50)
    : []
  const idleThresholdSeconds = Number(source.idleThresholdSeconds)
  const retentionDays = Number(source.retentionDays)
  return {
    collectorEnabled: source.collectorEnabled === true,
    paused: source.paused === true,
    collectWindowTitle: source.collectWindowTitle === true,
    collectBrowserDomain: source.collectBrowserDomain !== false,
    idleThresholdSeconds: Number.isFinite(idleThresholdSeconds) ? Math.max(60, Math.min(3600, Math.round(idleThresholdSeconds))) : fallback.idleThresholdSeconds,
    excludedApps: cleanList(source.excludedApps),
    excludedDomains: cleanList(source.excludedDomains),
    retentionDays: Number.isFinite(retentionDays) ? Math.max(1, Math.min(365, Math.round(retentionDays))) : fallback.retentionDays,
    lastSyncAt: typeof source.lastSyncAt === 'string' ? source.lastSyncAt.slice(0, 40) : fallback.lastSyncAt,
    lastSyncError: typeof source.lastSyncError === 'string' ? source.lastSyncError.slice(0, 240) : null,
  }
}

export function normalizeActivitySession(value: unknown, fallback: ActivitySession): ActivitySession {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const categories: ActivityCategory[] = ['application', 'browser', 'idle']
  const sources: ActivitySource[] = ['windows-agent', 'manual']
  const syncStates: ActivitySyncState[] = ['local', 'pending', 'synced', 'failed']
  const appName = typeof source.appName === 'string' && source.appName.trim() ? source.appName.trim().slice(0, 160) : fallback.appName
  const startedAt = typeof source.startedAt === 'string' ? source.startedAt.slice(0, 40) : fallback.startedAt
  const endedAt = typeof source.endedAt === 'string' ? source.endedAt.slice(0, 40) : undefined
  const idleSeconds = Number(source.idleSeconds)
  return {
    id: typeof source.id === 'string' && source.id.trim() ? source.id.slice(0, 100) : fallback.id,
    source: sources.includes(source.source as ActivitySource) ? source.source as ActivitySource : fallback.source,
    category: categories.includes(source.category as ActivityCategory) ? source.category as ActivityCategory : 'application',
    appName,
    windowTitle: typeof source.windowTitle === 'string' && source.windowTitle.trim() ? source.windowTitle.trim().slice(0, 240) : undefined,
    browserDomain: typeof source.browserDomain === 'string' && source.browserDomain.trim() ? source.browserDomain.trim().slice(0, 180) : undefined,
    startedAt,
    endedAt,
    idleSeconds: Number.isFinite(idleSeconds) ? Math.max(0, Math.min(86400, Math.round(idleSeconds))) : 0,
    syncState: syncStates.includes(source.syncState as ActivitySyncState) ? source.syncState as ActivitySyncState : 'local',
    syncError: typeof source.syncError === 'string' ? source.syncError.slice(0, 240) : null,
    createdAt: typeof source.createdAt === 'string' ? source.createdAt.slice(0, 40) : fallback.createdAt,
  }
}

export function pruneActivitySessions(sessions: ActivitySession[], retentionDays: number, now = Date.now()) {
  const safeDays = Math.max(1, Math.min(365, Math.round(retentionDays)))
  const cutoff = now - safeDays * 24 * 60 * 60 * 1000
  return sessions.filter((session) => {
    const timestamp = Date.parse(session.startedAt)
    return Number.isFinite(timestamp) && timestamp >= cutoff
  })
}

export function activityDurationSeconds(session: Pick<ActivitySession, 'startedAt' | 'endedAt'>) {
  const started = Date.parse(session.startedAt)
  const ended = session.endedAt ? Date.parse(session.endedAt) : Date.now()
  if (!Number.isFinite(started) || !Number.isFinite(ended)) return 0
  return Math.max(0, Math.min(86400, Math.round((ended - started) / 1000)))
}

export function activityNetSeconds(session: ActivitySession) {
  return Math.max(0, activityDurationSeconds(session) - Math.min(activityDurationSeconds(session), session.idleSeconds))
}

export function isActivityExcluded(session: Pick<ActivitySession, 'appName' | 'browserDomain'>, settings: ActivitySettings) {
  const app = session.appName.trim().toLowerCase()
  const domain = (session.browserDomain ?? '').trim().toLowerCase()
  return settings.excludedApps.some((item) => app === item.toLowerCase() || app.includes(item.toLowerCase()))
    || settings.excludedDomains.some((item) => domain === item.toLowerCase() || domain.endsWith(`.${item.toLowerCase()}`))
}

export function formatActivityDuration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  if (hours) return `${hours}س ${minutes}د`
  return `${minutes}د`
}

export function localDateFromIso(value: string, timeZone = 'Africa/Cairo') {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(value))
}

export function startOfLocalDate(date = new Date(), timeZone = 'Africa/Cairo') {
  return localDateFromIso(date.toISOString(), timeZone)
}

export function activityTopApps(sessions: ActivitySession[], settings: ActivitySettings, limit = 5) {
  const totals = new Map<string, number>()
  sessions.filter((session) => !isActivityExcluded(session, settings)).forEach((session) => {
    totals.set(session.appName, (totals.get(session.appName) ?? 0) + activityNetSeconds(session))
  })
  return [...totals.entries()].sort((left, right) => right[1] - left[1]).slice(0, limit).map(([label, seconds]) => ({ label, seconds }))
}

export function activityDistribution(sessions: ActivitySession[], settings: ActivitySettings) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, seconds: 0 }))
  sessions.filter((session) => !isActivityExcluded(session, settings)).forEach((session) => {
    const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', hour: '2-digit', hour12: false }).format(new Date(session.startedAt)))
    const safeHour = Number.isFinite(hour) && hour >= 0 && hour < 24 ? hour : 0
    buckets[safeHour].seconds += activityNetSeconds(session)
  })
  return buckets
}

export function createDemoActivitySessions(): ActivitySession[] {
  return [
    { id: 'activity-1', source: 'windows-agent', category: 'application', appName: 'Visual Studio Code', windowTitle: 'Personal Command Center', startedAt: '2026-08-18T08:30:00.000Z', endedAt: '2026-08-18T10:15:00.000Z', idleSeconds: 420, syncState: 'local', createdAt: '2026-08-18T10:15:00.000Z' },
    { id: 'activity-2', source: 'windows-agent', category: 'browser', appName: 'Microsoft Edge', browserDomain: 'github.com', startedAt: '2026-08-18T10:30:00.000Z', endedAt: '2026-08-18T11:05:00.000Z', idleSeconds: 120, syncState: 'local', createdAt: '2026-08-18T11:05:00.000Z' },
    { id: 'activity-3', source: 'windows-agent', category: 'application', appName: 'Figma', windowTitle: 'Personal Command Center UI', startedAt: '2026-08-17T13:00:00.000Z', endedAt: '2026-08-17T14:10:00.000Z', idleSeconds: 300, syncState: 'local', createdAt: '2026-08-17T14:10:00.000Z' },
    { id: 'activity-4', source: 'windows-agent', category: 'idle', appName: 'خمول الجهاز', startedAt: '2026-08-16T15:20:00.000Z', endedAt: '2026-08-16T15:50:00.000Z', idleSeconds: 1800, syncState: 'local', createdAt: '2026-08-16T15:50:00.000Z' },
  ]
}
