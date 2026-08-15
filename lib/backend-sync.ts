import type { FinanceEntry, Goal, Habit, Note, PlanItem, PrayerLog, Profile, Project, ReligiousState, Task } from './command-center-store'

type RemoteProfile = {
  city: string
  dayStart: string
  workWindow: string
  focusGoal: string
  onboardingComplete: boolean
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
}

type RemoteHabit = {
  id: string
  title: string
  icon: string
  target: string
  streak?: number
  doneToday?: boolean
}

type RemotePlanItem = {
  id: string
  title: string
  kind: string
  sourceId: string | null
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
}

type RemoteBudget = {
  monthlyLimit: number
  currency: string
}

type RemoteReligious = {
  city: string
  calculationMethod: string
  prayerLogs: PrayerLog[]
  quranProgress: ReligiousState['quran']
  dhikrSessions: ReligiousState['dhikr']
}

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
  }
}

export function mapRemoteHabit(item: RemoteHabit): Habit {
  return {
    id: item.id,
    title: item.title,
    icon: item.icon,
    target: item.target,
    streak: item.streak ?? 0,
    doneToday: item.doneToday ?? false,
  }
}

function asPlanKind(value: string): PlanItem['kind'] {
  return value === 'habit' || value === 'prayer' || value === 'quran' || value === 'rest' ? value : 'task'
}

function asPlanStatus(value: string): PlanItem['status'] {
  return value === 'done' || value === 'snoozed' ? value : 'pending'
}

export function mapRemotePlanItem(item: RemotePlanItem): PlanItem {
  return {
    id: item.id,
    title: item.title,
    kind: asPlanKind(item.kind),
    sourceId: item.sourceId ?? undefined,
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
  return value === 'in-progress' || value === 'done' ? value : 'backlog'
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

export function mapRemoteFinanceEntry(item: RemoteFinanceEntry): FinanceEntry {
  return { id: item.id, title: item.title, amount: Math.max(0, Number(item.amount) || 0), kind: asFinanceKind(item.kind), category: item.category || 'عام', localDate: item.localDate, note: item.note ?? undefined, projectId: item.projectId ?? undefined, goalId: item.goalId ?? undefined }
}

function asPrayerStatus(value: string): PrayerLog['status'] {
  return value === 'done' || value === 'missed' ? value : 'pending'
}

export function mapRemoteReligious(item: RemoteReligious): ReligiousState {
  return {
    city: item.city || 'القاهرة',
    calculationMethod: item.calculationMethod || 'مخصص',
    prayerLogs: Array.isArray(item.prayerLogs) ? item.prayerLogs.map((prayer) => ({ ...prayer, status: asPrayerStatus(prayer.status) })) : [],
    quran: { reference: item.quranProgress?.reference || 'ورد اليوم', targetMinutes: Math.max(1, Number(item.quranProgress?.targetMinutes) || 20), completedMinutes: Math.max(0, Number(item.quranProgress?.completedMinutes) || 0) },
    dhikr: { morning: Boolean(item.dhikrSessions?.morning), evening: Boolean(item.dhikrSessions?.evening), lastSession: item.dhikrSessions?.lastSession },
  }
}

export async function hydrateRemoteData() {
  const [tasks, notes, habits, planItems, goals, projects, finance, budgetResponse, profileResponse, religiousResponse] = await Promise.all([
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
  }
}

export function updateRemoteReligious(religious: ReligiousState) {
  return request<{ religious: RemoteReligious }>('/api/religious', {
    method: 'PATCH',
    body: JSON.stringify({ city: religious.city, calculationMethod: religious.calculationMethod, prayerLogs: religious.prayerLogs, quranProgress: religious.quran, dhikrSessions: religious.dhikr }),
  })
}

export function updateRemoteProfile(profile: Partial<Profile>) {
  return request<{ user: { name: string }; profile: RemoteProfile }>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  })
}

export function createRemoteTask(input: Pick<Task, 'title' | 'priority' | 'dueLabel' | 'category'> & Partial<Pick<Task, 'description' | 'recurring'>>) {
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

export function createRemoteFinanceEntry(input: Pick<FinanceEntry, 'title' | 'amount' | 'kind' | 'category' | 'localDate'> & Partial<Pick<FinanceEntry, 'note' | 'projectId' | 'goalId'>>) {
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

export function createRemoteHabit(input: Pick<Habit, 'title' | 'icon' | 'target'>) {
  return request<{ item: RemoteHabit }>('/api/habits', { method: 'POST', body: JSON.stringify(input) })
}

export function toggleRemoteHabit(id: string, doneToday: boolean) {
  return doneToday
    ? request(`/api/habits/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'done' }) })
    : request(`/api/habits/${id}`, { method: 'DELETE' })
}

export function updateRemotePlanItem(id: string, patch: Partial<PlanItem>) {
  return request<{ item: RemotePlanItem }>(`/api/daily-plan/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...patch, startAt: patch.time }),
  })
}
