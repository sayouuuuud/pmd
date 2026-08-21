import { describe, expect, it } from 'vitest'
import type { Project, Task } from './command-center-store'
import { calculateProjectProgress } from './project-progress'

const project: Project = {
  id: 'project-1', title: 'Project', description: '', status: 'in-progress', progress: 15,
  dueLabel: 'لاحقًا', milestones: [{ id: 'm1', title: 'Milestone', status: 'done' }],
}

const task = (id: string, status: Task['status']): Task => ({
  id, title: id, priority: 'medium', status, dueLabel: 'اليوم', category: 'مشروع', projectId: project.id,
})

describe('project progress', () => {
  it('weights tasks and milestones equally', () => {
    expect(calculateProjectProgress(project, [task('t1', 'done'), task('t2', 'todo')])).toBe(67)
  })

  it('uses manual progress when there are no calculable items', () => {
    expect(calculateProjectProgress({ ...project, milestones: [] }, [])).toBe(15)
  })
})
