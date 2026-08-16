'use client'

import { useMemo, useState } from 'react'
import { Archive, Bookmark, BookmarkCheck, FileText, Grid2X2, Link2, List, Plus, Search } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { useCommandCenter, type Note } from '@/lib/command-center-store'

export function NotesWorkspace() {
  const { notes, tasks, projects, goals, addNote, toggleNotePin, archiveNote } = useCommandCenter()
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tag, setTag] = useState('شخصي')
  const visibleNotes = useMemo(() => notes.filter((note) => `${note.title} ${note.body} ${note.tag}`.includes(query.trim())), [notes, query])

  function createNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    addNote({ title: title.trim(), body: body.trim() || 'ملاحظة سريعة', tag })
    setTitle('')
    setBody('')
  }

  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
    <ContentCard className="lg:col-span-8" title="ملاحظاتك" description={`${notes.length} ملاحظات محفوظة`} action={<div className="flex items-center gap-1 rounded-xl bg-muted p-1"><button type="button" onClick={() => setView('grid')} aria-label="شبكة" className={`rounded-lg p-2 ${view === 'grid' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}><Grid2X2 className="h-4 w-4" /></button><button type="button" onClick={() => setView('list')} aria-label="قائمة" className={`rounded-lg p-2 ${view === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}><List className="h-4 w-4" /></button></div>}>
      <div className="relative"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="البحث في الملاحظات" className="h-11 w-full rounded-2xl border border-input bg-background pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="ابحث في العناوين والمحتوى..." /></div>
      <div className={view === 'grid' ? 'mt-5 grid gap-3 sm:grid-cols-2' : 'mt-5 space-y-2'}>{visibleNotes.map((note) => { const task = note.sourceTaskId ? tasks.find((item) => item.id === note.sourceTaskId) : undefined; const project = task?.projectId ? projects.find((item) => item.id === task.projectId) : undefined; const goal = project?.goalId ? goals.find((item) => item.id === project.goalId) : undefined; return <NoteCard key={note.id} note={note} taskTitle={task?.title} projectTitle={project?.title} goalTitle={goal?.title} onPin={() => toggleNotePin(note.id)} onArchive={() => archiveNote(note.id)} /> })}{visibleNotes.length === 0 && <div className="col-span-full rounded-2xl bg-muted px-4 py-12 text-center text-sm text-muted-foreground">لا توجد ملاحظات مطابقة.</div>}</div>
    </ContentCard>
    <ContentCard className="lg:col-span-4" title="التقاط سريع" description="اكتب الفكرة كما هي، ورتّبها لاحقًا."><form onSubmit={createNote}><input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="عنوان الملاحظة" className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="عنوان الملاحظة" /><textarea value={body} onChange={(event) => setBody(event.target.value)} aria-label="تفاصيل الملاحظة" className="mt-3 min-h-32 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring" placeholder="اكتب التفاصيل..." /><div className="mt-3 flex gap-2">{['شخصي', 'شغل', 'تطوير'].map((item) => <button type="button" key={item} onClick={() => setTag(item)} aria-pressed={tag === item} className={`flex-1 rounded-xl px-2 py-2 text-xs ${tag === item ? 'bg-accent font-semibold text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{item}</button>)}</div><button type="submit" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> حفظ الملاحظة</button></form></ContentCard>
  </div>
}

function NoteCard({ note, taskTitle, projectTitle, goalTitle, onPin, onArchive }: { note: Note; taskTitle?: string; projectTitle?: string; goalTitle?: string; onPin: () => void; onArchive: () => void }) {
  return <article className="group rounded-2xl border border-border/70 bg-muted/60 p-4 transition-colors hover:bg-card"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{note.title}</h3><p className="mt-1 line-clamp-3 text-xs leading-6 text-muted-foreground">{note.body}</p></div><button type="button" onClick={onPin} aria-label={note.pinned ? 'إلغاء التثبيت' : 'تثبيت'} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">{note.pinned ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}</button></div>{(taskTitle || projectTitle || goalTitle) && <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]"><span className="inline-flex items-center gap-1 text-muted-foreground"><Link2 className="h-3 w-3 text-primary" />مرتبط بـ</span>{taskTitle && <span className="rounded-full bg-accent px-2 py-1 text-accent-foreground">مهمة: {taskTitle}</span>}{projectTitle && <span className="rounded-full bg-card px-2 py-1">مشروع: {projectTitle}</span>}{goalTitle && <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">هدف: {goalTitle}</span>}</div>}<div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground"><span className="rounded-full bg-card px-2 py-1">{note.tag}</span><span>{note.createdAt}</span><button type="button" onClick={onArchive} aria-label="أرشفة الملاحظة" className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"><Archive className="h-3.5 w-3.5" /></button></div></article>
}
