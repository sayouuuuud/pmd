export type PrayerCountdownItem = {
  name: string
  time: string
  timestamp: number
  remainingMs: number
  tomorrow: boolean
}

type PrayerTime = { name: string; time: string }

function parsePrayerTimestamp(time: string, baseDate: Date) {
  const match = time.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  const date = new Date(baseDate)
  date.setHours(Number(match[1]), Number(match[2]), 0, 0)
  return date.getTime()
}

export function getNextPrayerCountdown(prayers: PrayerTime[], nowMs: number): PrayerCountdownItem | null {
  if (!nowMs) return null
  const now = new Date(nowMs)
  const todayCandidates = prayers
    .map((prayer) => ({ ...prayer, timestamp: parsePrayerTimestamp(prayer.time, now) }))
    .filter((prayer): prayer is { name: string; time: string; timestamp: number } => prayer.timestamp !== null && prayer.timestamp > nowMs)
    .sort((left, right) => left.timestamp - right.timestamp)
  if (todayCandidates[0]) return { ...todayCandidates[0], remainingMs: todayCandidates[0].timestamp - nowMs, tomorrow: false }

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowCandidate = prayers
    .map((prayer) => ({ ...prayer, timestamp: parsePrayerTimestamp(prayer.time, tomorrow) }))
    .filter((prayer): prayer is { name: string; time: string; timestamp: number } => prayer.timestamp !== null)
    .sort((left, right) => left.timestamp - right.timestamp)[0]
  return tomorrowCandidate ? { ...tomorrowCandidate, remainingMs: tomorrowCandidate.timestamp - nowMs, tomorrow: true } : null
}

export function formatPrayerCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours}س ${String(minutes).padStart(2, '0')}د ${String(seconds).padStart(2, '0')}ث`
}
