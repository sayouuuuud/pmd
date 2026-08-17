import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { client, entertainmentItem, financeEntry, goal, habit, habitLog, journalEntry, note, project, reminder, task } from '@/server/db/schema'
import { backendUnavailable, getCurrentUser, unauthorized } from '@/server/auth/session'

export const dynamic = 'force-dynamic'

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) } })
}

function dateValue(value: Date | string | null) {
  if (!value) return new Date().toISOString()
  return value instanceof Date ? value.toISOString() : value
}

function cairoToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
}

function previousDate(date: string) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() - 1)
  return value.toISOString().slice(0, 10)
}

function calculateStreak(history: Record<string, boolean>, date: string) {
  let cursor = date
  let streak = 0
  while (history[cursor]) {
    streak += 1
    cursor = previousDate(cursor)
  }
  return streak
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser) return unauthorized()

  try {
    const db = getDb()
    const userId = currentUser.id
    const [tasks, notes, habits, goals, projects, finances, reminders, journals, entertainment, clients] = await Promise.all([
      db.select().from(task).where(and(eq(task.userId, userId), isNotNull(task.archivedAt))).orderBy(desc(task.archivedAt)).limit(200),
      db.select().from(note).where(and(eq(note.userId, userId), isNotNull(note.archivedAt))).orderBy(desc(note.archivedAt)).limit(200),
      db.select().from(habit).where(and(eq(habit.userId, userId), isNotNull(habit.archivedAt))).orderBy(desc(habit.archivedAt)).limit(200),
      db.select().from(goal).where(and(eq(goal.userId, userId), isNotNull(goal.archivedAt))).orderBy(desc(goal.archivedAt)).limit(200),
      db.select().from(project).where(and(eq(project.userId, userId), isNotNull(project.archivedAt))).orderBy(desc(project.archivedAt)).limit(200),
      db.select().from(financeEntry).where(and(eq(financeEntry.userId, userId), isNotNull(financeEntry.archivedAt))).orderBy(desc(financeEntry.archivedAt)).limit(200),
      db.select().from(reminder).where(and(eq(reminder.userId, userId), isNotNull(reminder.archivedAt))).orderBy(desc(reminder.archivedAt)).limit(200),
      db.select().from(journalEntry).where(and(eq(journalEntry.userId, userId), isNotNull(journalEntry.archivedAt))).orderBy(desc(journalEntry.archivedAt)).limit(200),
      db.select().from(entertainmentItem).where(and(eq(entertainmentItem.userId, userId), isNotNull(entertainmentItem.archivedAt))).orderBy(desc(entertainmentItem.archivedAt)).limit(200),
      db.select().from(client).where(and(eq(client.createdBy, userId), isNotNull(client.archivedAt))).orderBy(desc(client.archivedAt)).limit(200),
    ])
    const archivedHabitIds = habits.map((item) => item.id)
    const habitLogs = archivedHabitIds.length
      ? await db.select({ habitId: habitLog.habitId, localDate: habitLog.localDate, status: habitLog.status }).from(habitLog).where(and(eq(habitLog.userId, userId), inArray(habitLog.habitId, archivedHabitIds))).limit(5000)
      : []

    const historyByHabit = new Map<string, Record<string, boolean>>()
    for (const log of habitLogs) {
      if (log.status !== 'done') continue
      const history = historyByHabit.get(log.habitId) ?? {}
      history[log.localDate] = true
      historyByHabit.set(log.habitId, history)
    }
    const localDate = cairoToday()

    const items = [
      ...tasks.map((item) => ({ id: item.id, kind: 'task' as const, title: item.title, subtitle: `المهام · ${item.category}`, archivedAt: dateValue(item.archivedAt), payload: { id: item.id, title: item.title, description: item.description ?? undefined, priority: item.priority === 'high' || item.priority === 'low' ? item.priority : 'medium', status: item.status === 'done' || item.status === 'in-progress' ? item.status : 'todo', dueLabel: item.dueLabel ?? 'بدون موعد', category: item.category, recurring: item.recurring, sourceNoteId: item.sourceNoteId ?? undefined, projectId: item.projectId ?? undefined } })),
      ...notes.map((item) => ({ id: item.id, kind: 'note' as const, title: item.title, subtitle: `الملاحظات · ${item.tag}`, archivedAt: dateValue(item.archivedAt), payload: { id: item.id, title: item.title, body: item.body, tag: item.tag, pinned: item.pinned, createdAt: item.createdAt.toISOString(), sourceTaskId: item.sourceTaskId ?? undefined } })),
      ...habits.map((item) => { const history = historyByHabit.get(item.id) ?? {}; return { id: item.id, kind: 'habit' as const, title: item.title, subtitle: `العادات · ${item.target}`, archivedAt: dateValue(item.archivedAt), payload: { id: item.id, title: item.title, icon: item.icon, target: item.target, frequency: item.frequency === 'weekly' ? 'weekly' : 'daily', streak: calculateStreak(history, localDate), doneToday: Boolean(history[localDate]), history, taskId: item.taskId ?? undefined, projectId: item.projectId ?? undefined, goalId: item.goalId ?? undefined } } }),
      ...goals.map((item) => ({ id: item.id, kind: 'goal' as const, title: item.title, subtitle: `الأهداف · ${item.targetLabel}`, archivedAt: dateValue(item.archivedAt), payload: { id: item.id, title: item.title, description: item.description, horizon: item.horizon === 'year' || item.horizon === 'someday' ? item.horizon : 'quarter', status: item.status === 'paused' || item.status === 'completed' ? item.status : 'active', progress: Math.max(0, Math.min(100, item.progress)), targetLabel: item.targetLabel } })),
      ...projects.map((item) => ({ id: item.id, kind: 'project' as const, title: item.title, subtitle: `المشاريع · ${item.dueLabel}`, archivedAt: dateValue(item.archivedAt), payload: { id: item.id, title: item.title, description: item.description, goalId: item.goalId ?? undefined, status: item.status === 'in-progress' || item.status === 'done' ? item.status : 'backlog', progress: Math.max(0, Math.min(100, item.progress)), dueLabel: item.dueLabel } })),
      ...finances.map((item) => ({ id: item.id, kind: 'finance' as const, title: item.title, subtitle: `الفلوس · ${item.category}`, archivedAt: dateValue(item.archivedAt), payload: { id: item.id, title: item.title, amount: Math.max(0, item.amount), kind: item.kind === 'income' ? 'income' : 'expense', category: item.category, localDate: item.localDate, note: item.note ?? undefined, projectId: item.projectId ?? undefined, goalId: item.goalId ?? undefined, recurrence: item.recurrence === 'weekly' || item.recurrence === 'monthly' ? item.recurrence : 'none' } })),
      ...reminders.map((item) => ({ id: item.id, kind: 'reminder' as const, title: item.title, subtitle: `التذكيرات · ${item.dueAt}`, archivedAt: dateValue(item.archivedAt), payload: { id: item.id, title: item.title, kind: item.kind === 'habit' || item.kind === 'prayer' || item.kind === 'quran' || item.kind === 'finance' ? item.kind : 'task', dueAt: item.dueAt, status: item.status === 'done' || item.status === 'snoozed' ? item.status : 'pending', sourceId: item.sourceId ?? undefined, repeatLabel: item.repeatLabel ?? undefined } })),
      ...journals.map((item) => ({ id: item.id, kind: 'journal' as const, title: item.title, subtitle: `اليوميات · ${item.localDate}`, archivedAt: dateValue(item.archivedAt), payload: { id: item.id, localDate: item.localDate, title: item.title, body: item.body, mood: ['سعيد', 'هادئ', 'محايد', 'متعب', 'متوتر'].includes(item.mood) ? item.mood : 'محايد', createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() } })),
      ...entertainment.map((item) => ({ id: item.id, kind: 'entertainment' as const, title: item.title, subtitle: `الترفيه · ${item.type === 'series' ? 'مسلسل' : 'فيلم'}`, archivedAt: dateValue(item.archivedAt), payload: { id: item.id, title: item.title, type: item.type === 'series' ? 'series' : 'movie', genre: item.genre, year: item.year ?? undefined, note: item.note ?? undefined, status: item.status === 'watching' ? 'watching' : item.status === 'done' ? 'completed' : 'want', rating: item.rating ?? undefined, impression: item.impression ?? undefined, recommend: item.recommend, downloadWanted: item.downloadWanted, createdAt: item.createdAt.toISOString() } })),
      ...clients.map((item) => ({ id: item.id, kind: 'client' as const, title: item.name, subtitle: `العملاء · ${item.company ?? 'بدون شركة'}`, archivedAt: dateValue(item.archivedAt), payload: { id: item.id, workspaceId: item.workspaceId, name: item.name, company: item.company, email: item.email, phone: item.phone, notes: item.notes, archivedAt: dateValue(item.archivedAt) } })),
    ]

    return json({ items: items.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt)).slice(0, 500) })
  } catch {
    return backendUnavailable()
  }
}
