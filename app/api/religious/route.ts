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
  quranProgress: { reference: 'ورد اليوم', targetMinutes: 20, completedMinutes: 0, memorizationTarget: 10, memorizationCompleted: 0, playlists: [] },
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
    const status = prayer.status === 'done' || prayer.status === 'on-time' || prayer.status === 'congregation' || prayer.status === 'qada' || prayer.status === 'missed' ? prayer.status : 'pending'
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
  const statuses = ['pending', 'done', 'on-time', 'congregation', 'qada', 'missed'] as const
  const safeCounts = (value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
    const counts = Object.fromEntries(statuses.flatMap((status) => {
      const count = Math.max(0, Math.min(10, Math.round(Number((value as Record<string, unknown>)[status]) || 0)))
      return count > 0 ? [[status, count] as const] : []
    }))
    return Object.keys(counts).length ? counts : undefined
  }
  const safeMissedByPrayer = (value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
    const entries = Object.entries(value as Record<string, unknown>).flatMap(([name, count]) => {
      const normalizedName = stringValue(name, '', 40)
      const normalizedCount = Math.max(0, Math.min(10, Math.round(Number(count) || 0)))
      return normalizedName && normalizedCount > 0 ? [[normalizedName, normalizedCount] as const] : []
    }).slice(0, 5)
    return entries.length ? Object.fromEntries(entries) : undefined
  }
  return value.slice(-30).map((item) => {
    const day = item as Record<string, unknown>
    const statusCounts = safeCounts(day.statusCounts)
    const missedByPrayer = safeMissedByPrayer(day.missedByPrayer)
    return {
      localDate: stringValue(day.localDate, new Date().toISOString().slice(0, 10), 12),
      completed: Math.max(0, Math.min(10, Math.round(Number(day.completed) || 0))),
      total: Math.max(1, Math.min(10, Math.round(Number(day.total) || 5))),
      ...(statusCounts ? { statusCounts } : {}),
      ...(missedByPrayer ? { missedByPrayer } : {}),
    }
  })
}

function safeQuranProgress(value: unknown) {
  const progress = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const targetMinutes = Math.max(1, Math.min(240, Number(progress.targetMinutes) || 20))
  const completedMinutes = Math.max(0, Math.min(targetMinutes, Number(progress.completedMinutes) || 0))
  const memorizationTarget = Math.max(1, Math.min(1000, Math.round(Number(progress.memorizationTarget) || 10)))
  const memorizationCompleted = Math.max(0, Math.min(memorizationTarget, Math.round(Number(progress.memorizationCompleted) || 0)))
  const rawPosition = progress.lastPosition && typeof progress.lastPosition === 'object' ? progress.lastPosition as Record<string, unknown> : null
  const lastPosition = rawPosition && Number.isFinite(Number(rawPosition.surahNumber))
    ? { surahNumber: Math.max(1, Math.min(114, Math.round(Number(rawPosition.surahNumber)))), positionSeconds: Math.max(0, Math.min(86400, Math.round(Number(rawPosition.positionSeconds) || 0))), ...(Number.isFinite(Number(rawPosition.ayahNumber)) ? { ayahNumber: Math.max(1, Math.min(1000, Math.round(Number(rawPosition.ayahNumber)))) } : {}), ...(Number.isFinite(Number(rawPosition.reciterId)) ? { reciterId: Math.max(1, Math.round(Number(rawPosition.reciterId))) } : {}), updatedAt: stringValue(rawPosition.updatedAt, new Date().toISOString(), 40) }
    : undefined
  const safeSurahList = (value: unknown) => Array.isArray(value) ? value.filter((number): number is number => typeof number === 'number' && Number.isFinite(number)).map((number) => Math.max(1, Math.min(114, Math.round(number)))).filter((number, index, numbers) => numbers.indexOf(number) === index).slice(0, 114) : []
  const listenLater = safeSurahList(progress.listenLater)
  const listenedSurahNumbers = safeSurahList(progress.listenedSurahNumbers)
  const playlists = Array.isArray(progress.playlists) ? progress.playlists.slice(0, 12).flatMap((item) => {
    const playlist = item && typeof item === 'object' ? item as Record<string, unknown> : null
    if (!playlist) return []
    const surahNumbers = Array.isArray(playlist.surahNumbers) ? playlist.surahNumbers.filter((number): number is number => typeof number === 'number' && Number.isFinite(number)).map((number) => Math.max(1, Math.min(114, Math.round(number)))).filter((number, index, numbers) => numbers.indexOf(number) === index).slice(0, 30) : []
    return [{ id: stringValue(playlist.id, `quran-playlist-${Date.now()}`, 80), name: stringValue(playlist.name, 'قائمة تلاوة', 80), surahNumbers, createdAt: stringValue(playlist.createdAt, new Date().toISOString(), 40) }]
  }) : []
  return { reference: stringValue(progress.reference, 'ورد اليوم', 160), targetMinutes, completedMinutes, memorizationTarget, memorizationCompleted, playlists, listenLater, listenedSurahNumbers, ...(lastPosition ? { lastPosition } : {}) }
}

function safeDhikrProgress(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([id, count]) => /^[a-z]+-[1-9]$/.test(id) && typeof count === 'number' && Number.isFinite(count)).slice(0, 20).map(([id, count]) => [id, Math.max(0, Math.min(100, Math.round(count as number)))]))
}

function safeDhikrSessions(value: unknown) {
  const sessions = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  return {
    morning: sessions.morning === true,
    evening: sessions.evening === true,
    morningCount: Math.max(0, Math.min(10000, Math.round(Number(sessions.morningCount) || 0))),
    eveningCount: Math.max(0, Math.min(10000, Math.round(Number(sessions.eveningCount) || 0))),
    morningProgress: safeDhikrProgress(sessions.morningProgress),
    eveningProgress: safeDhikrProgress(sessions.eveningProgress),
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
