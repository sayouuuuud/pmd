'use client'

import { Maximize2, Pin } from 'lucide-react'
import { pinnedNotes, dailyReminder, habitsToday } from '@/lib/mock-data'

export function NotesAndReminderPanel() {
  return (
    <div className="flex h-full flex-col rounded-3xl bg-card p-5">
      <div className="flex items-start justify-between">
        <h2 className="text-base font-medium">ملاحظات مثبتة</h2>
        <button aria-label="توسيع" className="flex h-6 w-6 items-center justify-center text-muted-foreground">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <ul className="mt-3 space-y-2.5">
        {pinnedNotes.map((note) => (
          <li key={note.id} className="rounded-2xl bg-muted p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{note.title}</p>
              <Pin className="h-3 w-3 shrink-0 text-primary" />
            </div>
            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{note.excerpt}</p>
            <span className="mt-1.5 inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
              {note.tag}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">عادات النهاردة</p>
        <ul className="space-y-1.5">
          {habitsToday.map((habit) => (
            <li key={habit.label} className="flex items-center gap-2 text-xs">
              <span
                className={`h-1.5 w-1.5 rounded-full ${habit.done ? 'bg-[#4caf6e]' : 'bg-border'}`}
              />
              <span className={habit.done ? 'text-foreground/70' : 'text-muted-foreground'}>{habit.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Daily reminder gradient card */}
      <div className="mt-4 flex-1 rounded-2xl bg-gradient-to-b from-[#4d82ff] to-[#2e6bf6] p-4 text-card">
        <p className="text-[10px] font-medium text-card/70">تذكرة اليوم</p>
        <p className="mt-2 text-center font-sans text-base font-semibold leading-relaxed">
          {dailyReminder.arabic}
        </p>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-card/80">{dailyReminder.translation}</p>
        <p className="mt-2 text-center text-[10px] text-card/60">{dailyReminder.source}</p>
      </div>
    </div>
  )
}
