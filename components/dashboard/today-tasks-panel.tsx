'use client'

import { Maximize2 } from 'lucide-react'
import { todayTasks } from '@/lib/mock-data'

const priorityColor: Record<string, string> = {
  high: 'bg-[#e05b5b]',
  medium: 'bg-primary',
  low: 'bg-[#8b7ff0]',
}

export function TodayTasksPanel() {
  const remaining = todayTasks.filter((t) => !t.done).length

  return (
    <div className="flex h-full flex-col rounded-3xl bg-card p-5">
      <div className="flex items-start justify-between">
        <h2 className="text-base font-medium">مهام النهاردة</h2>
        <button aria-label="توسيع" className="flex h-6 w-6 items-center justify-center text-muted-foreground">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <ul className="mt-4 flex-1 space-y-2.5">
        {todayTasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2.5">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                task.done ? 'border-primary bg-primary' : 'border-border bg-transparent'
              }`}
            >
              {task.done && <span className="h-2 w-2 rounded-full bg-card" />}
            </span>
            <span
              className={`flex-1 text-sm ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}
            >
              {task.title}
            </span>
            <span className={`h-2 w-2 shrink-0 rounded-full ${priorityColor[task.priority]}`} />
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted px-3.5 py-2.5 text-xs">
        <span className="text-muted-foreground">باقي {remaining} مهام</span>
        <span className="font-semibold text-primary">{todayTasks.length - remaining}/{todayTasks.length}</span>
      </div>
    </div>
  )
}
