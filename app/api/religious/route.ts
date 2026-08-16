import { eq } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { religiousSettings } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

const defaults = {
  city: 'القاهرة',
  calculationMethod: 'مخصص',
  prayerLogs: [],
  prayerHistory: [],
  quranProgress: { reference: 'ورد اليوم', targetMinutes: 20, completedMinutes: 0, memorizationTarget: 10, memorizationCompleted: 0 },
  dhikrSessions: { morning: false, evening: false, morningCount: 0, eveningCount: 0 },
}

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function stringValue(value: unknown, fallback: string, maxLength = 80) {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim()
  return normalized ? normalized.slice(0, maxLength) : fallback
}

function safePrayerLogs(value: unknown) {
  if (!Array.isArray(value)) return defaults.prayerLogs
  return value.slice(0, 10).map((item) => {
    const prayer = item as Record<string, unknown>
    const status = prayer.status === 'done' || prayer.status === 'missed' ? prayer.status : 'pending'
    return {
      id: stringValue(prayer.id, 'prayer', 40),
      name: stringValue(prayer.name, 'صلاة', 40),
      time: stringValue(prayer.time, '—', 10),
      status,
      localDate: stringValue(prayer.localDate, new Date().toISOString().slice(0, 10), 12),
    }
  })
}

function safePrayerHistory(value: unknown) {
  if (!Array.isArray(value)) return defaults.prayerHistory
  return value.slice(-30).map((item) => {
    const day = item as Record<string, unknown>
    return {
      localDate: stringValue(day.localDate, new Date().toISOString().slice(0, 10), 12),
      completed: Math.max(0, Math.min(10, Math.round(Number(day.completed) || 0))),
      total: Math.max(1, Math.min(10, Math.round(Number(day.total) || 5))),
    }
  })
}

function safeQuranProgress(value: unknown) {
  const progress = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const targetMinutes = Math.max(1, Math.min(240, Number(progress.targetMinutes) || 20))
  const completedMinutes = Math.max(0, Math.min(targetMinutes, Number(progress.completedMinutes) || 0))
  const memorizationTarget = Math.max(1, Math.min(1000, Math.round(Number(progress.memorizationTarget) || 10)))
  const memorizationCompleted = Math.max(0, Math.min(memorizationTarget, Math.round(Number(progress.memorizationCompleted) || 0)))
  return {
    reference: stringValue(progress.reference, 'ورد اليوم', 160),
    targetMinutes,
    completedMinutes,
    memorizationTarget,
    memorizationCompleted,
  }
}

function safeDhikrSessions(value: unknown) {
  const sessions = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  return {
    morning: sessions.morning === true,
    evening: sessions.evening === true,
    morningCount: Math.max(0, Math.min(10000, Math.round(Number(sessions.morningCount) || 0))),
    eveningCount: Math.max(0, Math.min(10000, Math.round(Number(sessions.eveningCount) || 0))),
    tasbeehCount: Math.max(0, Math.min(100000, Math.round(Number(sessions.tasbeehCount) || 0))),
    tasbeehTarget: Math.max(1, Math.min(100000, Math.round(Number(sessions.tasbeehTarget) || 100))),
    savedDuas: Array.isArray(sessions.savedDuas) ? sessions.savedDuas.filter((dua): dua is string => typeof dua === 'string' && dua.trim().length > 0).map((dua) => dua.trim().slice(0, 240)).slice(-20) : [],
    ...(typeof sessions.lastSession === 'string' ? { lastSession: sessions.lastSession.slice(0, 40) } : {}),
  }
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const db = getDb()
    await db.insert(religiousSettings).values({ userId: currentUser.id, ...defaults }).onConflictDoNothing()
    const [item] = await db.select().from(religiousSettings).where(eq(religiousSettings.userId, currentUser.id)).limit(1)
    return json({ religious: item ?? { userId: currentUser.id, ...defaults } })
  } catch {
    return backendUnavailable()
  }
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const body = await request.json() as Record<string, unknown>
    const db = getDb()
    const [existing] = await db.select().from(religiousSettings).where(eq(religiousSettings.userId, currentUser.id)).limit(1)
    const patch = {
      city: stringValue(body.city, existing?.city ?? defaults.city),
      calculationMethod: stringValue(body.calculationMethod, existing?.calculationMethod ?? defaults.calculationMethod),
      prayerLogs: Array.isArray(body.prayerLogs) ? safePrayerLogs(body.prayerLogs) : existing?.prayerLogs ?? defaults.prayerLogs,
      prayerHistory: body.prayerHistory !== undefined ? safePrayerHistory(body.prayerHistory) : existing?.prayerHistory ?? defaults.prayerHistory,
      quranProgress: body.quranProgress !== undefined ? safeQuranProgress(body.quranProgress) : existing?.quranProgress ?? defaults.quranProgress,
      dhikrSessions: body.dhikrSessions !== undefined ? safeDhikrSessions(body.dhikrSessions) : existing?.dhikrSessions ?? defaults.dhikrSessions,
      updatedAt: new Date(),
    }
    await db.insert(religiousSettings).values({ userId: currentUser.id, ...patch }).onConflictDoUpdate({ target: religiousSettings.userId, set: patch })
    const [item] = await db.select().from(religiousSettings).where(eq(religiousSettings.userId, currentUser.id)).limit(1)
    return json({ religious: item })
  } catch {
    return backendUnavailable()
  }
}
