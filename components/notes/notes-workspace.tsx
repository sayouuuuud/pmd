'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Archive, Bookmark, BookmarkCheck, FileText, Filter, Grid2X2, Link2, List, Pencil, Plus, Save, Search, X } from 'lucide-react'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { useCommandCenter, type Note } from '@/lib/command-center-store'

const noteTags = ['شخصي', 'شغل', 'تطوير']

function splitNoteTags(value: string) {
  const tags = value.split(',').map((item) => item.trim()).filter(Boolean)
  return Array.from(new Set(tags.length > 0 ? tags : ['عام']))
}

function joinNoteTags(tags: string[]) {
  const normalized = Array.from(new Set(tags.map((item) => item.trim()).filter(Boolean)))
  return normalized.length > 0 ? normalized.join(', ') : 'عام'
}

function toggleTag(tags: string[], tag: string) {
  return tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag]
}

export function NotesWorkspace() {
  const { notes, tasks, projects, goals, addNote, updateNote, toggleNotePin, archiveNote } = useCommandCenter()
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(['شخصي'])
  const availableTags = useMemo(() => Array.from(new Set([...noteTags, ...notes.flatMap((note) => splitNoteTags(note.tag))])).sort((a, b) => a.localeCompare(b, 'ar')), [notes])
  const visibleNotes = useMemo(() => notes.filter((note) => {
    const normalizedQuery = query.trim()
    const matchesQuery = !normalizedQuery || `${note.title} ${note.body} ${note.tag}`.includes(normalizedQuery)
    const matchesTag = tagFilter === 'all' || splitNoteTags(note.tag).includes(tagFilter)
    return matchesQuery && matchesTag
  }), [notes, query, tagFilter])

  function createNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    addNote({ title: title.trim(), body: body.trim() || 'ملاحظة سريعة', tag: joinNoteTags(selectedTags) })
    setTitle('')
    setBody('')
    setSelectedTags(['شخصي'])
  }

  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
    <ContentCard className="lg:col-span-8" title="ملاحظاتك" description={`${notes.length} ملاحظات محفوظة`} action={<div className="flex items-center gap-1 rounded-xl bg-muted p-1"><button type="button" onClick={() => setView('grid')} aria-label="شبكة" className={`rounded-lg p-2 ${view === 'grid' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}><Grid2X2 className="h-4 w-4" /></button><button type="button" onClick={() => setView('list')} aria-label="قائمة" className={`rounded-lg p-2 ${view === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}><List className="h-4 w-4" /></button></div>}>
      <div className="relative"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="البحث في الملاحظات" className="h-11 w-full rounded-2xl border border-input bg-background pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="ابحث في العناوين والمحتوى والوسوم..." /></div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><Filter className="h-4 w-4 text-muted-foreground" /><label htmlFor="note-tag-filter" className="text-xs text-muted-foreground">فلترة بالوسم</label><select id="note-tag-filter" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} aria-label="فلترة ملاحظات حسب الوسم" className="h-9 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"><option value="all">كل الوسوم</option>{availableTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}</select>{tagFilter !== 'all' && <button type="button" onClick={() => setTagFilter('all')} className="h-9 rounded-xl border border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">مسح الفلتر</button>}</div>
      <div className={view === 'grid' ? 'mt-5 grid gap-3 sm:grid-cols-2' : 'mt-5 space-y-2'}>{visibleNotes.map((note) => { const task = note.sourceTaskId ? tasks.find((item) => item.id === note.sourceTaskId) : undefined; const project = task?.projectId ? projects.find((item) => item.id === task.projectId) : undefined; const goal = project?.goalId ? goals.find((item) => item.id === project.goalId) : undefined; return <NoteCard key={note.id} note={note} taskId={task?.id} taskTitle={task?.title} projectId={project?.id} projectTitle={project?.title} goalId={goal?.id} goalTitle={goal?.title} onUpdate={(patch) => updateNote(note.id, patch)} onPin={() => toggleNotePin(note.id)} onArchive={() => archiveNote(note.id)} /> })}{visibleNotes.length === 0 && <div className="col-span-full"><EmptyState icon={FileText} title="لا توجد ملاحظات مطابقة" description="جرّب تغيير البحث أو وسم الفلترة، أو اكتب ملاحظة سريعة لتبدأ مساحة الالتقاط." /></div>}</div>
    </ContentCard>
    <ContentCard className="lg:col-span-4" title="التقاط سريع" description="اكتب الفكرة كما هي، ورتّبها لاحقًا."><form onSubmit={createNote}><input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="عنوان الملاحظة" className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="عنوان الملاحظة" /><textarea value={body} onChange={(event) => setBody(event.target.value)} aria-label="تفاصيل الملاحظة" className="mt-3 min-h-32 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring" placeholder="اكتب التفاصيل..." /><div className="mt-3 grid grid-cols-3 gap-2">{noteTags.map((tag) => <button type="button" key={tag} onClick={() => setSelectedTags((items) => toggleTag(items, tag))} aria-pressed={selectedTags.includes(tag)} className={`rounded-xl px-2 py-2 text-xs ${selectedTags.includes(tag) ? 'bg-accent font-semibold text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{tag}</button>)}</div><p className="mt-2 text-[11px] text-muted-foreground">يمكن اختيار أكثر من وسم للملاحظة.</p><button type="submit" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> حفظ الملاحظة</button></form></ContentCard>
  </div>
}

type NoteCardProps = {
  note: Note
  taskId?: string
  taskTitle?: string
  projectId?: string
  projectTitle?: string
  goalId?: string
  goalTitle?: string
  onUpdate: (patch: Partial<Pick<Note, 'title' | 'body' | 'tag'>>) => void
  onPin: () => void
  onArchive: () => void
}

function NoteCard({ note, taskId, taskTitle, projectId, projectTitle, goalId, goalTitle, onUpdate, onPin, onArchive }: NoteCardProps) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(note.title)
  const [editBody, setEditBody] = useState(note.body)
  const [editTags, setEditTags] = useState<string[]>(splitNoteTags(note.tag))
  const tags = splitNoteTags(note.tag)

  function startEditing() {
    setEditTitle(note.title)
    setEditBody(note.body)
    setEditTags(tags)
    setEditing(true)
  }

  function saveEditing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editTitle.trim()) return
    onUpdate({ title: editTitle.trim(), body: editBody.trim() || 'ملاحظة سريعة', tag: joinNoteTags(editTags) })
    setEditing(false)
  }

  return <article id={`note-${note.id}`} className="group scroll-mt-24 rounded-2xl border border-border/70 bg-muted/60 p-4 transition-colors hover:bg-card">
    <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{note.title}</h3>{!editing && <p className="mt-1 line-clamp-3 text-xs leading-6 text-muted-foreground">{note.body}</p>}</div><button type="button" onClick={onPin} aria-label={note.pinned ? 'إلغاء التثبيت' : 'تثبيت'} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">{note.pinned ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}</button><button type="button" onClick={startEditing} aria-label="تعديل الملاحظة" className="rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 focus:opacity-100"><Pencil className="h-4 w-4" /></button></div>
    {editing && <form onSubmit={saveEditing} className="mt-3 grid gap-2 border-t border-border/70 pt-3"><input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} aria-label={`عنوان الملاحظة ${note.title}`} className="rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" placeholder="عنوان الملاحظة" /><textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} aria-label={`محتوى الملاحظة ${note.title}`} className="min-h-28 rounded-xl border border-input bg-background px-3 py-2 text-xs leading-6 outline-none focus:ring-2 focus:ring-ring" placeholder="محتوى الملاحظة" /><div className="grid grid-cols-3 gap-1 rounded-xl border border-input bg-background p-1">{noteTags.map((tag) => <button key={tag} type="button" onClick={() => setEditTags((items) => toggleTag(items, tag))} aria-pressed={editTags.includes(tag)} className={`rounded-lg px-2 py-1.5 text-[10px] ${editTags.includes(tag) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>{tag}</button>)}</div><div className="flex justify-end gap-2"><button type="submit" aria-label="حفظ تعديل الملاحظة" className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Save className="h-3.5 w-3.5" /> حفظ</button><button type="button" onClick={() => setEditing(false)} aria-label="إلغاء تعديل الملاحظة" className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground"><X className="h-3.5 w-3.5" /> إلغاء</button></div></form>}
    {(taskTitle || projectTitle || goalTitle) && <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]"><span className="inline-flex items-center gap-1 text-muted-foreground"><Link2 className="h-3 w-3 text-primary" />مرتبط بـ</span>{taskTitle && taskId && <Link href={`/tasks#task-${taskId}`} className="rounded-full bg-accent px-2 py-1 text-accent-foreground hover:underline">مهمة: {taskTitle}</Link>}{projectTitle && projectId && <Link href={`/projects#${projectId}`} className="rounded-full bg-card px-2 py-1 hover:underline">مشروع: {projectTitle}</Link>}{goalTitle && goalId && <Link href={`/goals#${goalId}`} className="rounded-full bg-primary/10 px-2 py-1 text-primary hover:underline">هدف: {goalTitle}</Link>}</div>}
    <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-muted-foreground"><div className="flex flex-wrap gap-1">{tags.map((tag) => <span key={tag} className="rounded-full bg-card px-2 py-1">{tag}</span>)}</div><span className="shrink-0">{note.createdAt}</span><button type="button" onClick={onArchive} aria-label="أرشفة الملاحظة" className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"><Archive className="h-3.5 w-3.5" /></button></div>
  </article>
}
