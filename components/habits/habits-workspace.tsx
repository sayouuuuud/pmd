'use client'

import { Check, Flame, Plus, Repeat, Sparkles } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { useCommandCenter } from '@/lib/command-center-store'

export function HabitsWorkspace() {
  const { habits, toggleHabit } = useCommandCenter()
  const completed = habits.filter((habit) => habit.doneToday).length
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
    <ContentCard className="lg:col-span-8" title="عادات النهاردة" description={`${completed} من ${habits.length} عادات مكتملة`} action={<button type="button" className="flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="h-3.5 w-3.5" /> عادة جديدة</button>}>
      <div className="grid gap-3 sm:grid-cols-2">{habits.map((habit) => <button key={habit.id} type="button" onClick={() => toggleHabit(habit.id)} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/60 p-4 text-right transition-all hover:-translate-y-0.5 hover:bg-card"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${habit.doneToday ? 'bg-positive text-positive-foreground' : 'bg-card text-muted-foreground'}`}>{habit.doneToday ? <Check className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}</span><span className="min-w-0 flex-1"><span className={`block text-sm font-semibold ${habit.doneToday ? 'text-muted-foreground line-through' : ''}`}>{habit.title}</span><span className="mt-1 block text-xs text-muted-foreground">هدف اليوم: {habit.target}</span></span><span className="flex items-center gap-1 text-xs font-semibold text-warning-foreground"><Flame className="h-4 w-4" />{habit.streak}</span></button>)}</div>
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-accent p-4"><Sparkles className="h-5 w-5 text-accent-foreground" /><p className="text-xs leading-6 text-accent-foreground">العادة لا تحتاج يومًا مثاليًا؛ فقط ارجع للمسار في الخطوة التالية.</p></div>
    </ContentCard>
    <ContentCard className="lg:col-span-4" title="استمراريتك" description="الصورة الأكبر للأسبوع"><div className="flex items-end gap-3"><span className="text-5xl font-semibold">{Math.round((completed / Math.max(habits.length, 1)) * 100)}%</span><span className="mb-2 text-xs text-muted-foreground">إنجاز اليوم</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completed / Math.max(habits.length, 1)) * 100}%` }} /></div><div className="mt-5 grid grid-cols-7 gap-1.5">{['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map((day, index) => <div key={day} className="text-center"><span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[10px] ${index < 5 ? 'bg-positive text-positive-foreground' : 'bg-muted text-muted-foreground'}`}>{index < 5 ? <Check className="h-3 w-3" /> : day}</span><span className="mt-1 block text-[10px] text-muted-foreground">{day}</span></div>)}</div></ContentCard>
  </div>
}
