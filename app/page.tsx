import { CalendarCheck2, ListPlus } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { StatCards } from '@/components/dashboard/stat-cards'
import { TodayTasksPanel } from '@/components/dashboard/today-tasks-panel'
import { PrayerProgress } from '@/components/dashboard/prayer-progress'
import { TaskStatusDonut } from '@/components/dashboard/task-status-donut'
import { WeeklyTrend } from '@/components/dashboard/weekly-trend'
import { NotesAndReminderPanel } from '@/components/dashboard/notes-and-reminder-panel'

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      <TopNav />

      {/* Welcome row */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-medium tracking-tight text-balance">أهلاً بيك يا كابتن!</h1>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground">
            <CalendarCheck2 className="h-3.5 w-3.5" />
            مراجعة الأسبوع
          </button>
          <button className="flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-xs font-medium">
            <ListPlus className="h-3.5 w-3.5" />
            إضافة مهمة
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-5">
        <StatCards />
      </div>

      {/* Main grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="flex-1">
            <TodayTasksPanel />
          </div>
          <PrayerProgress />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-6">
          <div className="flex-1">
            <TaskStatusDonut />
          </div>
          <WeeklyTrend />
        </div>

        <div className="lg:col-span-3">
          <NotesAndReminderPanel />
        </div>
      </div>
    </main>
  )
}
