import { describe, expect, it } from 'vitest'
import { applyBulkTaskAction, getBlockingTasks, hasDependencyCycle, sanitizeDependencyIds } from './task-operations'

const tasks = [
  { id: 'a', status: 'todo' as const },
  { id: 'b', status: 'in-progress' as const, dependencyIds: ['a'] },
  { id: 'c', status: 'done' as const, dependencyIds: ['b'] },
]

describe('task dependencies', () => {
  it('removes self, duplicate, and missing references', () => {
    expect(sanitizeDependencyIds('b', ['a', 'a', 'b', 'missing'], tasks)).toEqual(['a'])
  })

  it('detects cycles before saving dependencies', () => {
    expect(hasDependencyCycle('a', ['b'], tasks)).toBe(true)
    expect(hasDependencyCycle('c', ['a'], tasks)).toBe(false)
  })

  it('returns unfinished blockers only', () => {
    expect(getBlockingTasks(tasks[1], tasks).map((task) => task.id)).toEqual(['a'])
    expect(getBlockingTasks({ ...tasks[1], dependencyIds: ['c'] }, tasks)).toEqual([])
  })
})

describe('bulk task actions', () => {
  it('updates selected tasks without changing the rest', () => {
    const result = applyBulkTaskAction(tasks, ['a', 'b'], { type: 'status', status: 'done' })
    expect(result.map((task) => task.status)).toEqual(['done', 'done', 'done'])
  })

  it('archives selected tasks', () => {
    expect(applyBulkTaskAction(tasks, ['b'], { type: 'archive' }).map((task) => task.id)).toEqual(['a', 'c'])
  })
})
