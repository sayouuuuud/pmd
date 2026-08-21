import { describe, expect, it } from 'vitest'
import { combineLocalDateTime, formatTaskDue, isTaskDueToday, isTaskOverdue, localDateKey, nextRecurringDueAt } from './task-dates'

describe('task dates', () => {
  it('builds a valid ISO due date from local date and time', () => {
    const value = combineLocalDateTime('2026-08-21', '14:30')
    expect(value).toBeTruthy()
    expect(new Date(value!).getHours()).toBe(14)
  })

  it('detects overdue open tasks but not completed tasks', () => {
    const now = new Date('2026-08-21T12:00:00.000Z')
    expect(isTaskOverdue({ dueAt: '2026-08-20T12:00:00.000Z', status: 'todo' }, now)).toBe(true)
    expect(isTaskOverdue({ dueAt: '2026-08-20T12:00:00.000Z', status: 'done' }, now)).toBe(false)
  })

  it('detects tasks due on the same local day', () => {
    const now = new Date(2026, 7, 21, 12)
    expect(isTaskDueToday({ dueAt: new Date(2026, 7, 21, 18).toISOString() }, now)).toBe(true)
    expect(localDateKey(now)).toBe('2026-08-21')
  })

  it('calculates daily, weekly, and monthly recurrence', () => {
    const start = '2026-08-21T09:00:00.000Z'
    expect(nextRecurringDueAt(start, 'daily')).toBe('2026-08-22T09:00:00.000Z')
    expect(nextRecurringDueAt(start, 'weekly')).toBe('2026-08-28T09:00:00.000Z')
    expect(nextRecurringDueAt(start, 'monthly')).toBe('2026-09-21T09:00:00.000Z')
  })

  it('keeps legacy labels readable', () => {
    expect(formatTaskDue({ dueLabel: 'بدون موعد' })).toBe('بدون موعد')
  })
})
