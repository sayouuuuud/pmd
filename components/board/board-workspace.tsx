'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react'
import { Archive, ArrowLeft, Check, ChevronLeft, CirclePlus, Lightbulb, MoveLeft, Plus, Target, ZoomIn, ZoomOut } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { useCommandCenter, type BoardArchivePayload } from '@/lib/command-center-store'

type BoardLane = 'ideas' | 'next' | 'doing' | 'done'
type BoardColor = 'yellow' | 'blue' | 'green' | 'pink'
type BoardNote = { id: string; title: string; body: string; lane: BoardLane; color: BoardColor; createdAt: string; x: number; y: number }
type BoardDocument = { id: string; title: string; notes: BoardNote[] }

type Pan = { x: number; y: number }

const STORAGE_KEY = 'personal-command-center-board-v2'
const RESTORE_QUEUE_KEY = 'personal-command-center-board-restore-queue'
const BOARD_WIDTH = 1120
const BOARD_HEIGHT = 620
const lanes: { id: BoardLane; title: string; description: string }[] = [
  { id: 'ideas', title: 'أفكار', description: 'أشياء تريد ألا تنساها' },
  { id: 'next', title: 'التالي', description: 'خطوات واضحة تنتظر دورها' },
  { id: 'doing', title: 'قيد التنفيذ', description: 'ما تتحرك عليه الآن' },
  { id: 'done', title: 'تم', description: 'أشياء تستحق علامة إنجاز' },
]

const seedNotes: BoardNote[] = [
  { id: 'board-1', title: 'فكرة للمنتج', body: 'أضيف مساحة تجمع قرارات المراجعة الأسبوعية.', lane: 'ideas', color: 'yellow', createdAt: 'اليوم', x: 36, y: 36 },
  { id: 'board-2', title: 'جلسة تركيز', body: 'أبدأ بخطوة عميقة واحدة قبل فتح الرسائل.', lane: 'next', color: 'blue', createdAt: 'اليوم', x: 300, y: 36 },
  { id: 'board-3', title: 'منصة التحكم الشخصي', body: 'ربط المجالات الأساسية في لوحة واحدة.', lane: 'doing', color: 'green', createdAt: 'هذا الأسبوع', x: 564, y: 36 },
]

const initialBoards: BoardDocument[] = [{ id: 'board-main', title: 'لوحة البداية', notes: seedNotes }]

export function BoardWorkspace() {
  const { goals, projects, tasks, archiveBoardNote } = useCommandCenter()
  const [boards, setBoards] = useState<BoardDocument[]>(initialBoards)
  const [activeBoardId, setActiveBoardId] = useState(initialBoards[0].id)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [lane, setLane] = useState<BoardLane>('ideas')
  const [color, setColor] = useState<BoardColor>('yellow')
  const [showComposer, setShowComposer] = useState(false)
  const [showBoardComposer, setShowBoardComposer] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const panOrigin = useRef<{ pointer: Pan; pan: Pan } | null>(null)
  const activeBoard = boards.find((board) => board.id === activeBoardId) ?? boards[0]
  const boardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { boards?: unknown; activeBoardId?: unknown } | unknown[]
        if (Array.isArray(parsed)) {
          const migrated = [{ id: 'board-main', title: 'لوحة البداية', notes: normalizeNotes(parsed) }]
          setBoards(migrated)
          setActiveBoardId(migrated[0].id)
        } else if (parsed && Array.isArray(parsed.boards)) {
          const restored = parsed.boards.flatMap((board) => {
            if (!isRecord(board) || typeof board.id !== 'string' || typeof board.title !== 'string' || !Array.isArray(board.notes)) return []
            return [{ id: board.id, title: board.title, notes: normalizeNotes(board.notes) }]
          })
          if (restored.length > 0) {
            setBoards(restored)
            setActiveBoardId(typeof parsed.activeBoardId === 'string' && restored.some((board) => board.id === parsed.activeBoardId) ? parsed.activeBoardId : restored[0].id)
          }
        }
      }
    } catch {
      // Keep the board available when storage is unavailable or malformed.
    } finally {
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    if (isReady) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards, activeBoardId }))
  }, [activeBoardId, boards, isReady])

  useEffect(() => {
    if (!isReady) return
    try {
      const queued = JSON.parse(window.localStorage.getItem(RESTORE_QUEUE_KEY) ?? '[]') as unknown
      if (!Array.isArray(queued) || queued.length === 0) return
      setBoards((current) => {
        const next = current.map((board) => ({ ...board, notes: [...board.notes] }))
        for (const entry of queued) {
          if (!isRecord(entry) || typeof entry.id !== 'string' || typeof entry.boardId !== 'string') continue
          const targetBoardId = next.some((board) => board.id === entry.boardId) ? entry.boardId : next[0]?.id
          if (!targetBoardId || next.some((board) => board.notes.some((note) => note.id === entry.id))) continue
          const restored = normalizeNotes([entry])[0]
          if (!restored) continue
          const target = next.find((board) => board.id === targetBoardId)
          if (target) target.notes = [restored, ...target.notes]
        }
        return next
      })
      window.localStorage.removeItem(RESTORE_QUEUE_KEY)
    } catch {
      // Keep the board usable when a queued archive payload is malformed.
    }
  }, [isReady])

  useEffect(() => {
    if (!isPanning) return
    function move(event: PointerEvent) {
      if (!panOrigin.current) return
      setPan({ x: panOrigin.current.pan.x + event.clientX - panOrigin.current.pointer.x, y: panOrigin.current.pan.y + event.clientY - panOrigin.current.pointer.y })
    }
    function stop() {
      setIsPanning(false)
      panOrigin.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
  }, [isPanning])

  const connectedCards = useMemo(() => [
    ...goals.filter((goal) => goal.status === 'active').slice(0, 2).map((goal) => ({ id: goal.id, kind: 'هدف', title: goal.title, detail: `${goal.progress}% مكتمل`, icon: Target })),
    ...projects.filter((project) => project.status !== 'done').slice(0, 2).map((project) => ({ id: project.id, kind: 'مشروع', title: project.title, detail: `${project.progress}% مكتمل`, icon: MoveLeft })),
    ...tasks.filter((task) => task.status !== 'done').slice(0, 3).map((task) => ({ id: task.id, kind: 'مهمة', title: task.title, detail: task.dueLabel, icon: Check })),
  ], [goals, projects, tasks])

  function updateActiveNotes(update: (notes: BoardNote[]) => BoardNote[]) {
    setBoards((current) => current.map((board) => board.id === activeBoard.id ? { ...board, notes: update(board.notes) } : board))
  }

  function addBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextTitle = newBoardTitle.trim()
    if (!nextTitle) return
    const nextBoard = { id: `board-${Date.now()}`, title: nextTitle, notes: [] }
    setBoards((current) => [...current, nextBoard])
    setActiveBoardId(nextBoard.id)
    setNewBoardTitle('')
    setShowBoardComposer(false)
    setPan({ x: 0, y: 0 })
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    const index = activeBoard.notes.length
    updateActiveNotes((current) => [{ id: `board-${Date.now()}`, title: title.trim(), body: body.trim(), lane, color, createdAt: 'الآن', x: 36 + (index % 3) * 264, y: 36 + Math.floor(index / 3) * 170 }, ...current])
    setTitle('')
    setBody('')
    setShowComposer(false)
  }

  function moveNote(id: string, nextLane: BoardLane) {
    updateActiveNotes((current) => current.map((note) => note.id === id ? { ...note, lane: nextLane } : note))
  }

  function archiveNote(id: string) {
    const note = activeBoard.notes.find((item) => item.id === id)
    if (!note) return
    const payload: BoardArchivePayload = { ...note, boardId: activeBoard.id, boardTitle: activeBoard.title }
    archiveBoardNote(payload)
    updateActiveNotes((current) => current.filter((item) => item.id !== id))
  }

  function moveNotePosition(id: string, clientX: number, clientY: number) {
    const rect = boardRef.current?.getBoundingClientRect()
    if (!rect) return
    const nextX = Math.max(20, Math.min(BOARD_WIDTH - 240, (clientX - rect.left - pan.x) / zoom - 90))
    const nextY = Math.max(20, Math.min(BOARD_HEIGHT - 160, (clientY - rect.top - pan.y) / zoom - 30))
    updateActiveNotes((current) => current.map((note) => note.id === id ? { ...note, x: Math.round(nextX), y: Math.round(nextY) } : note))
  }

  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    panOrigin.current = { pointer: { x: event.clientX, y: event.clientY }, pan }
    setIsPanning(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl bg-surface-dark p-5 text-surface-dark-foreground">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-warning" /> مساحة تفكير مرنة</p><p className="mt-2 text-sm leading-7 text-surface-dark-foreground/60">حوّل الفكرة إلى خطوة، وانقلها بصريًا حتى تصبح جزءًا من يومك.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="اختيار السبورة" value={activeBoard.id} onChange={(event) => { setActiveBoardId(event.target.value); setPan({ x: 0, y: 0 }) }} className="rounded-full border border-surface-dark-foreground/20 bg-surface-dark px-3 py-2 text-xs text-surface-dark-foreground outline-none"><option value="" disabled>اختر سبورة</option>{boards.map((board) => <option key={board.id} value={board.id}>{board.title}</option>)}</select>
            <button type="button" onClick={() => setShowBoardComposer((current) => !current)} className="flex items-center justify-center gap-2 rounded-full bg-card/15 px-3 py-2 text-xs font-semibold hover:bg-card/25"><Plus className="h-4 w-4" /> سبورة جديدة</button>
            <button type="button" onClick={() => setShowComposer((current) => !current)} className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground"><CirclePlus className="h-4 w-4" /> أضف Sticky Note</button>
          </div>
        </div>
        {showBoardComposer && <form onSubmit={addBoard} className="flex flex-col gap-2 rounded-2xl bg-card/10 p-3 sm:flex-row"><label className="sr-only" htmlFor="new-board-title">اسم السبورة</label><input id="new-board-title" autoFocus value={newBoardTitle} onChange={(event) => setNewBoardTitle(event.target.value)} placeholder="مثال: إطلاق المنتج" className="min-w-0 flex-1 rounded-xl border border-surface-dark-foreground/20 bg-surface-dark px-3 py-2 text-sm outline-none focus:border-primary" /><button type="submit" className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">إنشاء</button></form>}
      </div>

      {showComposer && <form onSubmit={addNote} className="rounded-3xl border border-border bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-[1fr_1.4fr_160px_120px_auto] md:items-end"><label className="space-y-2"><span className="text-xs font-semibold">العنوان</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثال: فكرة للويك إند" className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" /></label><label className="space-y-2"><span className="text-xs font-semibold">ملاحظة قصيرة</span><input value={body} onChange={(event) => setBody(event.target.value)} placeholder="ما الخطوة أو الفكرة؟" className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" /></label><label className="space-y-2"><span className="text-xs font-semibold">المكان</span><select value={lane} onChange={(event) => setLane(event.target.value as BoardLane)} className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none">{lanes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="space-y-2"><span className="text-xs font-semibold">اللون</span><select value={color} onChange={(event) => setColor(event.target.value as BoardColor)} className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none"><option value="yellow">أصفر</option><option value="blue">أزرق</option><option value="green">أخضر</option><option value="pink">وردي</option></select></label><button type="submit" className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> إضافة</button></div></form>}

      <section className="rounded-3xl border border-border bg-muted/35 p-3 sm:p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2"><div><h2 className="text-sm font-semibold">{activeBoard.title}</h2><p className="mt-1 text-[11px] text-muted-foreground">اسحب الخلفية للتحريك، واسحب البطاقات لإعادة ترتيبها داخل المساحة.</p></div><div className="flex items-center gap-1 rounded-full border border-border bg-card p-1"><button type="button" aria-label="تصغير اللوحة" onClick={() => setZoom((current) => Math.max(0.7, Number((current - 0.1).toFixed(1))))} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><ZoomOut className="h-4 w-4" /></button><span className="min-w-12 text-center text-[11px] font-semibold">{Math.round(zoom * 100)}%</span><button type="button" aria-label="تكبير اللوحة" onClick={() => setZoom((current) => Math.min(1.4, Number((current + 0.1).toFixed(1))))} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><ZoomIn className="h-4 w-4" /></button><button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} className="rounded-full px-2 py-1 text-[11px] font-semibold text-primary hover:bg-muted">إعادة ضبط</button></div></div><div ref={boardRef} className={`relative min-h-[420px] overflow-hidden rounded-2xl border border-dashed border-border bg-background/80 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}><div onPointerDown={startPan} style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left' }} className="relative select-none bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border)/.7)_1px,transparent_0)] [background-size:24px_24px]">{activeBoard.notes.map((note) => <BoardNoteCard key={note.id} note={note} onMove={moveNote} onArchive={archiveNote} onDragEnd={(event) => moveNotePosition(note.id, event.clientX, event.clientY)} />)}{activeBoard.notes.length === 0 && <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">هذه السبورة فارغة. أضف أول فكرة لتبدأ.</p>}</div></div></section>

      <ContentCard title="مرتبط بمساحتك" description="أفكارك لا تعيش وحدها؛ هذه آخر الأهداف والمشاريع والمهام التي تستحق النظر."><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{connectedCards.map((card) => <div key={card.id} className="flex items-center gap-3 rounded-2xl bg-muted/70 p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary"><card.icon className="h-4 w-4" /></span><div className="min-w-0"><p className="text-[11px] text-muted-foreground">{card.kind}</p><p className="truncate text-sm font-semibold">{card.title}</p><p className="mt-1 text-[11px] text-muted-foreground">{card.detail}</p></div><ChevronLeft className="mr-auto h-4 w-4 text-muted-foreground" /></div>)}</div></ContentCard>
    </div>
  )
}

const noteColors: Record<BoardColor, string> = { yellow: 'bg-[#fff7c7]', blue: 'bg-[#e4f0ff]', green: 'bg-[#e5f7e8]', pink: 'bg-[#ffe7ef]' }

function BoardNoteCard({ note, onMove, onArchive, onDragEnd }: { note: BoardNote; onMove: (id: string, lane: BoardLane) => void; onArchive: (id: string) => void; onDragEnd: (event: React.DragEvent<HTMLElement>) => void }) {
  const currentIndex = lanes.findIndex((lane) => lane.id === note.lane)
  const nextLane = lanes[Math.min(lanes.length - 1, currentIndex + 1)].id
  return <article draggable onDragEnd={onDragEnd} style={{ left: note.x, top: note.y }} className={`group absolute w-56 rounded-2xl p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${noteColors[note.color]}`}><div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-bold text-slate-800">{note.title}</h3>{note.body && <p className="mt-2 text-xs leading-6 text-slate-700/80">{note.body}</p>}</div><button type="button" aria-label="أرشفة الملاحظة" onClick={() => onArchive(note.id)} className="rounded-full p-1 text-slate-500 opacity-0 transition hover:bg-black/5 group-hover:opacity-100 focus-visible:opacity-100"><Archive className="h-3.5 w-3.5" /></button></div><div className="mt-4 flex items-center justify-between text-[10px] text-slate-600/70"><span>{note.createdAt}</span>{note.lane !== 'done' && <button type="button" onClick={() => onMove(note.id, nextLane)} className="flex items-center gap-1 rounded-full bg-white/50 px-2 py-1 font-semibold hover:bg-white/80">للمرحلة التالية <ArrowLeft className="h-3 w-3" /></button>}</div><span className="mt-3 inline-flex rounded-full bg-white/40 px-2 py-1 text-[10px] text-slate-600">{lanes[currentIndex].title}</span></article>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeNotes(value: unknown[]): BoardNote[] {
  return value.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.title !== 'string') return []
    const lane = item.lane === 'next' || item.lane === 'doing' || item.lane === 'done' ? item.lane : 'ideas'
    const color = item.color === 'blue' || item.color === 'green' || item.color === 'pink' ? item.color : 'yellow'
    return [{ id: item.id, title: item.title, body: typeof item.body === 'string' ? item.body : '', lane, color, createdAt: typeof item.createdAt === 'string' ? item.createdAt : 'قديم', x: typeof item.x === 'number' ? item.x : 36 + (index % 3) * 264, y: typeof item.y === 'number' ? item.y : 36 + Math.floor(index / 3) * 170 }]
  })
}
