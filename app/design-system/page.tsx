'use client'

import { useState } from 'react'
import { Archive, CheckCircle2, ClipboardList, FileText, Layers3, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { StatCard } from '@/components/ui/stat-card'

const badges = [
  { label: 'مكتملة', variant: 'positive' as const },
  { label: 'جارية', variant: 'default' as const },
  { label: 'مهمة', variant: 'warning' as const },
  { label: 'متأخرة', variant: 'destructive' as const },
]

export default function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [checked, setChecked] = useState(true)

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl bg-surface-dark p-6 text-surface-dark-foreground shadow-sm sm:p-8">
          <p className="text-xs font-semibold text-surface-dark-foreground/60">PERSONAL COMMAND CENTER</p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">مرجع نظام التصميم</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-surface-dark-foreground/70">
            صفحة داخلية لمراجعة المكونات المشتركة والتوكنز الدلالية قبل إعادة استخدامها في أقسام المنصة.
          </p>
        </header>

        <ContentCard
          title="كروت الإحصاءات"
          description="النمط المشترك المستخدم في Dashboard مع نغمات الحالة الحالية."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="المهام المفتوحة" value="٨" detail="تحتاج تركيزًا" tone="blue" href="/tasks" />
            <StatCard label="العادات" value="٥" detail="استمرارية جيدة" tone="green" href="/habits" />
            <StatCard label="الملاحظات" value="١٢" detail="مُنظمة" tone="purple" href="/notes" />
            <StatCard label="المشاريع" value="٣" detail="قيد المتابعة" tone="orange" href="/projects" />
          </div>
        </ContentCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <ContentCard
            title="الأزرار والشارات"
            description="تنويعات الإجراء وحالات العناصر باستخدام الألوان الدلالية."
          >
            <div className="flex flex-wrap gap-2">
              <Button>إجراء أساسي</Button>
              <Button variant="secondary">ثانوي</Button>
              <Button variant="outline">حدودي</Button>
              <Button variant="ghost">هادئ</Button>
              <Button variant="destructive">حذف</Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge key={badge.label} variant={badge.variant}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          </ContentCard>

          <ContentCard
            title="عناصر الإدخال"
            description="صيغ الحقول الأساسية مع تركيز واضح ومتوافق مع RTL."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                نص قصير
                <Input className="mt-2" placeholder="اكتب هنا..." />
              </label>
              <label className="text-sm font-medium">
                اختيار
                <Select className="mt-2" defaultValue="today">
                  <option value="today">اليوم</option>
                  <option value="week">هذا الأسبوع</option>
                </Select>
              </label>
            </div>
            <label className="mt-3 block text-sm font-medium">
              ملاحظات
              <Textarea className="mt-2" placeholder="اكتب التفاصيل..." />
            </label>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} />
              تفعيل التذكير
            </label>
          </ContentCard>
        </div>

        <ContentCard
          title="الحالات والنافذة الموحدة"
          description="Empty State وLoading State وDialog متاحة للمساحات التي تحتاج تفاعلًا أو انتظارًا."
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-start">
            <div className="overflow-hidden rounded-3xl border border-border">
              <EmptyState
                icon={Archive}
                title="لا توجد عناصر مؤرشفة"
                description="عند نقل عنصر إلى الأرشيف سيظهر هنا مع خيارات الاستعادة."
                action={<Button variant="outline" size="sm">فتح الأرشيف</Button>}
              />
            </div>
            <div className="rounded-3xl border border-border p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Layers3 className="h-4 w-4 text-primary" />
                حالة التحميل
              </div>
              <LoadingState count={2} className="grid gap-3" label="تحميل عناصر المعاينة" />
            </div>
            <div className="flex min-h-40 items-center justify-center rounded-3xl border border-dashed border-border p-4">
              <Button onClick={() => setDialogOpen(true)}>فتح Dialog</Button>
            </div>
          </div>
        </ContentCard>

        <ContentCard title="ملاحظات الاستخدام" description="قواعد سريعة للحفاظ على الاتساق في الأقسام القادمة.">
          <div className="grid gap-3 text-sm leading-7 text-muted-foreground sm:grid-cols-3">
            <p><CheckCircle2 className="me-1 inline h-4 w-4 text-positive-foreground" /> استخدم التوكنز الدلالية بدل الألوان المباشرة.</p>
            <p><ClipboardList className="me-1 inline h-4 w-4 text-primary" /> حافظ على الكروت المستديرة والمساحات المريحة.</p>
            <p><FileText className="me-1 inline h-4 w-4 text-warning-foreground" /> اربط الحالات النصية بلون واضح لا يعتمد على اللون وحده.</p>
          </div>
        </ContentCard>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="إضافة تذكير تجريبي"
        description="هذه معاينة للمكوّن الموحد قبل استخدامه في النوافذ الفعلية."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => setDialogOpen(false)}>حفظ المعاينة</Button>
          </>
        }
      >
        <div className="rounded-2xl bg-muted p-4 text-sm leading-7">
          <div className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" />نافذة متوافقة مع RTL</div>
          <p className="mt-2 text-muted-foreground">تدعم الإغلاق من الزر، والضغط خارج النافذة، ومفتاح Escape.</p>
        </div>
      </Dialog>
    </main>
  )
}
