'use client'

import { Maximize2 } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { statCards } from '@/lib/mock-data'

function ExpandIcon({ dark = false }: { dark?: boolean }) {
  return (
    <button
      aria-label="توسيع"
      className={`flex h-6 w-6 items-center justify-center ${dark ? 'text-surface-dark-foreground/70' : 'text-muted-foreground'}`}
    >
      <Maximize2 className="h-3.5 w-3.5" />
    </button>
  )
}

function StatCard({
  title,
  value,
  total,
  badge,
  badgeTone,
  footer,
}: {
  title: string
  value: string | number
  total: string | number
  badge: string
  badgeTone: 'positive' | 'warning'
  footer: string
}) {
  return (
    <div className="flex flex-col justify-between rounded-3xl bg-card p-5">
      <div className="flex items-start justify-between">
        <h2 className="text-base font-medium">{title}</h2>
        <ExpandIcon />
      </div>
      <div className="mt-4">
        <div className="flex items-end gap-1">
          <span className="text-5xl font-semibold tracking-tight">{value}</span>
          <span className="pb-1 text-lg font-medium text-muted-foreground">/{total}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              badgeTone === 'positive' ? 'bg-positive text-positive-foreground' : 'bg-warning text-warning-foreground'
            }`}
          >
            {badge}
          </span>
          <span className="text-[10px] text-muted-foreground">{footer}</span>
        </div>
      </div>
    </div>
  )
}

export function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="مهام النهاردة"
        value={statCards.tasks.value}
        total={statCards.tasks.total}
        badge={statCards.tasks.trend}
        badgeTone="positive"
        footer={statCards.tasks.footer}
      />
      <StatCard
        title="الصلوات"
        value={statCards.prayers.value}
        total={statCards.prayers.total}
        badge={statCards.prayers.trend}
        badgeTone="positive"
        footer={statCards.prayers.footer}
      />
      <StatCard
        title="العادات"
        value={statCards.habits.value}
        total={statCards.habits.total}
        badge={statCards.habits.trend}
        badgeTone="positive"
        footer={statCards.habits.footer}
      />

      {/* Spending dark card */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-surface-dark p-5 text-surface-dark-foreground">
        <div className="flex items-start justify-between">
          <h2 className="text-base font-medium">مصاريف الأسبوع</h2>
          <ExpandIcon dark />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-6 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={statCards.spendingWeek} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2e6bf6" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#2e6bf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="#4d82ff"
                strokeWidth={1.5}
                fill="url(#spendingFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="relative mt-4">
          <span className="text-5xl font-semibold tracking-tight">{statCards.spendingTotal}</span>
          <span className="mr-1 text-lg font-medium text-surface-dark-foreground/60">ج.م</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-positive px-2 py-0.5 text-[10px] font-semibold text-positive-foreground">
              {statCards.spendingTrend}
            </span>
            <span className="text-[10px] text-surface-dark-foreground/60">مقارنة بالأسبوع اللي فات</span>
          </div>
        </div>
      </div>
    </div>
  )
}
