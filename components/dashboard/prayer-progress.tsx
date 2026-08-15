'use client'

import { Maximize2 } from 'lucide-react'
import { prayers } from '@/lib/mock-data'

export function PrayerProgress() {
  const done = prayers.filter((p) => p.status === 'ontime').length
  const total = prayers.length
  const pct = Math.round((done / total) * 100)
  const nextPrayer = prayers.find((p) => p.status === 'upcoming')

  return (
    <div className="flex shrink-0 flex-col justify-between rounded-3xl bg-card p-5">
      <div className="flex items-start justify-between">
        <h2 className="text-base font-medium">الصلوات النهاردة</h2>
        <button aria-label="توسيع" className="flex h-6 w-6 items-center justify-center text-muted-foreground">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[11px] font-medium text-muted-foreground">
          <span>{pct}%</span>
          <span>{100 - pct}%</span>
        </div>
        <div className="flex h-10 w-full gap-1.5" role="img" aria-label={`${pct}% صلوات في وقتها`}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #7ea9ff 0%, #2e6bf6 100%)',
            }}
          />
          <div
            className="h-full flex-1 rounded-2xl"
            style={{
              background: 'repeating-linear-gradient(45deg, #d8d8de 0 4px, transparent 4px 9px)',
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-5 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[4px] bg-primary" />
          في وقتها <span className="font-semibold">{done}</span>
        </span>
        {nextPrayer && (
          <span className="mr-auto rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
            الجاية: {nextPrayer.name} {nextPrayer.time}
          </span>
        )}
      </div>
    </div>
  )
}
