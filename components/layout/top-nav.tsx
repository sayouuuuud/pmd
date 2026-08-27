'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlignJustify,
  Archive,
  Bell,
  BookHeart,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarDays,
  ChevronDown,
  Clapperboard,
  FolderKanban,
  LayoutGrid,
  Library,
  ListChecks,
  Moon,
  Plus,
  Sun,
  Repeat,
  Search,
  Settings,
  StickyNote,
  Target,
  Wallet,
  UserRound,
} from 'lucide-react'
import { useCommandCenter } from '@/lib/command-center-store'
import { useAppMode, type AppMode } from '@/components/layout/app-mode-provider'
import { useTheme } from '@/components/theme/theme-provider'
import { authClient } from '@/lib/auth-client'
import { parseQuickAdd, type ParsedQuickAdd, type QuickAddKind } from '@/lib/quick-add-parser'
import { GlobalSearchDialog } from '@/components/search/global-search-dialog'
import { SyncStatus } from '@/components/layout/sync-status'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const personalNavItems = [
  { href: '/', label: 'يومي', icon: LayoutGrid },
  { href: '/daily-plan', label: 'خطة اليوم', icon: CalendarCheck2 },
  { href: '/habits', label: 'العادات', icon: Repeat },
  { href: '/goals', label: 'الأهداف', icon: Target },
  { href: '/journal', label: 'اليوميات', icon: BookHeart },
  { href: '/religious', label: 'الديني', icon: Moon },
  { href: '/entertainment', label: 'الترفيه', icon: Clapperboard },
]

const workNavItems = [
  { href: '/workspace/dashboard', label: 'لوحة العمل', icon: LayoutGrid },
  { href: '/projects', label: 'المشاريع', icon: FolderKanban },
  { href: '/workspace', label: 'العملاء والفريق', icon: BriefcaseBusiness },
  { href: '/money/billing', label: 'الفواتير', icon: Wallet },
]

const sharedNavItems = [
  { href: '/tasks', label: 'المهام', icon: ListChecks },
  { href: '/calendar', label: 'التقويم', icon: CalendarDays },
  { href: '/notes', label: 'الملاحظات', icon: StickyNote },
  { href: '/library', label: 'المكتبة', icon: Library },
]

const utilityNavItems = [
  { href: '/money', label: 'الفلوس', icon: Wallet },
  { href: '/activity', label: 'النشاط', icon: Activity },
  { href: '/archive', label: 'الأرشيف', icon: Archive },
  { href: '/account', label: 'حسابي', icon: Settings },
]

const allNavItems = [...personalNavItems, ...workNavItems, ...sharedNavItems, ...utilityNavItems]
const workPaths = ['/workspace', '/projects', '/money/billing']
const personalPaths = ['/daily-plan', '/habits', '/goals', '/journal', '/religious', '/entertainment']

function formatGregorianDate() {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

function isNavItemActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

const quickAddTypes: { value: QuickAddKind; label: string }[] = [
  { value: 'task', label: 'مهمة' },
  { value: 'note', label: 'ملاحظة' },
  { value: 'finance', label: 'مصروف' },
  { value: 'entertainment', label: 'ترفيه' },
]

const quickTemplates: Record<AppMode, { label: string; type: QuickAddKind; value: string }[]> = {
  personal: [
    { label: 'مهمة اليوم', type: 'task', value: 'ضيف مهمة النهاردة ترتيب أولويات اليوم' },
    { label: 'مصروف جديد', type: 'finance', value: 'سجل مصروف ١٠٠ مشتريات' },
    { label: 'فكرة سريعة', type: 'note', value: 'فكرة سريعة' },
  ],
  work: [
    { label: 'متابعة عميل', type: 'task', value: 'متابعة العميل بكرة وإرسال آخر التحديثات' },
    { label: 'مهمة مشروع', type: 'task', value: 'ضيف مهمة بكرة مراجعة الخطوة التالية في المشروع' },
    { label: 'مصروف مشروع', type: 'finance', value: 'سجل مصروف ١٠٠ للمشروع' },
  ],
}

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
  const { theme, toggleTheme } = useTheme()
  const { mode, setMode } = useAppMode()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [type, setType] = useState<QuickAddKind>('task')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [projectId, setProjectId] = useState('')
  const [goalId, setGoalId] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('')
  const [preview, setPreview] = useState<ParsedQuickAdd | null>(null)
  const [error, setError] = useState('')
  const [gregorianDate, setGregorianDate] = useState('')
  const quickAddTriggerRef = useRef<HTMLButtonElement>(null)
  const searchTriggerRef = useRef<HTMLButtonElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setGregorianDate(formatGregorianDate())
  }, [])

  useEffect(() => {
    if (workPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) setMode('work')
    else if (pathname === '/' || personalPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) setMode('personal')
  }, [pathname, setMode])

  useEffect(() => {
    if (mode === 'work' && type === 'entertainment') setType('task')
  }, [mode, type])

  const visibleNavItems = mode === 'work'
    ? [...workNavItems, ...sharedNavItems]
    : [...personalNavItems, ...sharedNavItems]
  const availableQuickAddTypes = mode === 'work'
    ? quickAddTypes.filter((item) => item.value !== 'entertainment')
    : quickAddTypes

  function switchMode(nextMode: AppMode) {
    if (nextMode === mode) return
    setMode(nextMode)
    setMenuOpen(false)
    router.push(nextMode === 'work' ? '/workspace/dashboard' : '/')
  }

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
    setPriority('medium')
    setDueDate('')
    setCategory('')
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
        priority,
        dueLabel: dueDate || preview.dueLabel || 'النهاردة',
        dueAt: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : undefined,
        category: category.trim() || (mode === 'work' ? 'شغل' : 'شخصي'),
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
      <a href="#main-content" className="sr-only z-50 rounded-full bg-foreground px-4 py-2 text-sm text-card focus:not-sr-only focus:fixed focus:top-3 focus:right-3">
        الانتقال إلى المحتوى الرئيسي
      </a>
      <header className="flex flex-col gap-3">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="flex items-center rounded-full bg-card p-1" role="group" aria-label="اختيار وضع المنصة">
              <Button type="button" variant="ghost" aria-pressed={mode === 'personal'} onClick={() => switchMode('personal')} className={mode === 'personal' ? 'h-auto rounded-full bg-foreground px-3 py-2 text-xs text-card hover:bg-foreground hover:text-card' : 'h-auto rounded-full px-3 py-2 text-xs text-muted-foreground'}>
                <UserRound data-icon="inline-start" /> شخصي
              </Button>
              <Button type="button" variant="ghost" aria-pressed={mode === 'work'} onClick={() => switchMode('work')} className={mode === 'work' ? 'h-auto rounded-full bg-foreground px-3 py-2 text-xs text-card hover:bg-foreground hover:text-card' : 'h-auto rounded-full px-3 py-2 text-xs text-muted-foreground'}>
                <BriefcaseBusiness data-icon="inline-start" /> شغل
              </Button>
            </div>
            <SyncStatus />
          </div>
          <div className="flex min-w-0 items-center gap-2.5 justify-self-start rounded-full border border-border bg-card py-1.5 pr-2 pl-4 lg:justify-self-center">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold">{session?.user?.name || 'مساحتي'}</p>
              <p className="text-[11px] text-muted-foreground">{gregorianDate}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground">
              <span className="font-sans text-lg font-bold text-card">{(session?.user?.name || 'م').slice(0, 1)}</span>
            </div>
          </div>

          <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1 lg:justify-self-end lg:pb-0 [scrollbar-width:none]">
            <Button
              type="button"
              variant="ghost"
              ref={quickAddTriggerRef}
              onClick={openQuickAdd}
              aria-haspopup="dialog"
              className="flex h-auto items-center gap-2 rounded-full bg-card py-1.5 pr-2 pl-4 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              إضافة سريعة
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
                <Plus className="h-4 w-4 text-card" />
              </span>
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'} aria-pressed={theme === 'dark'} onClick={toggleTheme} className="rounded-full bg-card sm:h-11 sm:w-11">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button ref={searchTriggerRef} type="button" variant="ghost" size="icon" aria-label="البحث الشامل" onClick={() => setSearchOpen(true)} className="rounded-full bg-card sm:h-11 sm:w-11">
              <Search className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label="التنبيهات" onClick={() => router.push('/reminders')} className="relative rounded-full bg-card">
              <Bell className="h-4 w-4" />
              {reminders.some((reminder) => reminder.status === 'pending') && <span className="absolute top-2.5 left-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{Math.min(9, reminders.filter((reminder) => reminder.status === 'pending').length)}</span>}
            </Button>
            {session && <Button type="button" variant="ghost" onClick={() => void authClient.signOut({ fetchOptions: { onSuccess: () => { router.push('/login') } } })} className="hidden h-auto rounded-full bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted sm:block">خروج</Button>}
            <Button ref={menuTriggerRef} type="button" variant="ghost" size="icon" aria-label="القائمة" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} className="rounded-full bg-card">
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto rounded-full bg-card p-1.5 [scrollbar-width:none]" aria-label={`التنقل في وضع ${mode === 'work' ? 'الشغل' : 'الاستخدام الشخصي'}`}>
          {visibleNavItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href)
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

      <GlobalSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} triggerRef={searchTriggerRef} />

      <Dialog
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title="تنقل سريع"
        triggerRef={menuTriggerRef}
        description="الوضع الحالي في المقدمة، وكل أقسام المنصة ما زالت متاحة عند الحاجة."
        className="max-w-xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-muted p-2">
          <p className="px-2 text-xs font-medium text-muted-foreground">وضع المنصة</p>
          <div className="flex items-center rounded-full bg-card p-1">
            <Button type="button" variant="ghost" aria-pressed={mode === 'personal'} onClick={() => switchMode('personal')} className={mode === 'personal' ? 'h-auto rounded-full bg-foreground px-3 py-1.5 text-xs text-card' : 'h-auto rounded-full px-3 py-1.5 text-xs'}>شخصي</Button>
            <Button type="button" variant="ghost" aria-pressed={mode === 'work'} onClick={() => switchMode('work')} className={mode === 'work' ? 'h-auto rounded-full bg-foreground px-3 py-1.5 text-xs text-card' : 'h-auto rounded-full px-3 py-1.5 text-xs'}>شغل</Button>
          </div>
        </div>
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="كل أقسام المنصة">
          {allNavItems.map((item) => {
            const Icon = item.icon
            const isActive = isNavItemActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                className={isActive
                  ? 'flex items-center gap-2 rounded-2xl bg-foreground px-3 py-3 text-sm font-semibold text-card'
                  : 'flex items-center gap-2 rounded-2xl bg-muted px-3 py-3 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground'}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </Dialog>

      <Dialog
        open={quickAddOpen}
        onOpenChange={(open) => {
          if (open) setQuickAddOpen(true)
          else closeQuickAdd()
        }}
        title={mode === 'work' ? 'إضافة إلى مساحة الشغل' : 'إضافة إلى يومك'}
        triggerRef={quickAddTriggerRef}
        description="ابدأ بجملة بسيطة، ثم أضف التفاصيل التي تحتاجها فقط."
        placement="side"
        className="overflow-y-auto"
      >
          <form onSubmit={submitQuickAdd} noValidate className="flex min-h-[calc(100dvh-7rem)] flex-col">
            <div className="rounded-2xl bg-muted p-3">
              <p className="text-xs font-semibold">{mode === 'work' ? 'سياق الشغل' : 'سياق شخصي'}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{mode === 'work' ? 'سنربط الإضافة بالمشروع المختار ونبعد العناصر الشخصية.' : 'إضافة خفيفة ليومك بدون تفاصيل العمل.'}</p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">ابدأ بقالب</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {quickTemplates[mode].map((template) => (
                  <Button key={template.label} type="button" variant="outline" onClick={() => {
                    changeType(template.type)
                    setTitle(template.value)
                  }} className="h-auto rounded-full px-3 py-2 text-xs">
                    <Plus data-icon="inline-start" /> {template.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className={`mt-5 grid gap-1 rounded-2xl bg-muted p-1 ${mode === 'work' ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {availableQuickAddTypes.map((item) => (
                <Button key={item.value} type="button" variant="ghost" onClick={() => changeType(item.value)} aria-pressed={type === item.value} className={`h-auto rounded-xl px-2 py-2 text-xs sm:text-sm ${type === item.value ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}>
                  {item.label}
                </Button>
              ))}
            </div>

            {!preview ? (
              <>
                <label className="mt-5 block text-sm font-medium" htmlFor="quick-add-title">
                  {type === 'task' ? 'اكتب المهمة بصيغتها الطبيعية' : type === 'note' ? 'عنوان الملاحظة' : type === 'finance' ? 'اكتب العملية' : 'اكتب اسم العمل'}
                </label>
                <Input
                  id="quick-add-title"
                  autoFocus
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    if (error) setError('')
                  }}
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'quick-add-error' : undefined}
                  className="mt-2 h-auto w-full rounded-2xl px-4 py-3"
                  placeholder={type === 'task' ? 'مثال: ضيف مهمة بكرة الساعة ٨ الاتصال بالعميل' : type === 'note' ? 'مثال: فكرة إطلاق المنتج' : type === 'finance' ? 'مثال: سجل مصروف ١٢٠ مواصلات' : 'مثال: فيلم إنترستيلر'}
                />
                {type === 'note' && <Textarea aria-label="تفاصيل الملاحظة" value={body} onChange={(event) => {
                  setBody(event.target.value)
                  if (error) setError('')
                }} aria-invalid={Boolean(error)} aria-describedby={error ? 'quick-add-error' : undefined} className="mt-3 min-h-24 w-full rounded-2xl px-4 py-3" placeholder="اكتب التفاصيل هنا..." />}
                {type === 'task' && (
                  <div className="mt-4 rounded-2xl border border-border p-4">
                    <p className="text-sm font-semibold">تفاصيل التنفيذ</p>
                    <p className="mt-1 text-xs text-muted-foreground">اختيارية، لكنها تجعل المهمة جاهزة للتنفيذ مباشرة.</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm font-medium" htmlFor="quick-add-priority">الأولوية
                        <Select id="quick-add-priority" value={priority} onChange={(event) => setPriority(event.target.value as 'low' | 'medium' | 'high')} className="mt-2 h-auto w-full rounded-2xl px-3 py-3">
                          <option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option>
                        </Select>
                      </label>
                      <label className="block text-sm font-medium" htmlFor="quick-add-date">تاريخ التنفيذ
                        <Input id="quick-add-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-2 h-auto rounded-2xl px-3 py-3" />
                      </label>
                      <label className="block text-sm font-medium" htmlFor="quick-add-project">المشروع المرتبط
                        <Select id="quick-add-project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-2 h-auto w-full rounded-2xl px-3 py-3">
                          <option value="">بدون مشروع</option>
                          {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                        </Select>
                      </label>
                      <label className="block text-sm font-medium" htmlFor="quick-add-category">التصنيف
                        <Input id="quick-add-category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 h-auto rounded-2xl px-3 py-3" placeholder={mode === 'work' ? 'مثال: متابعة' : 'مثال: البيت'} />
                      </label>
                    </div>
                  </div>
                )}
                {type === 'finance' && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium" htmlFor="quick-add-finance-project">المشروع المرتبط <span className="font-normal text-muted-foreground">(اختياري)</span>
                      <Select id="quick-add-finance-project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-2 h-auto w-full rounded-2xl px-3 py-3">
                        <option value="">بدون مشروع</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                      </Select>
                    </label>
                    <label className="block text-sm font-medium" htmlFor="quick-add-goal">الهدف المرتبط <span className="font-normal text-muted-foreground">(اختياري)</span>
                      <Select id="quick-add-goal" value={goalId} onChange={(event) => setGoalId(event.target.value)} className="mt-2 h-auto w-full rounded-2xl px-3 py-3">
                        <option value="">بدون هدف</option>
                        {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
                      </Select>
                    </label>
                  </div>
                )}
                {error && <p id="quick-add-error" role="alert" aria-live="assertive" aria-atomic="true" className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
                <div className="mt-5 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={closeQuickAdd} className="h-auto rounded-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">إلغاء</Button>
                  <Button type="submit" className="h-auto rounded-full px-5 py-2.5 text-sm">مراجعة قبل الحفظ</Button>
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
                {preview.kind === 'task' && <p className="mt-1 text-xs text-muted-foreground">الأولوية: {priority === 'high' ? 'عالية' : priority === 'low' ? 'منخفضة' : 'متوسطة'}{dueDate ? ` · التاريخ: ${dueDate}` : ''}{category ? ` · التصنيف: ${category}` : ''}</p>}
                <div className="mt-5 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setPreview(null)} className="h-auto rounded-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">تعديل</Button>
                  <Button type="button" onClick={confirmQuickAdd} className="h-auto rounded-full px-5 py-2.5 text-sm">تأكيد وحفظ</Button>
                </div>
              </div>
            )}
          </form>
      </Dialog>
    </>
  )
}
