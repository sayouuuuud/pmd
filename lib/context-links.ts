export type ContextLinkKind = 'task' | 'habit' | 'project' | 'goal' | 'prayer' | 'quran' | 'finance'

const contextPaths: Record<ContextLinkKind, string> = {
  task: '/tasks',
  habit: '/habits',
  project: '/projects',
  goal: '/goals',
  prayer: '/religious',
  quran: '/religious',
  finance: '/money',
}

const contextAnchors: Record<Exclude<ContextLinkKind, 'prayer' | 'quran' | 'finance'>, (id: string) => string> = {
  task: (id) => `task-${id}`,
  habit: (id) => id,
  project: (id) => id,
  goal: (id) => id,
}

export function contextHref(kind: ContextLinkKind, id?: string) {
  const path = contextPaths[kind]
  if (!id) return path
  const anchor = kind === 'prayer' ? 'prayer-tracker' : kind === 'quran' ? 'quran-progress' : kind === 'finance' ? id : contextAnchors[kind](id)
  return `${path}#${anchor}`
}
