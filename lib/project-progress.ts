import type { Project, Task } from './command-center-store'

export function calculateProjectProgress(project: Project, tasks: Task[]) {
  const projectTasks = tasks.filter((task) => task.projectId === project.id)
  const milestones = project.milestones ?? []
  const total = projectTasks.length + milestones.length
  if (total === 0) return Math.max(0, Math.min(100, Math.round(project.progress)))
  const completed = projectTasks.filter((task) => task.status === 'done').length
    + milestones.filter((milestone) => milestone.status === 'done').length
  return Math.round((completed / total) * 100)
}

export function withDerivedProjectProgress(projects: Project[], tasks: Task[]) {
  return projects.map((project) => ({ ...project, progress: calculateProjectProgress(project, tasks) }))
}
