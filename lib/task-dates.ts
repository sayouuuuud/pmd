export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export type TaskDateLike = {
  dueAt?: string
  dueLabel?: string
  timezone?: string
  recurrence?: TaskRecurrence
  status?: string
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function legacyLabelToDueAt(label: string, now = new Date()) {
  const date = new Date(now)
  date.setHours(9, 0, 0, 0)
  if (label === 'بكرة') date.setDate(date.getDate() + 1)
  else if (label === 'هذا الأسبوع' || label === 'الأسبوع ده') date.setDate(date.getDate() + 7)
  else if (label === 'بعدين' || label === 'بدون موعد') return undefined
  return date.toISOString()
}

export function taskDueAt(task: TaskDateLike) {
  return task.dueAt ?? legacyLabelToDueAt(task.dueLabel ?? '')
}

export function isTaskOverdue(task: TaskDateLike, now = new Date()) {
  const dueAt = taskDueAt(task)
  return Boolean(dueAt && task.status !== 'done' && new Date(dueAt).getTime() < now.getTime())
}

export function isTaskDueToday(task: TaskDateLike, now = new Date()) {
  const dueAt = taskDueAt(task)
  return Boolean(dueAt && localDateKey(new Date(dueAt)) === localDateKey(now))
}

export function formatTaskDue(task: TaskDateLike) {
  const dueAt = taskDueAt(task)
  if (!dueAt) return task.dueLabel || 'بدون موعد'
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(dueAt))
}

export function combineLocalDateTime(date: string, time = '09:00') {
  if (!date) return undefined
  const value = new Date(`${date}T${time || '09:00'}:00`)
  return Number.isNaN(value.getTime()) ? undefined : value.toISOString()
}

export function nextRecurringDueAt(dueAt: string, recurrence: TaskRecurrence) {
  if (recurrence === 'none') return undefined
  const next = new Date(dueAt)
  if (recurrence === 'daily') next.setDate(next.getDate() + 1)
  if (recurrence === 'weekly') next.setDate(next.getDate() + 7)
  if (recurrence === 'monthly') next.setMonth(next.getMonth() + 1)
  return next.toISOString()
}

export function recurrenceLabel(recurrence: TaskRecurrence | undefined) {
  return recurrence === 'daily' ? 'يومية' : recurrence === 'weekly' ? 'أسبوعية' : recurrence === 'monthly' ? 'شهرية' : 'بدون تكرار'
}
