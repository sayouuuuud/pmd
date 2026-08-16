'use client'

import Link from 'next/link'
import { Check, Clock3, FolderKanban, Moon, Pause, Play, Repeat, Sparkles, Target } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { useCommandCenter } from '@/lib/command-center-store'

export function DailyPlanWorkspace() {
  const { planItems, tasks, projects, goals, togglePlanItem, snoozePlanItem } = useCommandCenter()
  const completed = planItems.filter((item) => item.status === 'done').length

  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
    <ContentCard className="lg:col-span-8" title="Timeline اليوم" description="خطة مرنة، وليست جدولًا يعاقبك إذا تغيّر يومك. كل مهمة تقودك إلى سياقها عندما يكون متاحًا.">
      <div className="space-y-2">
        {planItems.length === 0 ? <EmptyState icon={Sparkles} title="خطة اليوم جاهزة للإضافة" description="لا توجد عناصر مجدولة الآن. ابدأ بمهمة واحدة أو عادة صغيرة، وستظهر هنا كسطر قابل للتعديل." action={<Link href="/tasks" className="inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">أضف أول مهمة</Link>} /> : planItems.map((item) => <div key={item.id} className={`rounded-2xl border px-3 py-3 transition-colors ${item.status === 'done' ? 'border-positive bg-positive/40' : item.status === 'snoozed' ? 'border-border bg-muted/50 opacity-60' : 'border-border/70 bg-card'}`}>
          <div className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs font-semibold text-muted-foreground">{item.time}</span>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.status === 'done' ? 'bg-positive text-positive-foreground' : 'bg-accent text-accent-foreground'}`}><PlanKindIcon kind={item.kind} /></span>
            <button type="button" onClick={() => togglePlanItem(item.id)} className={`flex-1 text-right text-sm font-medium ${item.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>{item.title}</button>
            {item.status !== 'done' && item.status !== 'snoozed' && <button type="button" aria-label="تأجيل" onClick={() => snoozePlanItem(item.id)} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><Pause className="h-4 w-4" /></button>}
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${item.status === 'done' ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{item.status === 'done' && <Check className="h-3.5 w-3.5" />}</span>
          </div>
          <PlanContext item={item} tasks={tasks} projects={projects} goals={goals} />
        </div>)}
      </div>
    </ContentCard>
    <div className="space-y-4 lg:col-span-4">
      <ContentCard title="تقدم اليوم" description="المهم هو الرجوع للخطة">
        <div className="flex items-end gap-3"><span className="text-5xl font-semibold">{Math.round((completed / Math.max(planItems.length, 1)) * 100)}%</span><span className="mb-2 text-xs text-muted-foreground">من الخطة</span></div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completed / Math.max(planItems.length, 1)) * 100}%` }} /></div>
        <p className="mt-3 text-xs text-muted-foreground">{completed} عناصر مكتملة من {planItems.length}</p>
      </ContentCard>
      <ContentCard className="bg-surface-dark text-surface-dark-foreground" title="تركيز الفترة الحالية" description="اقتراح قابل للتعديل">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary"><Play className="h-4 w-4 fill-current text-primary-foreground" /></span><div><p className="text-sm font-semibold">{planItems.find((item) => item.status === 'pending')?.title ?? 'وقت مفتوح'}</p><p className="mt-1 text-xs text-surface-dark-foreground/60">ابدأ بـ 25 دقيقة فقط</p></div></div>
        <div className="mt-5 flex items-center gap-2 text-xs text-surface-dark-foreground/60"><Sparkles className="h-4 w-4" /> لا تغيّر موعدك تلقائيًا</div>
      </ContentCard>
    </div>
  </div>
}

function PlanContext({ item, tasks, projects, goals }: { item: { kind: string; sourceId?: string }; tasks: { id: string; projectId?: string }[]; projects: { id: string; title: string; goalId?: string }[]; goals: { id: string; title: string }[] }) {
  if (item.kind !== 'task' || !item.sourceId) return null
  const task = tasks.find((candidate) => candidate.id === item.sourceId)
  const project = task?.projectId ? projects.find((candidate) => candidate.id === task.projectId) : undefined
  const goal = project?.goalId ? goals.find((candidate) => candidate.id === project.goalId) : undefined
  if (!project && !goal) return null

  return <div className="mt-2 flex flex-wrap items-center gap-2 pr-[3.75rem] text-[11px] text-muted-foreground">
    {project && <Link href={`/projects?project=${encodeURIComponent(project.id)}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 transition-colors hover:bg-accent hover:text-accent-foreground"><FolderKanban className="h-3 w-3" /> مشروع: {project.title}</Link>}
    {goal && <Link href="/goals" className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 transition-colors hover:bg-accent hover:text-accent-foreground"><Target className="h-3 w-3" /> هدف: {goal.title}</Link>}
  </div>
}

function PlanKindIcon({ kind }: { kind: string }) {
  if (kind === 'prayer') return <Moon className="h-4 w-4" />
  if (kind === 'habit' || kind === 'quran') return <Repeat className="h-4 w-4" />
  if (kind === 'rest') return <Clock3 className="h-4 w-4" />
  return <Check className="h-4 w-4" />
}
