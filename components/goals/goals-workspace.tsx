'use client'

import { Archive, CalendarDays, Plus, Target } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { useCommandCenter, type Goal, type GoalHorizon } from '@/lib/command-center-store'

const horizonLabels: Record<GoalHorizon, string> = {
  quarter: 'هذا الربع',
  year: 'هذه السنة',
  someday: 'لاحقًا',
}

export function GoalsWorkspace() {
  const { goals, projects, addGoal, updateGoal, archiveGoal } = useCommandCenter()

  function createGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    if (!title) return
    addGoal({
      title,
      description: String(form.get('description') ?? '').trim(),
      horizon: String(form.get('horizon') ?? 'quarter') as GoalHorizon,
      targetLabel: String(form.get('targetLabel') ?? '').trim() || 'بدون موعد محدد',
    })
    event.currentTarget.reset()
  }

  return <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ContentCard className="lg:col-span-8" title="أهدافي الحالية" description="خلّي الصورة الكبيرة واضحة، وسيب المشاريع تحمل التنفيذ اليومي.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {goals.map((goal) => <GoalCard key={goal.id} goal={goal} projectCount={projects.filter((project) => project.goalId === goal.id).length} onPause={() => updateGoal(goal.id, { status: goal.status === 'paused' ? 'active' : 'paused' })} onArchive={() => archiveGoal(goal.id)} />)}
          {goals.length === 0 && <div className="rounded-2xl bg-muted px-4 py-12 text-center text-sm text-muted-foreground md:col-span-2">مفيش أهداف مضافة لسه. ابدأ بهدف واحد واضح.</div>}
        </div>
      </ContentCard>

      <ContentCard title="هدف جديد" description="اختار نتيجة قابلة للفهم، مش مجرد قائمة أمنيات.">
        <form onSubmit={createGoal} className="space-y-3">
          <input name="title" className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="مثال: إطلاق النسخة الأولى" />
          <textarea name="description" className="min-h-20 w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="ليه الهدف ده مهم؟" />
          <div className="grid grid-cols-2 gap-2">
            <select name="horizon" defaultValue="quarter" className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="quarter">هذا الربع</option>
              <option value="year">هذه السنة</option>
              <option value="someday">لاحقًا</option>
            </select>
            <input name="targetLabel" className="rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="موعد تقريبي" />
          </div>
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> إضافة الهدف</button>
        </form>
      </ContentCard>
    </div>

    <ContentCard title="قراءة سريعة" description="الأهداف لا تتحرك وحدها؛ راجع عدد المشاريع التي تحمل كل هدف.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat label="أهداف نشطة" value={goals.filter((goal) => goal.status === 'active').length} />
        <MiniStat label="مشاريع مرتبطة" value={projects.filter((project) => project.goalId).length} />
        <MiniStat label="متوسط التقدم" value={`${goals.length ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0}%`} />
      </div>
    </ContentCard>
  </div>
}

function GoalCard({ goal, projectCount, onPause, onArchive }: { goal: Goal; projectCount: number; onPause: () => void; onArchive: () => void }) {
  const isPaused = goal.status === 'paused'
  return <article className={`rounded-2xl border bg-muted/40 p-4 ${isPaused ? 'border-warning/60' : 'border-border'}`}>
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Target className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1"><h3 className="font-semibold">{goal.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{goal.description || 'بدون وصف إضافي'}</p></div>
      <button type="button" onClick={onArchive} aria-label="أرشفة الهدف" className="rounded-full p-2 text-muted-foreground hover:bg-warning"><Archive className="h-4 w-4" /></button>
    </div>
    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{horizonLabels[goal.horizon]}</span><span>{projectCount} مشاريع</span></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${goal.progress}%` }} /></div>
    <div className="mt-2 flex items-center justify-between text-xs"><span className="font-semibold">{goal.progress}%</span><button type="button" onClick={onPause} className="rounded-full px-2 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground">{isPaused ? 'استئناف' : 'إيقاف مؤقت'}</button><span className="text-muted-foreground">{goal.targetLabel}</span></div>
  </article>
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div className="flex items-center justify-between rounded-2xl bg-muted px-3 py-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>
}
