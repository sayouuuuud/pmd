'use client'

import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { taskStatusData } from '@/lib/mock-data'

const tabs = ['الكل', 'شغل', 'شخصي']

export function TaskStatusDonut() {
  const [activeTab, setActiveTab] = useState('الكل')
  const total = taskStatusData.reduce((sum, s) => sum + s.value, 0)

  return (
    <div className="flex h-full flex-col rounded-3xl bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-medium">حالة المهام</h2>
        <div className="flex items-center gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                tab === activeTab
                  ? 'rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-card'
                  : 'rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-foreground/70'
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-1 flex-col items-center gap-6 sm:flex-row">
        {/* Donut */}
        <div className="relative h-60 w-60 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={taskStatusData}
                dataKey="value"
                innerRadius={72}
                outerRadius={112}
                paddingAngle={2}
                cornerRadius={6}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive={false}
              >
                {taskStatusData.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-accent">
              <span className="text-4xl font-semibold tracking-tight">{total}</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <ul className="w-full flex-1 space-y-2.5">
          {taskStatusData.map((s) => (
            <li key={s.name} className="flex items-center gap-2.5 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-foreground/80">{s.name}</span>
              <span className="mr-auto font-semibold">{s.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
