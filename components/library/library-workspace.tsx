'use client'

import { useMemo, useState } from 'react'
import { Archive, ArchiveRestore, ExternalLink, FileText, FolderKanban, Link2, Paperclip, Plus, Search, Sparkles, Star, Video } from 'lucide-react'
import { useCommandCenter, type Resource, type ResourceType } from '@/lib/command-center-store'
import { readWorkspaceFallback } from '@/lib/workspace-types'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const resourceTypeLabels: Record<ResourceType, string> = {
  link: 'رابط',
  prompt: 'Prompt',
  template: 'قالب',
  document: 'مستند',
  video: 'فيديو',
  file: 'ملف',
}

const resourceTypeIcons: Record<ResourceType, typeof Link2> = {
  link: Link2,
  prompt: Sparkles,
  template: FileText,
  document: FileText,
  video: Video,
  file: FileText,
}

function formatResourceDate(value: string) {
  return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatFileSize(value: number) {
  if (value < 1024) return `${value} بايت`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} ك.ب`
  return `${(value / (1024 * 1024)).toFixed(1)} م.ب`
}

function ResourceCard({ resource, onToggleFavorite, onArchive, onRestore }: {
  resource: Resource
  onToggleFavorite: () => void
  onArchive: () => void
  onRestore: () => void
}) {
  const Icon = resourceTypeIcons[resource.type]
  return (
    <article className="rounded-2xl border border-border/70 bg-background/60 p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{resource.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{resourceTypeLabels[resource.type]} · {formatResourceDate(resource.updatedAt)}</p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label={resource.favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'} aria-pressed={resource.favorite} onClick={onToggleFavorite} className="h-9 w-9 shrink-0 rounded-full">
          <Star className={`h-4 w-4 ${resource.favorite ? 'fill-foreground text-foreground' : ''}`} />
        </Button>
      </div>

      {resource.description && <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{resource.description}</p>}
      {resource.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5" aria-label="وسوم المورد">
          {resource.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{tag}</span>)}
        </div>
      )}
      {resource.attachments && resource.attachments.length > 0 && (
        <div className="mt-4 space-y-2" aria-label="المرفقات">
          {resource.attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center gap-2 rounded-xl bg-muted/70 px-3 py-2 text-xs">
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatFileSize(attachment.size)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {resource.url && <a href={resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-accent"><ExternalLink className="h-3.5 w-3.5" />فتح الرابط</a>}
        {resource.projectId && <span className="inline-flex items-center gap-1"><FolderKanban className="h-3.5 w-3.5" />مرتبط بمشروع</span>}
        {resource.clientId && <span>مرتبط بعميل</span>}
        <span className="ms-auto">{resource.archivedAt ? 'مؤرشف' : 'خاص محليًا'}</span>
      </div>

      <div className="mt-4 border-t border-border/60 pt-3">
        {resource.archivedAt ? (
          <Button type="button" variant="ghost" onClick={onRestore} className="h-auto rounded-full px-3 py-1.5 text-xs"><ArchiveRestore className="h-3.5 w-3.5" />استرجاع</Button>
        ) : (
          <Button type="button" variant="ghost" onClick={onArchive} className="h-auto rounded-full px-3 py-1.5 text-xs text-muted-foreground"><Archive className="h-3.5 w-3.5" />أرشفة</Button>
        )}
      </div>
    </article>
  )
}

export function LibraryWorkspace() {
  const { resources, projects, addResource, archiveResource, restoreResource, toggleResourceFavorite } = useCommandCenter()
  const clients = useMemo(() => Object.values(readWorkspaceFallback().clientsByWorkspace).flat(), [])
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'active' | 'favorites' | 'archived'>('active')
  const [type, setType] = useState<'all' | ResourceType>('all')
  const [title, setTitle] = useState('')
  const [resourceType, setResourceType] = useState<ResourceType>('link')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const visibleResources = useMemo(() => resources
    .filter((resource) => view === 'archived' ? Boolean(resource.archivedAt) : !resource.archivedAt)
    .filter((resource) => view !== 'favorites' || resource.favorite)
    .filter((resource) => type === 'all' || resource.type === type)
    .filter((resource) => {
      const haystack = [resource.title, resource.description, resource.url, ...resource.tags].join(' ').toLocaleLowerCase('ar')
      return haystack.includes(query.trim().toLocaleLowerCase('ar'))
    }), [query, resources, type, view])

  function resetForm() {
    setTitle('')
    setResourceType('link')
    setUrl('')
    setDescription('')
    setTags('')
    setClientId('')
    setProjectId('')
    setSelectedFiles([])
  }

  function submitResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    addResource({
      title,
      type: resourceType,
      url: url || undefined,
      description: description || undefined,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      clientId: clientId || undefined,
      projectId: projectId || undefined,
      attachments: selectedFiles.map((file, index) => ({
        id: `attachment-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        createdAt: new Date().toISOString(),
      })),
    })
    resetForm()
  }

  const counts = {
    active: resources.filter((resource) => !resource.archivedAt).length,
    favorites: resources.filter((resource) => !resource.archivedAt && resource.favorite).length,
    archived: resources.filter((resource) => Boolean(resource.archivedAt)).length,
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <ContentCard title="مكتبتك" description="روابطك وقوالبك ومواردك في مكان واحد، مع ربطها بسياق العمل.">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">ابحث في المكتبة</span>
            <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالعنوان أو الوسوم..." className="h-auto rounded-2xl py-3 pr-10" />
          </label>
          <Select value={type} onChange={(event) => setType(event.target.value as 'all' | ResourceType)} aria-label="تصفية نوع المورد" className="h-auto rounded-2xl py-3 sm:w-40">
            <option value="all">كل الأنواع</option>
            {Object.entries(resourceTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="طرق عرض المكتبة">
          {([['active', `النشطة (${counts.active})`], ['favorites', `المفضلة (${counts.favorites})`], ['archived', `الأرشيف (${counts.archived})`]] as const).map(([value, label]) => (
            <Button key={value} type="button" variant="ghost" role="tab" aria-selected={view === value} onClick={() => setView(value)} className={`h-auto rounded-full px-3.5 py-2 text-xs ${view === value ? 'bg-foreground text-card' : 'bg-muted text-muted-foreground'}`}>{label}</Button>
          ))}
        </div>

        {visibleResources.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm font-medium">لا توجد موارد مطابقة</p>
            <p className="mt-1 text-xs text-muted-foreground">أضف موردًا جديدًا أو غيّر البحث والفلاتر.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {visibleResources.map((resource) => <ResourceCard key={resource.id} resource={resource} onToggleFavorite={() => toggleResourceFavorite(resource.id)} onArchive={() => archiveResource(resource.id)} onRestore={() => restoreResource(resource.id)} />)}
          </div>
        )}
      </ContentCard>

      <ContentCard title="إضافة مورد" description="الموارد الجديدة خاصة ومحلية حتى تفعيل التخزين الإنتاجي. ">
        <form onSubmit={submitResource} className="space-y-3" noValidate>
          <label className="block text-sm font-medium" htmlFor="resource-title">العنوان</label>
          <Input id="resource-title" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثال: قالب عرض سعر" className="h-auto rounded-2xl py-3" />
          <label className="block text-sm font-medium" htmlFor="resource-type">النوع</label>
          <Select id="resource-type" value={resourceType} onChange={(event) => setResourceType(event.target.value as ResourceType)} className="h-auto rounded-2xl py-3">
            {Object.entries(resourceTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <label className="block text-sm font-medium" htmlFor="resource-url">الرابط الاختياري</label>
          <Input id="resource-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." dir="ltr" className="h-auto rounded-2xl py-3 text-left" />
          <label className="block text-sm font-medium" htmlFor="resource-description">الوصف</label>
          <Textarea id="resource-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="كيف تستخدم هذا المورد؟" className="min-h-24 rounded-2xl" />
          <label className="block text-sm font-medium" htmlFor="resource-tags">الوسوم</label>
          <Input id="resource-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="تصميم، مبيعات، عملاء" className="h-auto rounded-2xl py-3" />
          <label className="block text-sm font-medium" htmlFor="resource-files">مرفقات محلية اختيارية</label>
          <Input id="resource-files" type="file" multiple onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []).slice(0, 10))} className="h-auto rounded-2xl py-2.5 text-xs" />
          <p className="text-xs leading-5 text-muted-foreground">يُحفظ اسم الملف وحجمه ونوعه محليًا فقط؛ لا يتم رفع محتوى الملف قبل تفعيل التخزين الإنتاجي.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">العميل
              <Select value={clientId} onChange={(event) => setClientId(event.target.value)} className="mt-2 h-auto rounded-2xl py-3"><option value="">بدون عميل</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select>
            </label>
            <label className="block text-sm font-medium">المشروع
              <Select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-2 h-auto rounded-2xl py-3"><option value="">بدون مشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</Select>
            </label>
          </div>
          <Button type="submit" className="mt-2 w-full rounded-2xl"><Plus className="h-4 w-4" />حفظ في المكتبة</Button>
        </form>
      </ContentCard>
    </div>
  )
}
