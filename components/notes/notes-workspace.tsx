'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Archive, Bookmark, BookmarkCheck, FileText, Filter, Grid2X2, Link2, List, Pencil, Plus, Save, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
  const [noteError, setNoteError] = useState('')
  const availableTags = useMemo(() => Array.from(new Set([...noteTags, ...notes.flatMap((note) => splitNoteTags(note.tag))])).sort((a, b) => a.localeCompare(b, 'ar')), [notes])
  const visibleNotes = useMemo(() => notes
    .filter((note) => {
      const normalizedQuery = query.trim()
      const matchesQuery = !normalizedQuery || `${note.title} ${note.body} ${note.tag}`.includes(normalizedQuery)
      const matchesTag = tagFilter === 'all' || splitNoteTags(note.tag).includes(tagFilter)
      return matchesQuery && matchesTag
    })
    .sort((left, right) => Number(right.pinned) - Number(left.pinned)), [notes, query, tagFilter])

  function createNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) {
      setNoteError('اكتب عنوان الملاحظة أولًا.')
      return
    }
    setNoteError('')
    addNote({ title: title.trim(), body: body.trim() || 'ملاحظة سريعة', tag: joinNoteTags(selectedTags) })
    setTitle('')
    setBody('')
    setSelectedTags(['شخصي'])
  }

  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
    <ContentCard className="lg:col-span-8" title="ملاحظاتك" description={`${notes.length} ملاحظات محفوظة`} action={<div className="flex items-center gap-1 rounded-xl bg-muted p-1"><Button type="button" variant="ghost" size="icon-sm" onClick={() => setView('grid')} aria-label="شبكة" className={`rounded-lg p-2 ${view === 'grid' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}><Grid2X2 className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={() => setView('list')} aria-label="قائمة" className={`rounded-lg p-2 ${view === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}><List className="h-4 w-4" /></Button></div>}>
      <div className="relative"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="البحث في الملاحظات" className="h-11 rounded-2xl pr-10 pl-4" placeholder="ابحث في العناوين والمحتوى والوسوم..." /></div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><Filter className="h-4 w-4 text-muted-foreground" /><label htmlFor="note-tag-filter" className="text-xs text-muted-foreground">فلترة بالوسم</label><Select id="note-tag-filter" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} aria-label="فلترة ملاحظات حسب الوسم" className="h-9 w-auto rounded-xl px-3 text-xs"><option value="all">كل الوسوم</option>{availableTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}</Select>{tagFilter !== 'all' && <Button type="button" variant="outline" size="sm" onClick={() => setTagFilter('all')} className="h-9 rounded-xl border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">مسح الفلتر</Button>}</div>
      <div className={view === 'grid' ? 'mt-5 grid gap-3 sm:grid-cols-2' : 'mt-5 space-y-2'}>{visibleNotes.map((note) => { const task = note.sourceTaskId ? tasks.find((item) => item.id === note.sourceTaskId) : undefined; const project = task?.projectId ? projects.find((item) => item.id === task.projectId) : undefined; const goal = project?.goalId ? goals.find((item) => item.id === project.goalId) : undefined; return <NoteCard key={note.id} note={note} taskId={task?.id} taskTitle={task?.title} projectId={project?.id} projectTitle={project?.title} goalId={goal?.id} goalTitle={goal?.title} onUpdate={(patch) => updateNote(note.id, patch)} onPin={() => toggleNotePin(note.id)} onArchive={() => archiveNote(note.id)} /> })}{visibleNotes.length === 0 && <div className="col-span-full"><EmptyState icon={FileText} title="لا توجد ملاحظات مطابقة" description="جرّب تغيير البحث أو وسم الفلترة، أو اكتب ملاحظة سريعة لتبدأ مساحة الالتقاط." /></div>}</div>
    </ContentCard>
          <ContentCard className="lg:col-span-4" title="التقاط سريع" description="اكتب الفكرة كما هي، ورتّبها لاحقًا."><form onSubmit={createNote} noValidate><Input value={title} onChange={(event) => { setTitle(event.target.value); if (noteError) setNoteError('') }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} aria-keyshortcuts="Enter" aria-label="عنوان الملاحظة" aria-invalid={Boolean(noteError)} aria-describedby={noteError ? 'new-note-error' : undefined} className="rounded-2xl px-4 py-3" placeholder="عنوان الملاحظة — اضغط Enter للحفظ السريع" />{noteError && <p id="new-note-error" role="alert" className="mt-2 text-xs text-destructive">{noteError}</p>}<Textarea value={body} onChange={(event) => setBody(event.target.value)} aria-label="تفاصيل الملاحظة" className="mt-3 min-h-32 rounded-2xl px-4 py-3 leading-6" placeholder="اكتب التفاصيل..." /><div className="mt-3 grid grid-cols-3 gap-2">{noteTags.map((tag) => <Button type="button" key={tag} variant="ghost" size="sm" onClick={() => setSelectedTags((items) => toggleTag(items, tag))} aria-pressed={selectedTags.includes(tag)} className={`h-auto rounded-xl px-2 py-2 text-xs ${selectedTags.includes(tag) ? 'bg-accent font-semibold text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{tag}</Button>)}</div><p className="mt-2 text-[11px] text-muted-foreground">يمكن اختيار أكثر من وسم للملاحظة. اضغط Enter داخل العنوان للحفظ السريع.</p><Button type="submit" className="mt-3 h-auto w-full rounded-2xl px-4 py-3 text-sm font-semibold"><Plus className="h-4 w-4" /> حفظ الملاحظة</Button></form></ContentCard>
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
  const [editError, setEditError] = useState('')
  const tags = splitNoteTags(note.tag)

  function startEditing() {
    setEditTitle(note.title)
    setEditBody(note.body)
    setEditTags(tags)
    setEditError('')
    setEditing(true)
  }

  function saveEditing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editTitle.trim()) {
      setEditError('اكتب عنوان الملاحظة أولًا.')
      return
    }
    setEditError('')
    onUpdate({ title: editTitle.trim(), body: editBody.trim() || 'ملاحظة سريعة', tag: joinNoteTags(editTags) })
    setEditing(false)
  }

  return <article id={`note-${note.id}`} className="group scroll-mt-24 rounded-2xl border border-border/70 bg-muted/60 p-4 transition-colors hover:bg-card">
    <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{note.title}</h3>{!editing && <p className="mt-1 line-clamp-3 text-xs leading-6 text-muted-foreground">{note.body}</p>}</div><Button type="button" variant="ghost" size="icon-sm" onClick={onPin} aria-label={note.pinned ? 'إلغاء التثبيت' : 'تثبيت'} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">{note.pinned ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}</Button><Button type="button" variant="ghost" size="icon-sm" onClick={startEditing} aria-label="تعديل الملاحظة" className="rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 focus:opacity-100"><Pencil className="h-4 w-4" /></Button></div>
    {editing && <form onSubmit={saveEditing} noValidate className="mt-3 grid gap-2 border-t border-border/70 pt-3"><Input value={editTitle} onChange={(event) => { setEditTitle(event.target.value); if (editError) setEditError('') }} aria-label={`عنوان الملاحظة ${note.title}`} aria-invalid={Boolean(editError)} aria-describedby={editError ? `note-${note.id}-edit-error` : undefined} className="h-auto rounded-xl px-3 py-2 text-xs" placeholder="عنوان الملاحظة" />{editError && <p id={`note-${note.id}-edit-error`} role="alert" className="text-xs text-destructive">{editError}</p>}<Textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} aria-label={`محتوى الملاحظة ${note.title}`} className="min-h-28 rounded-xl px-3 py-2 text-xs leading-6" placeholder="محتوى الملاحظة" /><div className="grid grid-cols-3 gap-1 rounded-xl border border-input bg-background p-1">{noteTags.map((tag) => <Button key={tag} type="button" variant="ghost" size="xs" onClick={() => setEditTags((items) => toggleTag(items, tag))} aria-pressed={editTags.includes(tag)} className={`h-auto rounded-lg px-2 py-1.5 text-[10px] ${editTags.includes(tag) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>{tag}</Button>)}</div><div className="flex justify-end gap-2"><Button type="submit" aria-label="حفظ تعديل الملاحظة" className="h-auto rounded-xl px-3 py-2 text-xs font-semibold"><Save className="h-3.5 w-3.5" /> حفظ</Button><Button type="button" variant="outline" onClick={() => setEditing(false)} aria-label="إلغاء تعديل الملاحظة" className="h-auto rounded-xl px-3 py-2 text-xs text-muted-foreground"><X className="h-3.5 w-3.5" /> إلغاء</Button></div></form>}
    {(taskTitle || projectTitle || goalTitle) && <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]"><span className="inline-flex items-center gap-1 text-muted-foreground"><Link2 className="h-3 w-3 text-primary" />مرتبط بـ</span>{taskTitle && taskId && <Link href={`/tasks#task-${taskId}`} className="rounded-full bg-accent px-2 py-1 text-accent-foreground hover:underline">مهمة: {taskTitle}</Link>}{projectTitle && projectId && <Link href={`/projects#${projectId}`} className="rounded-full bg-card px-2 py-1 hover:underline">مشروع: {projectTitle}</Link>}{goalTitle && goalId && <Link href={`/goals#${goalId}`} className="rounded-full bg-primary/10 px-2 py-1 text-primary hover:underline">هدف: {goalTitle}</Link>}</div>}
    <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-muted-foreground"><div className="flex flex-wrap gap-1">{tags.map((tag) => <span key={tag} className="rounded-full bg-card px-2 py-1">{tag}</span>)}</div><span className="shrink-0">{note.createdAt}</span><Button type="button" variant="ghost" size="icon-xs" onClick={onArchive} aria-label="أرشفة الملاحظة" className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"><Archive className="h-3.5 w-3.5" /></Button></div>
  </article>
}
