'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  AlignJustify,
  Archive,
  Bell,
  BookHeart,
  CalendarCheck2,
  ChevronDown,
  Clapperboard,
  FolderKanban,
  LayoutGrid,
  ListChecks,
  Moon,
  Plus,
  Repeat,
  Search,
  Settings,
  StickyNote,
  Target,
  Wallet,
  X,
} from 'lucide-react'
import { useCommandCenter } from '@/lib/command-center-store'
import { authClient } from '@/lib/auth-client'
import { parseQuickAdd, type ParsedQuickAdd, type QuickAddKind } from '@/lib/quick-add-parser'
import { GlobalSearchDialog } from '@/components/search/global-search-dialog'

const navItems = [
  { href: '/', label: 'الرئيسية', icon: LayoutGrid },
  { href: '/daily-plan', label: 'خطة اليوم', icon: CalendarCheck2 },
  { href: '/tasks', label: 'المهام', icon: ListChecks },
  { href: '/notes', label: 'الملاحظات', icon: StickyNote },
  { href: '/habits', label: 'العادات', icon: Repeat },
  { href: '/projects', label: 'المشاريع', icon: FolderKanban },
  { href: '/goals', label: 'الأهداف', icon: Target },
  { href: '/journal', label: 'اليوميات', icon: BookHeart },
  { href: '/money', label: 'الفلوس', icon: Wallet },
  { href: '/entertainment', label: 'الترفيه', icon: Clapperboard },
  { href: '/religious', label: 'الديني', icon: Moon },
  { href: '/archive', label: 'الأرشيف', icon: Archive },
  { href: '/account', label: 'حسابي', icon: Settings },
]

function formatGregorianDate() {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

const quickAddTypes: { value: QuickAddKind; label: string }[] = [
  { value: 'task', label: 'مهمة' },
  { value: 'note', label: 'ملاحظة' },
  { value: 'finance', label: 'مصروف' },
  { value: 'entertainment', label: 'فيلم' },
]

function previewLabel(parsed: ParsedQuickAdd) {
  if (parsed.kind === 'task') return `مهمة · ${parsed.dueLabel}`
  if (parsed.kind === 'note') return 'ملاحظة سريعة'
  if (parsed.kind === 'finance') return `${parsed.financeKind === 'income' ? 'دخل' : 'مصروف'} · ${parsed.amount} جنيه${parsed.recurrence === 'monthly' ? ' · شهري' : parsed.recurrence === 'weekly' ? ' · أسبوعي' : ''}`
  return parsed.entertainmentType === 'series' ? 'مسلسل · عايز أتفرج' : 'فيلم · عايز أتفرج'
}

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const {
    addTask,
    addNote,
    addFinanceEntry,
    addEntertainment,
    projects,
    goals,
    reminders,
  } = useCommandCenter()
  const { data: session } = authClient.useSession()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [type, setType] = useState<QuickAddKind>('task')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [projectId, setProjectId] = useState('')
  const [goalId, setGoalId] = useState('')
  const [preview, setPreview] = useState<ParsedQuickAdd | null>(null)
  const [error, setError] = useState('')
  const [gregorianDate, setGregorianDate] = useState('')

  useEffect(() => {
    setGregorianDate(formatGregorianDate())
  }, [])

  useEffect(() => {
    if (!quickAddOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQuickAddOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [quickAddOpen])

  function openQuickAdd() {
    setQuickAddOpen(true)
    setPreview(null)
    setError('')
  }

  function closeQuickAdd() {
    setQuickAddOpen(false)
    setPreview(null)
    setError('')
    setTitle('')
    setBody('')
    setProjectId('')
    setGoalId('')
  }

  function changeType(nextType: QuickAddKind) {
    setType(nextType)
    setPreview(null)
    setError('')
    setTitle('')
    setBody('')
  }

  function submitQuickAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const source = type === 'note' ? `${title}\n${body}` : title
    const parsed = parseQuickAdd(type, source)
    if (!parsed) {
      setError(type === 'finance' ? 'اكتب المبلغ ووصف المصروف، مثال: سجل مصروف ١٢٠ مواصلات.' : 'اكتب بيانات الإضافة أولًا بصيغة واضحة.')
      return
    }
    setPreview(parsed)
    setError('')
  }

  function confirmQuickAdd() {
    if (!preview) return
    if (preview.kind === 'task') {
      addTask({
        title: preview.title,
        priority: 'medium',
        dueLabel: preview.dueLabel ?? 'النهاردة',
        category: 'سريع',
        projectId: projectId || undefined,
      })
    } else if (preview.kind === 'note') {
      addNote({ title: preview.title, body: preview.body || 'ملاحظة سريعة', tag: 'سريع' })
    } else if (preview.kind === 'finance') {
      addFinanceEntry({
        title: preview.title,
        amount: preview.amount ?? 0,
        kind: preview.financeKind ?? 'expense',
        category: preview.category ?? 'عام',
        localDate: new Date().toISOString().slice(0, 10),
        projectId: projectId || undefined,
        goalId: goalId || undefined,
        recurrence: preview.recurrence ?? 'none',
      })
    } else {
      addEntertainment({
        title: preview.title,
        type: preview.entertainmentType ?? 'movie',
        genre: preview.genre ?? 'عام',
      })
    }
    closeQuickAdd()
  }

  return (
    <>
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 rounded-full bg-card py-1.5 pr-2 pl-4">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold">{session?.user?.name || 'مساحتي'}</p>
              <p className="text-[11px] text-muted-foreground">{gregorianDate}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground">
              <span className="font-sans text-lg font-bold text-card">{(session?.user?.name || 'م').slice(0, 1)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openQuickAdd}
              aria-haspopup="dialog"
              className="flex items-center gap-2 rounded-full bg-card py-1.5 pr-2 pl-4 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              إضافة سريعة
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
                <Plus className="h-4 w-4 text-card" />
              </span>
            </button>
            <button type="button" aria-label="البحث الشامل" onClick={() => setSearchOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-card sm:h-11 sm:w-11">
              <Search className="h-4 w-4" />
            </button>
            <button type="button" aria-label="التنبيهات" onClick={() => router.push('/reminders')} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-card">
              <Bell className="h-4 w-4" />
              {reminders.some((reminder) => reminder.status === 'pending') && <span className="absolute top-2.5 left-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{Math.min(9, reminders.filter((reminder) => reminder.status === 'pending').length)}</span>}
            </button>
            {session && <button type="button" onClick={() => void authClient.signOut({ fetchOptions: { onSuccess: () => { router.push('/login') } } })} className="hidden rounded-full bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted sm:block">خروج</button>}
            <button type="button" aria-label="القائمة" className="flex h-11 w-11 items-center justify-center rounded-full bg-card">
              <AlignJustify className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto rounded-full bg-card p-1.5 [scrollbar-width:none]" aria-label="التنقل الرئيسي">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={isActive
                  ? 'flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-medium text-card'
                  : 'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted'}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      <GlobalSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      {quickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 p-4 pt-16 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="quick-add-dialog-title">
          <form onSubmit={submitQuickAdd} className="w-full max-w-lg rounded-3xl bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="quick-add-dialog-title" className="text-lg font-semibold">إضافة سريعة</h2>
                <p className="mt-1 text-xs text-muted-foreground">اكتبها بطريقتك، راجع التفاصيل، وبعدها احفظها.</p>
              </div>
              <button type="button" aria-label="إغلاق" onClick={closeQuickAdd} className="rounded-full p-2 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-muted p-1">
              {quickAddTypes.map((item) => (
                <button key={item.value} type="button" onClick={() => changeType(item.value)} aria-pressed={type === item.value} className={`rounded-xl px-2 py-2 text-xs sm:text-sm ${type === item.value ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}>
                  {item.label}
                </button>
              ))}
            </div>

            {!preview ? (
              <>
                <label className="mt-5 block text-sm font-medium" htmlFor="quick-add-title">
                  {type === 'task' ? 'اكتب المهمة بصيغتها الطبيعية' : type === 'note' ? 'عنوان الملاحظة' : type === 'finance' ? 'اكتب العملية' : 'اكتب اسم العمل'}
                </label>
                <input
                  id="quick-add-title"
                  autoFocus
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder={type === 'task' ? 'مثال: ضيف مهمة بكرة الساعة ٨ الاتصال بالعميل' : type === 'note' ? 'مثال: فكرة إطلاق المنتج' : type === 'finance' ? 'مثال: سجل مصروف ١٢٠ مواصلات' : 'مثال: فيلم إنترستيلر'}
                />
                {type === 'note' && <textarea aria-label="تفاصيل الملاحظة" value={body} onChange={(event) => setBody(event.target.value)} className="mt-3 min-h-24 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="اكتب التفاصيل هنا..." />}
                {type === 'task' && (
                  <label className="mt-3 block text-sm font-medium" htmlFor="quick-add-project">
                    المشروع المرتبط <span className="font-normal text-muted-foreground">(اختياري)</span>
                    <select id="quick-add-project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                      <option value="">بدون مشروع</option>
                      {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                    </select>
                  </label>
                )}
                {type === 'finance' && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium" htmlFor="quick-add-finance-project">المشروع المرتبط <span className="font-normal text-muted-foreground">(اختياري)</span>
                      <select id="quick-add-finance-project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                        <option value="">بدون مشروع</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium" htmlFor="quick-add-goal">الهدف المرتبط <span className="font-normal text-muted-foreground">(اختياري)</span>
                      <select id="quick-add-goal" value={goalId} onChange={(event) => setGoalId(event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                        <option value="">بدون هدف</option>
                        {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
                      </select>
                    </label>
                  </div>
                )}
                {error && <p role="alert" className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={closeQuickAdd} className="rounded-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">إلغاء</button>
                  <button type="submit" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">مراجعة قبل الحفظ</button>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-3xl border border-border bg-background p-4">
                <p className="text-xs font-semibold text-muted-foreground">معاينة الإضافة</p>
                <p className="mt-3 text-sm font-semibold">{preview.title}</p>
                {preview.body && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{preview.body}</p>}
                <p className="mt-3 text-xs text-muted-foreground">{previewLabel(preview)}</p>
                {preview.category && <p className="mt-1 text-xs text-muted-foreground">التصنيف: {preview.category}</p>}
                {preview.recurrence && preview.recurrence !== 'none' && <p className="mt-1 text-xs text-muted-foreground">التكرار: {preview.recurrence === 'monthly' ? 'شهري' : 'أسبوعي'}</p>}
                {(projectId || goalId) && <p className="mt-1 text-xs text-muted-foreground">{projectId ? `المشروع: ${projects.find((project) => project.id === projectId)?.title ?? 'مرتبط'}` : ''}{projectId && goalId ? ' · ' : ''}{goalId ? `الهدف: ${goals.find((goal) => goal.id === goalId)?.title ?? 'مرتبط'}` : ''}</p>}
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={() => setPreview(null)} className="rounded-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">تعديل</button>
                  <button type="button" onClick={confirmQuickAdd} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">تأكيد وحفظ</button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </>
  )
}
