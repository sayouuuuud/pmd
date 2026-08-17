'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CloudDownload, Download, FileSpreadsheet, ShieldCheck, Trash2, Upload, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCommandCenter } from '@/lib/command-center-store'
import { authClient } from '@/lib/auth-client'

function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function downloadCsv(filename: string, rows: string[][]) {
  const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`
  const content = `\ufeff${rows.map((row) => row.map((cell) => escapeCell(cell)).join(",")).join("\r\n")}`
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function AccountWorkspace() {
  const router = useRouter()
  const { profile, updateProfile, exportData, importData, resetLocalData, tasks, notes, habits, financeEntries, entertainment, journal } = useCommandCenter()
  const { data: session } = authClient.useSession()
  const [form, setForm] = useState(profile)
  const [saved, setSaved] = useState(false)
  const [dataMessage, setDataMessage] = useState('')
  const [dataBusy, setDataBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setForm(profile)
  }, [profile])

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateProfile(form)
    setSaved(true)
  }

  function exportLocalBackup() {
    downloadJson(`pmd-backup-${new Date().toISOString().slice(0, 10)}.json`, exportData())
    setDataMessage('تم تنزيل نسخة احتياطية من البيانات المحلية.')
  }

  function exportLocalCsv() {
    const rows: string[][] = [['القسم', 'المعرف', 'العنوان', 'التاريخ', 'الحالة', 'المبلغ', 'التصنيف', 'التكرار', 'التفاصيل']]
    rows.push(...tasks.map((item) => ['المهام', item.id, item.title, item.dueLabel, item.status, '', item.category, item.recurring ? 'متكرر' : 'مرة واحدة', item.description || '']))
    rows.push(...notes.map((item) => ['الملاحظات', item.id, item.title, item.createdAt, item.pinned ? 'مثبتة' : 'عادية', '', item.tag, '', item.body]))
    rows.push(...habits.map((item) => ['العادات', item.id, item.title, '', item.doneToday ? 'منجزة اليوم' : 'لم تنجز اليوم', '', item.target, '', `سلسلة ${item.streak}`]))
    rows.push(...financeEntries.map((item) => ['الفلوس', item.id, item.title, item.localDate, item.kind === 'income' ? 'دخل' : 'مصروف', String(item.amount), item.category, item.recurrence === 'monthly' ? 'شهري' : item.recurrence === 'weekly' ? 'أسبوعي' : 'بدون تكرار', item.note || '']))
    rows.push(...entertainment.map((item) => ['الترفيه', item.id, item.title, item.createdAt, item.status, item.rating ? String(item.rating) : '', item.genre, '', item.impression || item.note || '']))
    rows.push(...journal.map((item) => ['اليوميات', item.id, item.title, item.localDate, item.mood, '', '', '', item.body]))
    downloadCsv(`pmd-data-${new Date().toISOString().slice(0, 10)}.csv`, rows)
    setDataMessage('تم تنزيل ملف CSV منظم للأقسام المحلية الرئيسية.')
  }

  async function exportRemoteBackup() {
    setDataBusy(true)
    setDataMessage('جاري تجهيز نسخة البيانات المرتبطة بالحساب…')
    try {
      const response = await fetch('/api/account/export', { cache: 'no-store' })
      const payload = await response.json() as { data?: unknown; message?: string }
      if (!response.ok) throw new Error(payload.message || 'تعذر تصدير البيانات البعيدة.')
      downloadJson(`pmd-account-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2))
      setDataMessage('تم تنزيل نسخة البيانات المرتبطة بالحساب.')
    } catch (error) {
      setDataMessage(error instanceof Error ? error.message : 'تعذر تصدير البيانات البعيدة.')
    } finally {
      setDataBusy(false)
    }
  }

  async function restoreBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setDataBusy(true)
    try {
      const result = importData(await file.text())
      setDataMessage(result.message)
    } catch {
      setDataMessage('تعذر قراءة ملف النسخة الاحتياطية.')
    } finally {
      setDataBusy(false)
    }
  }

  function clearLocalData() {
    if (!window.confirm('سيتم استبدال البيانات المحلية بالبيانات الافتراضية. هل تريد المتابعة؟')) return
    resetLocalData()
    setDataMessage('تمت إعادة البيانات المحلية إلى الحالة الافتراضية. بيانات الحساب البعيدة لم تتأثر.')
  }

  async function deleteAccount() {
    const warning = session
      ? 'سيتم حذف الحساب وكل بياناته المرتبطة من قاعدة البيانات نهائيًا. لا يمكن التراجع عن هذه العملية. هل أنت متأكد؟'
      : 'سيتم حذف البيانات المحلية من هذا المتصفح فقط. هل أنت متأكد؟'
    if (!window.confirm(warning)) return

    setDataBusy(true)
    try {
      if (!session) {
        resetLocalData()
        setDataMessage('تم حذف البيانات المحلية من هذا المتصفح.')
        return
      }
      const response = await fetch('/api/account', { method: 'DELETE' })
      const payload = await response.json() as { message?: string }
      if (!response.ok) throw new Error(payload.message || 'تعذر حذف الحساب.')
      resetLocalData()
      router.push('/login')
    } catch (error) {
      setDataMessage(error instanceof Error ? error.message : 'تعذر حذف الحساب.')
    } finally {
      setDataBusy(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
      <ContentCard className="h-fit" title="ملفي" description="بياناتك الأساسية وطريقة ظهورك داخل المساحة.">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/70 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-card">
            <span className="text-xl font-bold">{(form.name || 'م').slice(0, 1)}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{form.name || 'مساحتي'}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{session?.user?.email || 'الوضع المحلي — سجّل الدخول لربط البيانات'}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
          <UserRound className="h-4 w-4 shrink-0" />
          <span>{form.onboardingComplete ? 'تم إعداد مساحتك الشخصية.' : 'أكمل الإعداد الأولي لتخصيص يومك.'}</span>
        </div>
      </ContentCard>

      <ContentCard title="تفضيلات المساحة" description="عدّل الإعدادات التي تؤثر على خطة اليوم والاقتراحات الشخصية.">
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">الاسم
            <Input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="mt-2 rounded-2xl px-4 py-3" />
          </label>
          <label className="block text-sm font-medium">المدينة
            <Input value={form.city} onChange={(event) => updateField('city', event.target.value)} className="mt-2 rounded-2xl px-4 py-3" />
          </label>
          <label className="block text-sm font-medium">بداية اليوم
            <Input type="time" value={form.dayStart} onChange={(event) => updateField('dayStart', event.target.value)} className="mt-2 rounded-2xl px-4 py-3" />
          </label>
          <label className="block text-sm font-medium">فترة العمل
            <Input value={form.workWindow} onChange={(event) => updateField('workWindow', event.target.value)} className="mt-2 rounded-2xl px-4 py-3" placeholder="09:00 - 17:00" />
          </label>
          <label className="block text-sm font-medium sm:col-span-2">الهدف الرئيسي الحالي
            <Textarea value={form.focusGoal} onChange={(event) => updateField('focusGoal', event.target.value)} className="mt-2 min-h-24 rounded-2xl px-4 py-3" />
          </label>
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <p className="text-xs text-muted-foreground">تُحفظ محليًا فورًا، وتُرفع للـBackend عند وجود جلسة وقاعدة بيانات.</p>
            <Button type="submit" className="rounded-full px-5 py-2.5 text-sm font-semibold">
              {saved && <Check className="h-4 w-4" />}
              {saved ? 'تم الحفظ' : 'حفظ التفضيلات'}
            </Button>
          </div>
        </form>
      </ContentCard>

      <ContentCard className="lg:col-span-2" title="بياناتي ونسختي الاحتياطية" description="صدّر بياناتك، استعد نسخة سابقة، أو افصل بياناتك عن هذا الجهاز.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Button type="button" onClick={exportLocalBackup} variant="outline" className="h-auto justify-start gap-3 rounded-2xl p-4 text-start">
            <Download className="h-5 w-5 shrink-0" />
            <span><strong className="block text-sm">تنزيل نسخة محلية</strong><small className="mt-1 block text-xs text-muted-foreground">كل ما هو محفوظ في هذا المتصفح</small></span>
          </Button>
          <Button type="button" onClick={exportRemoteBackup} disabled={dataBusy || !session} variant="outline" className="h-auto justify-start gap-3 rounded-2xl p-4 text-start">
            <CloudDownload className="h-5 w-5 shrink-0" />
            <span><strong className="block text-sm">تصدير بيانات الحساب</strong><small className="mt-1 block text-xs text-muted-foreground">نسخة من Neon عند تسجيل الدخول</small></span>
          </Button>
          <Button type="button" onClick={exportLocalCsv} variant="outline" className="h-auto justify-start gap-3 rounded-2xl p-4 text-start">
            <FileSpreadsheet className="h-5 w-5 shrink-0" />
            <span><strong className="block text-sm">تصدير CSV</strong><small className="mt-1 block text-xs text-muted-foreground">ملف قابل للفتح في Sheets وExcel</small></span>
          </Button>
          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={dataBusy} variant="outline" className="h-auto justify-start gap-3 rounded-2xl p-4 text-start">
            <Upload className="h-5 w-5 shrink-0" />
            <span><strong className="block text-sm">استعادة نسخة</strong><small className="mt-1 block text-xs text-muted-foreground">استبدال الحالة المحلية بملف JSON</small></span>
          </Button>
          <Button type="button" onClick={clearLocalData} disabled={dataBusy} variant="outline" className="h-auto justify-start gap-3 rounded-2xl p-4 text-start">
            <Trash2 className="h-5 w-5 shrink-0" />
            <span><strong className="block text-sm">مسح بيانات الجهاز</strong><small className="mt-1 block text-xs text-muted-foreground">لا يحذف حسابك البعيد</small></span>
          </Button>
        </div>
        <Input ref={fileInputRef} type="file" accept="application/json,.json" onChange={restoreBackup} className="hidden" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/60 p-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> لا تتضمن النسخ المحلية كلمات المرور أو رموز الجلسات.</span>
          {dataMessage && <span className="font-medium text-foreground">{dataMessage}</span>}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="max-w-2xl text-xs text-muted-foreground">حذف الحساب البعيد عملية نهائية. ستُحذف بياناتك من Neon، بينما تُحذف البيانات المحلية عند نجاح العملية.</p>
          <Button type="button" onClick={deleteAccount} disabled={dataBusy} variant="destructive" size="sm" className="shrink-0 rounded-full">حذف الحساب والبيانات</Button>
        </div>
      </ContentCard>
    </div>
  )
}
