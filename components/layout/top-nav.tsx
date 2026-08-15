'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  ListChecks,
  StickyNote,
  LayoutPanelLeft,
  FolderKanban,
  Target,
  Repeat,
  BookHeart,
  Wallet,
  Clapperboard,
  Moon,
  Bell,
  Plus,
  AlignJustify,
  ChevronDown,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'الرئيسية', icon: LayoutGrid },
  { href: '/tasks', label: 'المهام', icon: ListChecks },
  { href: '/notes', label: 'الملاحظات', icon: StickyNote },
  { href: '/board', label: 'السبورة', icon: LayoutPanelLeft },
  { href: '/projects', label: 'المشاريع', icon: FolderKanban },
  { href: '/goals', label: 'الأهداف', icon: Target },
  { href: '/habits', label: 'العادات', icon: Repeat },
  { href: '/journal', label: 'اليوميات', icon: BookHeart },
  { href: '/money', label: 'الفلوس', icon: Wallet },
  { href: '/entertainment', label: 'الترفيه', icon: Clapperboard },
  { href: '/religious', label: 'الديني', icon: Moon },
]

const gregorianDate = new Intl.DateTimeFormat('ar-EG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())

export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5 rounded-full bg-card py-1.5 pr-2 pl-4">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <div className="text-right leading-tight">
            <p className="text-sm font-semibold">مساحتي</p>
            <p className="text-[11px] text-muted-foreground">{gregorianDate}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground">
            <span className="font-sans text-lg font-bold text-card">م</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-full bg-card py-1.5 pr-2 pl-4 text-xs font-medium">
            إضافة سريعة
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
              <Plus className="h-4 w-4 text-card" />
            </span>
          </button>
          <button
            aria-label="التنبيهات"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-card"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2.5 left-2.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
          <button aria-label="القائمة" className="flex h-11 w-11 items-center justify-center rounded-full bg-card">
            <AlignJustify className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Nav pills */}
      <nav
        className="flex items-center gap-1 overflow-x-auto rounded-full bg-card p-1.5 [scrollbar-width:none]"
        aria-label="التنقل الرئيسي"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? 'flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-medium text-card'
                  : 'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted'
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
