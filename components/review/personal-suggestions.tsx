'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Lightbulb, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { Textarea } from '@/components/ui/textarea'
import { useCommandCenter } from '@/lib/command-center-store'
import { contextHref } from '@/lib/context-links'

export type PersonalSuggestionStatus = 'pending' | 'accepted' | 'rejected'

type PersonalSuggestion = {
  id: string
  title: string
  reason: string
  kind: 'task' | 'habit' | 'project' | 'reminder' | 'finance'
  href: string
  status: PersonalSuggestionStatus
  decisionReason?: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'personal-command-center-suggestions-v1'

function readSuggestions(): PersonalSuggestion[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is PersonalSuggestion => Boolean(item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.status === 'string')) : []
  } catch {
    return []
  }
}

function persistSuggestions(items: PersonalSuggestion[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function PersonalSuggestions() {
  const { tasks, habits, projects, reminders, financeEntries } = useCommandCenter()
  const [saved, setSaved] = useState<PersonalSuggestion[]>([])
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})

  const candidates = useMemo<Omit<PersonalSuggestion, 'status' | 'decisionReason' | 'createdAt' | 'updatedAt'>[]>(() => {
    const openTask = tasks.find((task) => task.status !== 'done')
    const pendingHabit = habits.find((habit) => !habit.doneToday)
    const activeProject = projects.find((project) => project.status !== 'done')
    const pendingReminder = reminders.find((reminder) => reminder.status !== 'done')
    const pendingIncome = financeEntries.find((entry) => entry.kind === 'income' && entry.amount > 0)
    return [
      openTask ? { id: `task-focus-${openTask.id}`, title: `ابدأ بمهمة «${openTask.title}»`, reason: 'لديك مهمة مفتوحة يمكن تحويلها إلى خطوة واضحة اليوم.', kind: 'task' as const, href: contextHref('task', openTask.id) } : null,
      pendingHabit ? { id: `habit-focus-${pendingHabit.id}`, title: `سجّل عادة «${pendingHabit.title}»`, reason: 'هناك عادة لم تُسجّل بعد اليوم ويمكن إغلاقها بخطوة قصيرة.', kind: 'habit' as const, href: contextHref('habit', pendingHabit.id) } : null,
      activeProject ? { id: `project-next-${activeProject.id}`, title: activeProject.nextStep?.trim() || `حدد الخطوة التالية لـ«${activeProject.title}»`, reason: activeProject.nextStep?.trim() ? 'الخطوة التالية مرتبطة بمشروع نشط ويمكن متابعتها من شاشة المشروع.' : 'المشروع النشط يحتاج خطوة تالية صريحة حتى لا يبقى مفتوحًا بلا اتجاه.', kind: 'project' as const, href: contextHref('project', activeProject.id) } : null,
      pendingReminder ? { id: `reminder-follow-${pendingReminder.id}`, title: `راجع تذكير «${pendingReminder.title}»`, reason: 'يوجد تذكير غير مكتمل يحتاج إتمامًا أو تأجيلًا واعيًا.', kind: 'reminder' as const, href: `/reminders#reminder-${pendingReminder.id}` } : null,
      pendingIncome ? { id: `finance-follow-${pendingIncome.id}`, title: `تحقق من دفعة «${pendingIncome.title}»`, reason: 'يوجد دخل مسجل يمكن ربطه بسياق المشروع أو مراجعته ماليًا.', kind: 'finance' as const, href: `/money#finance-${pendingIncome.id}` } : null,
    ].filter((item): item is Omit<PersonalSuggestion, 'status' | 'decisionReason' | 'createdAt' | 'updatedAt'> => Boolean(item))
  }, [financeEntries, habits, projects, reminders, tasks])

  useEffect(() => {
    const existing = readSuggestions()
    const now = new Date().toISOString()
    const byId = new Map(existing.map((item) => [item.id, item]))
    for (const candidate of candidates) {
      const previous = byId.get(candidate.id)
      byId.set(candidate.id, previous ? { ...previous, ...candidate, updatedAt: now } : { ...candidate, status: 'pending', createdAt: now, updatedAt: now })
    }
    const next = [...byId.values()].filter((item) => candidates.some((candidate) => candidate.id === item.id) || item.status !== 'pending')
    setSaved(next)
    persistSuggestions(next)
  }, [candidates])

  function decide(id: string, status: Exclude<PersonalSuggestionStatus, 'pending'>) {
    const now = new Date().toISOString()
    const reason = rejectionReasons[id]?.trim()
    if (status === 'rejected' && !reason) return
    setSaved((current) => {
      const next = current.map((item) => item.id === id ? { ...item, status, decisionReason: reason || undefined, updatedAt: now } : item)
      persistSuggestions(next)
      return next
    })
  }

  const pending = saved.filter((item) => item.status === 'pending')
  const decided = saved.filter((item) => item.status !== 'pending')

  return (
    <ContentCard className="lg:col-span-12" title="اقتراحات شخصية قابلة للقرار" description="اقتراحات مشتقة من بياناتك المحلية فقط؛ اقبلها أو ارفضها مع سبب واضح، ويمكنك مراجعتها لاحقًا.">
      {pending.length === 0 ? (
        <p className="rounded-2xl bg-muted/70 px-4 py-3 text-sm text-muted-foreground">لا توجد اقتراحات معلقة الآن. ستظهر اقتراحات جديدة عندما يتغير سياق مهامك أو عاداتك أو مشاريعك.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pending.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Lightbulb className="size-4" aria-hidden="true" /></span>
                <div className="min-w-0 flex-1"><h3 className="font-semibold text-foreground">{item.title}</h3><p className="mt-1 text-xs leading-6 text-muted-foreground">{item.reason}</p></div>
              </div>
              <a href={item.href} className="mt-3 inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline">فتح السياق المرتبط</a>
              <Textarea value={rejectionReasons[item.id] ?? ''} onChange={(event) => setRejectionReasons((current) => ({ ...current, [item.id]: event.target.value }))} className="mt-3 min-h-16" placeholder="سبب الرفض مطلوب فقط إذا اخترت رفض الاقتراح" aria-label={`سبب قرار الاقتراح: ${item.title}`} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => decide(item.id, 'accepted')}><Check className="size-4" aria-hidden="true" />قبول</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => decide(item.id, 'rejected')}><X className="size-4" aria-hidden="true" />رفض مع سبب</Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {decided.length > 0 && <div className="mt-4 border-t border-border/70 pt-4"><p className="text-xs font-semibold text-muted-foreground">سجل القرارات</p><div className="mt-2 space-y-2">{decided.slice(-5).reverse().map((item) => <div key={item.id} className="rounded-xl bg-muted/50 px-3 py-2 text-xs"><span className="font-semibold">{item.status === 'accepted' ? 'مقبول' : 'مرفوض'}:</span> {item.title}{item.decisionReason ? ` · السبب: ${item.decisionReason}` : ''}</div>)}</div></div>}
    </ContentCard>
  )
}
