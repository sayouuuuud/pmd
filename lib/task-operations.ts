export type TaskLike = {
  id: string
  status: 'todo' | 'in-progress' | 'done'
  dependencyIds?: string[]
}

export type BulkTaskAction =
  | { type: 'status'; status: TaskLike['status'] }
  | { type: 'archive' }

export function sanitizeDependencyIds(taskId: string, dependencyIds: string[], tasks: TaskLike[]) {
  const existing = new Set(tasks.map((task) => task.id))
  return Array.from(new Set(dependencyIds)).filter((id) => id !== taskId && existing.has(id))
}

export function hasDependencyCycle(taskId: string, dependencyIds: string[], tasks: TaskLike[]) {
  const graph = new Map(tasks.map((task) => [task.id, task.id === taskId ? dependencyIds : task.dependencyIds ?? []]))
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(id: string): boolean {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    for (const dependencyId of graph.get(id) ?? []) {
      if (visit(dependencyId)) return true
    }
    visiting.delete(id)
    visited.add(id)
    return false
  }

  return visit(taskId)
}

export function getBlockingTasks(task: TaskLike, tasks: TaskLike[]) {
  const byId = new Map(tasks.map((item) => [item.id, item]))
  return (task.dependencyIds ?? [])
    .map((id) => byId.get(id))
    .filter((item): item is TaskLike => Boolean(item && item.status !== 'done'))
}

export function isTaskBlocked(task: TaskLike, tasks: TaskLike[]) {
  return task.status !== 'done' && getBlockingTasks(task, tasks).length > 0
}

export function applyBulkTaskAction<T extends TaskLike>(tasks: T[], selectedIds: string[], action: BulkTaskAction) {
  const selected = new Set(selectedIds)
  if (action.type === 'archive') return tasks.filter((task) => !selected.has(task.id))
  return tasks.map((task) => selected.has(task.id) ? { ...task, status: action.status } : task)
}
