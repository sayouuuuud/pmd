'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronLeft, CirclePlus, Lightbulb, MoveLeft, Plus, Target, Trash2 } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { useCommandCenter } from '@/lib/command-center-store'

type BoardLane = 'ideas' | 'next' | 'doing' | 'done'
type BoardColor = 'yellow' | 'blue' | 'green' | 'pink'
type BoardNote = { id: string; title: string; body: string; lane: BoardLane; color: BoardColor; createdAt: string }

const STORAGE_KEY = 'personal-command-center-board-v1'
const lanes: { id: BoardLane; title: string; description: string }[] = [
  { id: 'ideas', title: 'أفكار', description: 'أشياء تريد ألا تنساها' },
  { id: 'next', title: 'التالي', description: 'خطوات واضحة تنتظر دورها' },
  { id: 'doing', title: 'قيد التنفيذ', description: 'ما تتحرك عليه الآن' },
  { id: 'done', title: 'تم', description: 'أشياء تستحق علامة إنجاز' },
]

const seedNotes: BoardNote[] = [
  { id: 'board-1', title: 'فكرة للمنتج', body: 'أضيف مساحة تجمع قرارات المراجعة الأسبوعية.', lane: 'ideas', color: 'yellow', createdAt: 'اليوم' },
  { id: 'board-2', title: 'جلسة تركيز', body: 'أبدأ بخطوة عميقة واحدة قبل فتح الرسائل.', lane: 'next', color: 'blue', createdAt: 'اليوم' },
  { id: 'board-3', title: 'منصة التحكم الشخصي', body: 'ربط المجالات الأساسية في لوحة واحدة.', lane: 'doing', color: 'green', createdAt: 'هذا الأسبوع' },
]

export function BoardWorkspace() {
  const { goals, projects, tasks } = useCommandCenter()
  const [notes, setNotes] = useState<BoardNote[]>(seedNotes)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [lane, setLane] = useState<BoardLane>('ideas')
  const [color, setColor] = useState<BoardColor>('yellow')
  const [showComposer, setShowComposer] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) setNotes(JSON.parse(saved) as BoardNote[])
    } catch {
      // Keep the board available when storage is unavailable or malformed.
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  const connectedCards = useMemo(() => [
    ...goals.filter((goal) => goal.status === 'active').slice(0, 2).map((goal) => ({ id: goal.id, kind: 'هدف', title: goal.title, detail: `${goal.progress}% مكتمل`, icon: Target })),
    ...projects.filter((project) => project.status !== 'done').slice(0, 2).map((project) => ({ id: project.id, kind: 'مشروع', title: project.title, detail: `${project.progress}% مكتمل`, icon: MoveLeft })),
    ...tasks.filter((task) => task.status !== 'done').slice(0, 3).map((task) => ({ id: task.id, kind: 'مهمة', title: task.title, detail: task.dueLabel, icon: Check })),
  ], [goals, projects, tasks])

  function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    setNotes((current) => [{ id: `board-${Date.now()}`, title: title.trim(), body: body.trim(), lane, color, createdAt: 'الآن' }, ...current])
    setTitle('')
    setBody('')
    setShowComposer(false)
  }

  function moveNote(id: string, nextLane: BoardLane) {
    setNotes((current) => current.map((note) => note.id === id ? { ...note, lane: nextLane } : note))
  }

  function removeNote(id: string) {
    setNotes((current) => current.filter((note) => note.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl bg-surface-dark p-5 text-surface-dark-foreground sm:flex-row sm:items-center sm:justify-between">
        <div><p className="flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-warning" /> مساحة تفكير مرنة</p><p className="mt-2 text-sm leading-7 text-surface-dark-foreground/60">حوّل الفكرة إلى خطوة، وانقلها بصريًا حتى تصبح جزءًا من يومك.</p></div>
        <button type="button" onClick={() => setShowComposer((current) => !current)} className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground"><CirclePlus className="h-4 w-4" /> أضف Sticky Note</button>
      </div>

      {showComposer && <form onSubmit={addNote} className="rounded-3xl border border-border bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-[1fr_1.4fr_160px_120px_auto] md:items-end"><label className="space-y-2"><span className="text-xs font-semibold">العنوان</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثال: فكرة للويك إند" className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" /></label><label className="space-y-2"><span className="text-xs font-semibold">ملاحظة قصيرة</span><input value={body} onChange={(event) => setBody(event.target.value)} placeholder="ما الخطوة أو الفكرة؟" className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" /></label><label className="space-y-2"><span className="text-xs font-semibold">المكان</span><select value={lane} onChange={(event) => setLane(event.target.value as BoardLane)} className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none">{lanes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="space-y-2"><span className="text-xs font-semibold">اللون</span><select value={color} onChange={(event) => setColor(event.target.value as BoardColor)} className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none"><option value="yellow">أصفر</option><option value="blue">أزرق</option><option value="green">أخضر</option><option value="pink">وردي</option></select></label><button type="submit" className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> إضافة</button></div></form>}

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {lanes.map((currentLane) => {
          const laneNotes = notes.filter((note) => note.lane === currentLane.id)
          return <section key={currentLane.id} className="min-h-[300px] rounded-3xl bg-muted/55 p-3" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const noteId = event.dataTransfer.getData('text/plain'); if (noteId) moveNote(noteId, currentLane.id) }}><div className="mb-3 flex items-start justify-between px-2"><div><h2 className="text-sm font-semibold">{currentLane.title}</h2><p className="mt-1 text-[11px] text-muted-foreground">{currentLane.description}</p></div><span className="rounded-full bg-card px-2 py-1 text-[11px] text-muted-foreground">{laneNotes.length}</span></div><div className="space-y-3">{laneNotes.map((note) => <BoardNoteCard key={note.id} note={note} onMove={moveNote} onRemove={removeNote} />)}{laneNotes.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card/50 px-3 py-8 text-center text-xs text-muted-foreground">اسحب بطاقة هنا أو أضف فكرة جديدة</div>}</div></section>
        })}
      </div>

      <ContentCard title="مرتبط بمساحتك" description="أفكارك لا تعيش وحدها؛ هذه آخر الأهداف والمشاريع والمهام التي تستحق النظر."><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{connectedCards.map((card) => <div key={card.id} className="flex items-center gap-3 rounded-2xl bg-muted/70 p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary"><card.icon className="h-4 w-4" /></span><div className="min-w-0"><p className="text-[11px] text-muted-foreground">{card.kind}</p><p className="truncate text-sm font-semibold">{card.title}</p><p className="mt-1 text-[11px] text-muted-foreground">{card.detail}</p></div><ChevronLeft className="mr-auto h-4 w-4 text-muted-foreground" /></div>)}</div></ContentCard>
    </div>
  )
}

const noteColors: Record<BoardColor, string> = { yellow: 'bg-[#fff7c7]', blue: 'bg-[#e4f0ff]', green: 'bg-[#e5f7e8]', pink: 'bg-[#ffe7ef]' }

function BoardNoteCard({ note, onMove, onRemove }: { note: BoardNote; onMove: (id: string, lane: BoardLane) => void; onRemove: (id: string) => void }) {
  const currentIndex = lanes.findIndex((lane) => lane.id === note.lane)
  const nextLane = lanes[Math.min(lanes.length - 1, currentIndex + 1)].id
  return <article draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', note.id)} className={`group rounded-2xl p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${noteColors[note.color]}`}><div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-bold text-slate-800">{note.title}</h3>{note.body && <p className="mt-2 text-xs leading-6 text-slate-700/80">{note.body}</p>}</div><button type="button" aria-label="حذف الملاحظة" onClick={() => onRemove(note.id)} className="rounded-full p-1 text-slate-500 opacity-0 transition hover:bg-black/5 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button></div><div className="mt-4 flex items-center justify-between text-[10px] text-slate-600/70"><span>{note.createdAt}</span>{note.lane !== 'done' && <button type="button" onClick={() => onMove(note.id, nextLane)} className="flex items-center gap-1 rounded-full bg-white/50 px-2 py-1 font-semibold hover:bg-white/80">للمرحلة التالية <ArrowLeft className="h-3 w-3" /></button>}</div></article>
}
