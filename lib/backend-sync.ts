import type { ArchiveKind, ArchivedItem, EntertainmentItem, FinanceEntry, Goal, Habit, JournalEntry, Note, PlanItem, PrayerHistoryDay, PrayerLog, Profile, Project, QuranPlaylist, QuranPosition, Reminder, ReligiousState, SunnahKey, Task, WeeklyReview } from './command-center-store'
import { normalizeReminderRepeatLabel } from './reminder-utils'

type RemoteProfile = {
  city: string
  dayStart: string
  workWindow: string
  focusGoal: string
  onboardingComplete: boolean
}

type RemoteSubtask = {
  id: string
  taskId: string
  title: string
  done: boolean
}

type RemoteTask = {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  dueLabel: string | null
  category: string
  recurring: boolean
  sourceNoteId: string | null
  projectId: string | null
  subtasks?: RemoteSubtask[]
}

type RemoteHabit = {
  id: string
  title: string
  icon: string
  target: string
  frequency?: string
  streak?: number
  doneToday?: boolean
  history?: Record<string, boolean>
  taskId?: string | null
  projectId?: string | null
  goalId?: string | null
}

type RemotePlanItem = {
  id: string
  title: string
  kind: string
  sourceId: string | null
  localDate: string | null
  startAt: string | null
  status: string
}

type RemoteNote = {
  id: string
  title: string
  body: string
  tag: string
  pinned: boolean
  createdAt: string | Date
  sourceTaskId: string | null
}

type RemoteGoal = {
  id: string
  title: string
  description: string
  horizon: string
  status: string
  progress: number
  targetLabel: string
}

type RemoteProject = {
  id: string
  title: string
  description: string
  goalId: string | null
  status: string
  progress: number
  dueLabel: string
}

type RemoteFinanceEntry = {
  id: string
  title: string
  amount: number
  kind: string
  category: string
  localDate: string
  note: string | null
  projectId: string | null
  goalId: string | null
  recurrence: string | null
}

type RemoteBudget = {
  monthlyLimit: number
  currency: string
}

type RemoteEntertainment = {
  id: string
  title: string
  type: string
  genre: string
  year: number | null
  note: string | null
  status: string
  rating: number | null
  impression: string | null
  recommend: boolean
  downloadWanted: boolean
  createdAt: string | Date
}

type RemoteJournal = {
  id: string
  localDate: string
  title: string
  body: string
  mood: string
  archivedAt: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

type RemoteReminder = {
  id: string
  title: string
  kind: string
  dueAt: string
  status: string
  sourceId: string | null
  repeatLabel: string | null
}

type RemoteArchive = {
  id: string
  kind: ArchiveKind
  title: string
  subtitle: string
  archivedAt: string | Date
  payload: ArchivedItem['payload']
}

type RemoteReligious = {
  city: string
  calculationMethod: string
  prayerLogs: PrayerLog[]
  prayerHistory?: PrayerHistoryDay[]
  quranProgress: ReligiousState['quran']
  dhikrSessions: ReligiousState['dhikr']
}

type RemoteWeeklyReview = Omit<WeeklyReview, 'updatedAt'> & { updatedAt: string | Date }

async function request<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, { ...init, credentials: 'include', headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } })
    if (!response.ok) return null
    return await response.json() as T
  } catch {
    return null
  }
}

function asPriority(value: string): Task['priority'] {
  return value === 'high' || value === 'low' ? value : 'medium'
}

function asStatus(value: string): Task['status'] {
  return value === 'done' || value === 'in-progress' ? value : 'todo'
}

export function mapRemoteTask(item: RemoteTask): Task {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? undefined,
    priority: asPriority(item.priority),
    status: asStatus(item.status),
    dueLabel: item.dueLabel ?? 'بدون موعد',
    category: item.category,
    recurring: item.recurring,
    sourceNoteId: item.sourceNoteId ?? undefined,
    projectId: item.projectId ?? undefined,
    subtasks: item.subtasks?.map((subtask) => ({ id: subtask.id, title: subtask.title, done: subtask.done })) ?? [],
  }
}

export function mapRemoteHabit(item: RemoteHabit): Habit {
  return {
    id: item.id,
    title: item.title,
    icon: item.icon,
    target: item.target,
    frequency: item.frequency === 'weekly' ? 'weekly' : 'daily',
    streak: item.streak ?? 0,
    doneToday: item.doneToday ?? false,
    history: item.history ?? {},
    taskId: item.taskId ?? undefined,
    projectId: item.projectId ?? undefined,
    goalId: item.goalId ?? undefined,
  }
}

function asPlanKind(value: string): PlanItem['kind'] {
  return value === 'habit' || value === 'prayer' || value === 'quran' || value === 'rest' ? value : 'task'
}

function asPlanStatus(value: string): PlanItem['status'] {
  return value === 'done' || value === 'snoozed' || value === 'skipped' ? value : 'pending'
}

export function mapRemotePlanItem(item: RemotePlanItem): PlanItem {
  return {
    id: item.id,
    title: item.title,
    kind: asPlanKind(item.kind),
    sourceId: item.sourceId ?? undefined,
    localDate: item.localDate ?? undefined,
    time: item.startAt ?? '—',
    status: asPlanStatus(item.status),
  }
}

export function mapRemoteNote(item: RemoteNote): Note {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    tag: item.tag,
    pinned: item.pinned,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt).toLocaleDateString('ar-EG'),
    sourceTaskId: item.sourceTaskId ?? undefined,
  }
}

function asGoalHorizon(value: string): Goal['horizon'] {
  return value === 'year' || value === 'someday' ? value : 'quarter'
}

function asGoalStatus(value: string): Goal['status'] {
  return value === 'paused' || value === 'completed' ? value : 'active'
}

function asProjectStatus(value: string): Project['status'] {
  return value === 'in-progress' || value === 'paused' || value === 'done' ? value : 'backlog'
}
function normalizeRemoteSunnahChecks(value: unknown): Record<SunnahKey, boolean> {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  return { duha: source.duha === true, witr: source.witr === true, rawatib: source.rawatib === true, sadaqah: source.sadaqah === true }
}

export function mapRemoteGoal(item: RemoteGoal): Goal {
  return { id: item.id, title: item.title, description: item.description, horizon: asGoalHorizon(item.horizon), status: asGoalStatus(item.status), progress: Math.max(0, Math.min(100, item.progress)), targetLabel: item.targetLabel }
}

export function mapRemoteProject(item: RemoteProject): Project {
  return { id: item.id, title: item.title, description: item.description, goalId: item.goalId ?? undefined, status: asProjectStatus(item.status), progress: Math.max(0, Math.min(100, item.progress)), dueLabel: item.dueLabel }
}

function asFinanceKind(value: string): FinanceEntry['kind'] {
  return value === 'income' ? 'income' : 'expense'
}

function asFinanceRecurrence(value: string | null | undefined): FinanceEntry['recurrence'] {
  return value === 'weekly' || value === 'monthly' ? value : 'none'
}

export function mapRemoteFinanceEntry(item: RemoteFinanceEntry): FinanceEntry {
  return { id: item.id, title: item.title, amount: Math.max(0, Number(item.amount) || 0), kind: asFinanceKind(item.kind), category: item.category || 'عام', localDate: item.localDate, note: item.note ?? undefined, projectId: item.projectId ?? undefined, goalId: item.goalId ?? undefined, recurrence: asFinanceRecurrence(item.recurrence) }
}

function asEntertainmentStatus(value: string): EntertainmentItem['status'] {
  return value === 'watching' ? 'watching' : value === 'done' ? 'completed' : 'want'
}

function asEntertainmentType(value: string): EntertainmentItem['type'] {
  return value === 'series' ? 'series' : 'movie'
}

export function mapRemoteEntertainment(item: RemoteEntertainment): EntertainmentItem {
  return {
    id: item.id,
    title: item.title,
    type: asEntertainmentType(item.type),
    genre: item.genre || 'عام',
    year: item.year ?? undefined,
    note: item.note ?? undefined,
    status: asEntertainmentStatus(item.status),
    rating: item.rating ?? undefined,
    impression: item.impression ?? undefined,
    recommend: Boolean(item.recommend),
    downloadWanted: Boolean(item.downloadWanted),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt).toISOString(),
  }
}

function asReminderKind(value: string): Reminder['kind'] {
  return value === 'habit' || value === 'prayer' || value === 'quran' || value === 'finance' ? value : 'task'
}

function asReminderStatus(value: string): Reminder['status'] {
  return value === 'done' || value === 'snoozed' ? value : 'pending'
}

function asJournalMood(value: string): JournalEntry['mood'] {
  return value === 'سعيد' || value === 'هادئ' || value === 'متعب' || value === 'متوتر' ? value : 'محايد'
}

export function mapRemoteJournal(item: RemoteJournal): JournalEntry {
  return { id: item.id, localDate: item.localDate, title: item.title || 'يومياتي', body: item.body || '', mood: asJournalMood(item.mood), createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt).toLocaleDateString('ar-EG'), updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date(item.updatedAt).toLocaleString('ar-EG') }
}

export function mapRemoteReminder(item: RemoteReminder): Reminder {
  return { id: item.id, title: item.title, kind: asReminderKind(item.kind), dueAt: item.dueAt, status: asReminderStatus(item.status), sourceId: item.sourceId ?? undefined, repeatLabel: normalizeReminderRepeatLabel(item.repeatLabel) }
}

function asPrayerStatus(value: string): PrayerLog['status'] {
  return value === 'done' || value === 'on-time' || value === 'congregation' || value === 'qada' || value === 'missed' ? value : 'pending'
}

function normalizeRemotePrayerHistory(item: PrayerHistoryDay): PrayerHistoryDay {
  const allowedStatuses: PrayerLog['status'][] = ['pending', 'done', 'on-time', 'congregation', 'qada', 'missed']
  const statusCounts = item.statusCounts && Object.fromEntries(Object.entries(item.statusCounts).filter(([status, count]) => allowedStatuses.includes(status as PrayerLog['status']) && typeof count === 'number' && Number.isFinite(count)).map(([status, count]) => [status, Math.max(0, Math.min(10, Math.round(count as number)))]))
  const missedByPrayer = item.missedByPrayer && Object.fromEntries(Object.entries(item.missedByPrayer).filter(([name, count]) => typeof name === 'string' && name.trim() && typeof count === 'number' && Number.isFinite(count)).slice(0, 5).map(([name, count]) => [name.slice(0, 40), Math.max(0, Math.min(10, Math.round(count as number)))]))
  return { localDate: item.localDate, completed: Math.max(0, Math.min(10, Math.round(item.completed))), total: Math.max(1, Math.min(10, Math.round(item.total))), ...(statusCounts && Object.keys(statusCounts).length ? { statusCounts } : {}), ...(missedByPrayer && Object.keys(missedByPrayer).length ? { missedByPrayer } : {}) }
}

export function mapRemoteWeeklyReview(item: RemoteWeeklyReview): WeeklyReview {
  return {
    id: item.id,
    weekStart: item.weekStart,
    weekEnd: item.weekEnd,
    wentWell: item.wentWell ?? '',
    blockers: item.blockers ?? '',
    nextGoal: item.nextGoal ?? '',
    status: item.status === 'completed' ? 'completed' : 'draft',
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date(item.updatedAt).toLocaleString('ar-EG'),
  }
}

function progressFromRemoteCount(prefix: 'morning' | 'evening', value: unknown): Record<string, number> {
  let remaining = Math.max(0, Math.min(12, Math.round(Number(value) || 0)))
  return Object.fromEntries(Array.from({ length: 4 }, (_, index) => {
    const count = Math.min(3, remaining)
    remaining -= count
    return [`${prefix}-${index + 1}`, count]
  }))
}

function normalizeRemoteProgress(value: unknown, fallback: Record<string, number> = {}): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback
  const entries = Object.entries(value as Record<string, unknown>).filter(([id, count]) => /^[a-z]+-[1-9]$/.test(id) && typeof count === 'number' && Number.isFinite(count)).slice(0, 20)
  return entries.length ? Object.fromEntries(entries.map(([id, count]) => [id, Math.max(0, Math.min(100, Math.round(count as number)))])) : fallback
}

function normalizeRemoteQuranPosition(value: unknown): QuranPosition | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const position = value as Record<string, unknown>
  if (!Number.isFinite(Number(position.surahNumber))) return undefined
  return { surahNumber: Math.max(1, Math.min(114, Math.round(Number(position.surahNumber)))), positionSeconds: Math.max(0, Math.min(86400, Math.round(Number(position.positionSeconds) || 0))), ...(Number.isFinite(Number(position.ayahNumber)) ? { ayahNumber: Math.max(1, Math.min(1000, Math.round(Number(position.ayahNumber)))) } : {}), ...(Number.isFinite(Number(position.reciterId)) ? { reciterId: Math.max(1, Math.round(Number(position.reciterId))) } : {}), updatedAt: typeof position.updatedAt === 'string' ? position.updatedAt.slice(0, 40) : new Date().toISOString() }
}

function normalizeRemoteSurahList(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.filter((number): number is number => typeof number === 'number' && Number.isFinite(number)).map((number) => Math.max(1, Math.min(114, Math.round(number)))).filter((number, index, numbers) => numbers.indexOf(number) === index).slice(0, 114)
}

function normalizeRemotePlaylists(value: unknown): QuranPlaylist[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 12).flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const playlist = item as Record<string, unknown>
    if (typeof playlist.id !== 'string' || typeof playlist.name !== 'string') return []
    const surahNumbers = Array.isArray(playlist.surahNumbers) ? playlist.surahNumbers.filter((number): number is number => typeof number === 'number' && Number.isFinite(number)).map((number) => Math.max(1, Math.min(114, Math.round(number)))).filter((number, index, numbers) => numbers.indexOf(number) === index).slice(0, 30) : []
    return [{ id: playlist.id.slice(0, 80), name: playlist.name.trim().slice(0, 80) || 'قائمة تلاوة', surahNumbers, createdAt: typeof playlist.createdAt === 'string' ? playlist.createdAt.slice(0, 40) : new Date().toISOString() }]
  })
}

export function mapRemoteReligious(item: RemoteReligious): ReligiousState {
  return {
    city: item.city || 'القاهرة',
    calculationMethod: item.calculationMethod || 'مخصص',
    prayerLogs: Array.isArray(item.prayerLogs) ? item.prayerLogs.map((prayer) => ({ ...prayer, status: asPrayerStatus(prayer.status) })) : [],
    prayerHistory: Array.isArray(item.prayerHistory) ? item.prayerHistory.slice(-30).map(normalizeRemotePrayerHistory) : [],
    quran: { reference: item.quranProgress?.reference || 'ورد اليوم', targetMinutes: Math.max(1, Number(item.quranProgress?.targetMinutes) || 20), completedMinutes: Math.max(0, Number(item.quranProgress?.completedMinutes) || 0), memorizationTarget: Math.max(1, Number(item.quranProgress?.memorizationTarget) || 10), memorizationCompleted: Math.max(0, Number(item.quranProgress?.memorizationCompleted) || 0), lastPosition: normalizeRemoteQuranPosition(item.quranProgress?.lastPosition), playlists: normalizeRemotePlaylists(item.quranProgress?.playlists), listenLater: normalizeRemoteSurahList(item.quranProgress?.listenLater), listenedSurahNumbers: normalizeRemoteSurahList(item.quranProgress?.listenedSurahNumbers) },
    dhikr: { morning: Boolean(item.dhikrSessions?.morning), evening: Boolean(item.dhikrSessions?.evening), morningCount: Math.max(0, Number(item.dhikrSessions?.morningCount) || 0), eveningCount: Math.max(0, Number(item.dhikrSessions?.eveningCount) || 0), morningProgress: normalizeRemoteProgress(item.dhikrSessions?.morningProgress, progressFromRemoteCount('morning', item.dhikrSessions?.morningCount)), eveningProgress: normalizeRemoteProgress(item.dhikrSessions?.eveningProgress, progressFromRemoteCount('evening', item.dhikrSessions?.eveningCount)), lastSession: item.dhikrSessions?.lastSession, tasbeehCount: Math.max(0, Number(item.dhikrSessions?.tasbeehCount) || 0), tasbeehTarget: Math.max(1, Number(item.dhikrSessions?.tasbeehTarget) || 100), savedDuas: Array.isArray(item.dhikrSessions?.savedDuas) ? item.dhikrSessions.savedDuas.filter((dua): dua is string => typeof dua === 'string').slice(-20) : [], sunnahChecks: normalizeRemoteSunnahChecks(item.dhikrSessions?.sunnahChecks) },
  }
}

export async function hydrateRemoteData() {
  const [tasks, notes, habits, planItems, goals, projects, finance, budgetResponse, profileResponse, religiousResponse, reminders, entertainment, journal, reviewResponse, archive] = await Promise.all([
    request<{ items: RemoteTask[] }>('/api/tasks'),
    request<{ items: RemoteNote[] }>('/api/notes'),
    request<{ items: RemoteHabit[] }>('/api/habits'),
    request<{ items: RemotePlanItem[] }>('/api/daily-plan'),
    request<{ items: RemoteGoal[] }>('/api/goals'),
    request<{ items: RemoteProject[] }>('/api/projects'),
    request<{ items: RemoteFinanceEntry[] }>('/api/finance'),
    request<{ budget: RemoteBudget }>('/api/finance/budget'),
    request<{ user: { name: string }; profile: RemoteProfile }>('/api/profile'),
    request<{ religious: RemoteReligious }>('/api/religious'),
    request<{ items: RemoteReminder[] }>('/api/reminders'),
    request<{ items: RemoteEntertainment[] }>('/api/entertainment'),
    request<{ entries: RemoteJournal[] }>('/api/journal'),
    request<{ review: RemoteWeeklyReview }>('/api/review'),
    request<{ items: RemoteArchive[] }>('/api/archive'),
  ])
  return {
    tasks: tasks?.items?.map(mapRemoteTask) ?? null,
    notes: notes?.items?.map(mapRemoteNote) ?? null,
    habits: habits?.items?.map(mapRemoteHabit) ?? null,
    planItems: planItems?.items?.map(mapRemotePlanItem) ?? null,
    goals: goals?.items?.map(mapRemoteGoal) ?? null,
    projects: projects?.items?.map(mapRemoteProject) ?? null,
    financeEntries: finance?.items?.map(mapRemoteFinanceEntry) ?? null,
    budget: budgetResponse?.budget ? { monthlyLimit: Math.max(0, budgetResponse.budget.monthlyLimit), currency: budgetResponse.budget.currency || 'جنيه' } : null,
    profile: profileResponse?.profile
      ? {
          name: profileResponse.user.name,
          city: profileResponse.profile.city,
          dayStart: profileResponse.profile.dayStart,
          workWindow: profileResponse.profile.workWindow,
          focusGoal: profileResponse.profile.focusGoal,
          onboardingComplete: profileResponse.profile.onboardingComplete,
        }
      : null,
    religious: religiousResponse?.religious ? mapRemoteReligious(religiousResponse.religious) : null,
    reminders: reminders?.items?.map(mapRemoteReminder) ?? null,
    entertainment: entertainment?.items?.map(mapRemoteEntertainment) ?? null,
    journal: journal?.entries?.map(mapRemoteJournal) ?? null,
    weeklyReview: reviewResponse?.review ? mapRemoteWeeklyReview(reviewResponse.review) : null,
    archive: archive?.items?.map((item) => ({ ...item, archivedAt: typeof item.archivedAt === 'string' ? item.archivedAt : new Date(item.archivedAt).toISOString() })) ?? null,
  }
}

export function createRemoteJournal(input: Pick<JournalEntry, 'localDate' | 'title' | 'body' | 'mood'> & Partial<Pick<JournalEntry, 'id'>>) {
  return request<{ entry: RemoteJournal }>('/api/journal', { method: 'POST', body: JSON.stringify(input) })
}

export function updateRemoteJournal(id: string, patch: Partial<Pick<JournalEntry, 'localDate' | 'title' | 'body' | 'mood'>>) {
  return request<{ entry: RemoteJournal }>(`/api/journal/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function archiveRemoteJournal(id: string) {
  return request<{ ok: boolean }>(`/api/journal/${id}`, { method: 'DELETE' })
}

export function restoreRemoteArchive(kind: ArchiveKind, id: string) {
  return request<{ item: unknown }>(`/api/archive/${kind}/${id}`, { method: 'PATCH' })
}

export function createRemoteEntertainment(input: Omit<EntertainmentItem, 'id' | 'createdAt'>) {
  return request<{ item: RemoteEntertainment }>('/api/entertainment', { method: 'POST', body: JSON.stringify({ ...input, status: input.status === 'completed' ? 'done' : input.status }) })
}

export function updateRemoteEntertainment(id: string, patch: Partial<EntertainmentItem>) {
  const nextPatch = { ...patch, ...(patch.status ? { status: patch.status === 'completed' ? 'done' : patch.status } : {}) }
  return request<{ item: RemoteEntertainment }>(`/api/entertainment/${id}`, { method: 'PATCH', body: JSON.stringify(nextPatch) })
}

export function archiveRemoteEntertainment(id: string) {
  return request<{ ok: boolean }>(`/api/entertainment/${id}`, { method: 'DELETE' })
}

export function createRemoteReminder(input: Pick<Reminder, 'title' | 'kind' | 'dueAt'> & Partial<Pick<Reminder, 'sourceId' | 'repeatLabel'>>) {
  const payload = { ...input, repeatLabel: normalizeReminderRepeatLabel(input.repeatLabel) }
  return request<{ item: RemoteReminder }>('/api/reminders', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateRemoteReminder(id: string, patch: Partial<Reminder>) {
  const payload = patch.repeatLabel === undefined ? patch : { ...patch, repeatLabel: normalizeReminderRepeatLabel(patch.repeatLabel) }
  return request<{ item: RemoteReminder }>(`/api/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function archiveRemoteReminder(id: string) {
  return request<{ ok: boolean }>(`/api/reminders/${id}`, { method: 'DELETE' })
}

export function updateRemoteWeeklyReview(review: WeeklyReview) {
  return request<{ review: RemoteWeeklyReview }>('/api/review', {
    method: 'PATCH',
    body: JSON.stringify(review),
  })
}

export function updateRemoteReligious(religious: ReligiousState) {
  return request<{ religious: RemoteReligious }>('/api/religious', {
    method: 'PATCH',
    body: JSON.stringify({ city: religious.city, calculationMethod: religious.calculationMethod, prayerLogs: religious.prayerLogs, prayerHistory: religious.prayerHistory ?? [], quranProgress: religious.quran, dhikrSessions: religious.dhikr }),
  })
}

export function updateRemoteProfile(profile: Partial<Profile>) {
  return request<{ user: { name: string }; profile: RemoteProfile }>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  })
}

export function createRemoteTask(input: Pick<Task, 'title' | 'priority' | 'dueLabel' | 'category'> & Partial<Pick<Task, 'description' | 'recurring' | 'projectId'>>) {
  return request<{ item: RemoteTask }>('/api/tasks', { method: 'POST', body: JSON.stringify(input) })
}

export function createRemoteNote(input: Pick<Note, 'title' | 'body' | 'tag'>) {
  return request<{ item: RemoteNote }>('/api/notes', { method: 'POST', body: JSON.stringify(input) })
}

export function updateRemoteTask(id: string, patch: Partial<Task>) {
  return request<{ item: RemoteTask }>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function archiveRemoteTask(id: string) {
  return request<{ item: RemoteTask }>(`/api/tasks/${id}`, { method: 'DELETE' })
}

export function createRemoteSubtask(taskId: string, input: { id: string; title: string; done?: boolean }) {
  return request<{ item: RemoteSubtask }>(`/api/tasks/${taskId}/subtasks`, { method: 'POST', body: JSON.stringify(input) })
}

export function updateRemoteSubtask(taskId: string, subtaskId: string, patch: Partial<Pick<RemoteSubtask, 'title' | 'done'>>) {
  return request<{ item: RemoteSubtask }>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function archiveRemoteSubtask(taskId: string, subtaskId: string) {
  return request<{ item: RemoteSubtask }>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' })
}

export function updateRemoteNote(id: string, patch: Partial<Note>) {
  return request<{ item: RemoteNote }>(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function archiveRemoteNote(id: string) {
  return request<{ item: RemoteNote }>(`/api/notes/${id}`, { method: 'DELETE' })
}

export function createRemoteGoal(input: Pick<Goal, 'title' | 'horizon' | 'targetLabel'> & Partial<Pick<Goal, 'description' | 'status' | 'progress'>>) {
  return request<{ item: RemoteGoal }>('/api/goals', { method: 'POST', body: JSON.stringify(input) })
}

export function updateRemoteGoal(id: string, patch: Partial<Goal>) {
  return request<{ item: RemoteGoal }>(`/api/goals/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function archiveRemoteGoal(id: string) {
  return request<{ item: RemoteGoal }>(`/api/goals/${id}`, { method: 'DELETE' })
}

export function createRemoteProject(input: Pick<Project, 'title' | 'dueLabel'> & Partial<Pick<Project, 'description' | 'goalId' | 'status' | 'progress'>>) {
  return request<{ item: RemoteProject }>('/api/projects', { method: 'POST', body: JSON.stringify(input) })
}

export function updateRemoteProject(id: string, patch: Partial<Project>) {
  return request<{ item: RemoteProject }>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function archiveRemoteProject(id: string) {
  return request<{ item: RemoteProject }>(`/api/projects/${id}`, { method: 'DELETE' })
}

export function createRemoteFinanceEntry(input: Pick<FinanceEntry, 'title' | 'amount' | 'kind' | 'category' | 'localDate'> & Partial<Pick<FinanceEntry, 'note' | 'projectId' | 'goalId' | 'recurrence'>>) {
  return request<{ item: RemoteFinanceEntry }>('/api/finance', { method: 'POST', body: JSON.stringify(input) })
}

export function updateRemoteFinanceEntry(id: string, patch: Partial<FinanceEntry>) {
  return request<{ item: RemoteFinanceEntry }>(`/api/finance/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function archiveRemoteFinanceEntry(id: string) {
  return request<{ item: RemoteFinanceEntry }>(`/api/finance/${id}`, { method: 'DELETE' })
}

export function updateRemoteBudget(monthlyLimit: number) {
  return request<{ budget: RemoteBudget }>('/api/finance/budget', { method: 'PATCH', body: JSON.stringify({ monthlyLimit }) })
}

export function createRemoteHabit(input: Pick<Habit, 'title' | 'icon' | 'target'> & Partial<Pick<Habit, 'frequency' | 'taskId' | 'projectId' | 'goalId'>>) {
  return request<{ item: RemoteHabit }>('/api/habits', { method: 'POST', body: JSON.stringify(input) })
}

export function archiveRemoteHabit(id: string) {
  return request<{ item: RemoteHabit }>(`/api/habits/${id}?action=archive`, { method: 'DELETE' })
}

export function toggleRemoteHabit(id: string, doneToday: boolean, localDate: string) {
  return doneToday
    ? request(`/api/habits/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'done', localDate }) })
    : request(`/api/habits/${id}?date=${encodeURIComponent(localDate)}`, { method: 'DELETE' })
}

export function updateRemotePlanItem(id: string, patch: Partial<PlanItem>) {
  return request<{ item: RemotePlanItem }>(`/api/daily-plan/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...patch, startAt: patch.time }),
  })
}
