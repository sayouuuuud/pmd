'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlignJustify,
  Bell,
  BookHeart,
  CalendarCheck2,
  ChevronDown,
  Clapperboard,
  FolderKanban,
  LayoutGrid,
  LayoutPanelLeft,
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
  { href: '/account', label: 'حسابي', icon: Settings },
]

const gregorianDate = new Intl.DateTimeFormat('ar-EG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { addTask, addNote, reminders } = useCommandCenter()
  const { data: session } = authClient.useSession()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [type, setType] = useState<'task' | 'note'>('task')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  function submitQuickAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    if (type === 'task') {
      addTask({ title: title.trim(), priority: 'medium', dueLabel: 'النهاردة', category: 'سريع' })
    } else {
      addNote({ title: title.trim(), body: body.trim() || 'ملاحظة سريعة', tag: 'سريع' })
    }
    setTitle('')
    setBody('')
    setQuickAddOpen(false)
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
              onClick={() => setQuickAddOpen(true)}
              className="flex items-center gap-2 rounded-full bg-card py-1.5 pr-2 pl-4 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              إضافة سريعة
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
                <Plus className="h-4 w-4 text-card" />
              </span>
            </button>
            <button type="button" aria-label="البحث الشامل" onClick={() => setSearchOpen(true)} className="hidden h-11 w-11 items-center justify-center rounded-full bg-card sm:flex">
              <Search className="h-4 w-4" />
            </button>
            <button type="button" aria-label="التنبيهات" onClick={() => router.push('/reminders')} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-card">
              <Bell className="h-4 w-4" />
              {reminders.some((reminder) => reminder.status === 'pending') && <span className="absolute top-2.5 left-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{Math.min(9, reminders.filter((reminder) => reminder.status === 'pending').length)}</span>}
            </button>
            {session && <button type="button" onClick={() => void authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = '/login' } } })} className="hidden rounded-full bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted sm:block">خروج</button>}
            <button aria-label="القائمة" className="flex h-11 w-11 items-center justify-center rounded-full bg-card">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/30 p-4 pt-24 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="إضافة سريعة">
          <form onSubmit={submitQuickAdd} className="w-full max-w-lg rounded-3xl bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">إضافة سريعة</h2>
                <p className="mt-1 text-xs text-muted-foreground">سجّل الحاجة قبل ما تخرج من دماغك.</p>
              </div>
              <button type="button" aria-label="إغلاق" onClick={() => setQuickAddOpen(false)} className="rounded-full p-2 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex rounded-2xl bg-muted p-1">
              <button type="button" onClick={() => setType('task')} className={`flex-1 rounded-xl px-3 py-2 text-sm ${type === 'task' ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}>مهمة</button>
              <button type="button" onClick={() => setType('note')} className={`flex-1 rounded-xl px-3 py-2 text-sm ${type === 'note' ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}>ملاحظة</button>
            </div>
            <label className="mt-5 block text-sm font-medium" htmlFor="quick-add-title">{type === 'task' ? 'اسم المهمة' : 'عنوان الملاحظة'}</label>
            <input id="quick-add-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder={type === 'task' ? 'مثال: الاتصال بالعميل' : 'مثال: فكرة جديدة'} />
            {type === 'note' && <textarea value={body} onChange={(event) => setBody(event.target.value)} className="mt-3 min-h-24 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="اكتب التفاصيل هنا..." />}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setQuickAddOpen(false)} className="rounded-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">إلغاء</button>
              <button type="submit" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">حفظ</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
