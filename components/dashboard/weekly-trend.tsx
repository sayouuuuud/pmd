'use client'

import { Maximize2 } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { weeklyTrendData } from '@/lib/mock-data'

export function WeeklyTrend() {
  return (
    <div className="flex shrink-0 flex-col rounded-3xl bg-card p-5">
      <div className="flex items-start justify-between">
        <h2 className="text-base font-medium">نظرة على الأسبوع</h2>
        <button aria-label="توسيع" className="flex h-6 w-6 items-center justify-center text-muted-foreground">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weeklyTrendData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid vertical horizontal={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#8b8b93' }}
              dy={6}
            />
            <YAxis hide domain={[0, 10]} />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#f5b93e"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="habits"
              stroke="#6cc24a"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="tasks"
              stroke="#2e6bf6"
              strokeWidth={2}
              dot={{ r: 3, fill: '#ffffff', stroke: '#2e6bf6', strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" />
          مهام
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#6cc24a]" />
          عادات
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#f5b93e]" />
          مزاج
        </span>
      </div>
    </div>
  )
}
