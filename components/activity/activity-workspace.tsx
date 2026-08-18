'use client'

import { useMemo, useState } from 'react'
import { useEffect } from 'react'
import { Activity, BarChart3, CheckCircle2, CloudOff, Database, Download, MonitorDown, Pause, Play, RefreshCw, Trash2, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/ui/content-card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useCommandCenter } from '@/lib/command-center-store'
import { activityDistribution, activityNetSeconds, activityTopApps, formatActivityDuration, isActivityExcluded, localDateFromIso, type ActivityCategory } from '@/lib/activity'

function localToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
}

function metricTone(tone: 'blue' | 'green' | 'orange' | 'purple') {
  return tone === 'green' ? 'bg-emerald-500/10 text-emerald-600' : tone === 'orange' ? 'bg-amber-500/10 text-amber-600' : tone === 'purple' ? 'bg-violet-500/10 text-violet-600' : 'bg-sky-500/10 text-sky-600'
}

export function ActivityWorkspace() {
  const {
    activitySessions,
    activitySettings,
    addActivitySession,
    clearActivityData,
    deleteActivitySession,
    markActivitySessionsSynced,
    toggleActivityCollector,
    toggleActivityPause,
    updateActivitySettings,
  } = useCommandCenter()
  const [today, setToday] = useState('2000-01-01')
  const [selectedDate, setSelectedDate] = useState('2000-01-01')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [appName, setAppName] = useState('')
  const [category, setCategory] = useState<ActivityCategory>('application')
  const [minutes, setMinutes] = useState('30')
  const [excludedApps, setExcludedApps] = useState('')
  const [excludedDomains, setExcludedDomains] = useState('')

  useEffect(() => {
    const date = localToday()
    setToday(date)
    setSelectedDate(date)
  }, [])

  useEffect(() => {
    setExcludedApps(activitySettings.excludedApps.join(', '))
    setExcludedDomains(activitySettings.excludedDomains.join(', '))
  }, [activitySettings.excludedApps, activitySettings.excludedDomains])

  const visibleSessions = useMemo(() => activitySessions.filter((session) => !isActivityExcluded(session, activitySettings)), [activitySessions, activitySettings])
  const dailySessions = useMemo(() => visibleSessions.filter((session) => localDateFromIso(session.startedAt) === selectedDate), [visibleSessions, selectedDate])
  const weeklySessions = useMemo(() => {
    const end = new Date(`${selectedDate}T12:00:00Z`)
    const start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 6)
    return visibleSessions.filter((session) => {
      const date = localDateFromIso(session.startedAt)
      return date >= start.toISOString().slice(0, 10) && date <= selectedDate
    })
  }, [visibleSessions, selectedDate])
  const dailySeconds = dailySessions.reduce((sum, session) => sum + activityNetSeconds(session), 0)
  const weeklySeconds = weeklySessions.reduce((sum, session) => sum + activityNetSeconds(session), 0)
  const idleSeconds = dailySessions.reduce((sum, session) => sum + session.idleSeconds, 0)
  const topApps = useMemo(() => activityTopApps(weeklySessions, activitySettings), [weeklySessions, activitySettings])
  const distribution = useMemo(() => activityDistribution(dailySessions, activitySettings), [dailySessions, activitySettings])
  const maxDistribution = Math.max(1, ...distribution.map((item) => item.seconds))
  const pendingCount = activitySessions.filter((session) => session.syncState === 'pending' || session.syncState === 'failed').length
  const lastSyncLabel = activitySettings.lastSyncAt ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(activitySettings.lastSyncAt)) : 'لم تتم مزامنة بعد'

  function saveExclusions() {
    updateActivitySettings({
      excludedApps: excludedApps.split(',').map((item) => item.trim()).filter(Boolean),
      excludedDomains: excludedDomains.split(',').map((item) => item.trim()).filter(Boolean),
    })
  }

  function addManualSession() {
    const cleanName = appName.trim()
    const duration = Math.max(1, Math.min(720, Number(minutes) || 0))
    if (!cleanName || !duration) return
    const endedAt = new Date()
    const startedAt = new Date(endedAt.getTime() - duration * 60 * 1000)
    addActivitySession({ source: 'manual', category, appName: cleanName, startedAt: startedAt.toISOString(), endedAt: endedAt.toISOString(), idleSeconds: 0 })
    setAppName('')
    setSyncMessage('تمت إضافة جلسة محلية للاختبار.')
  }

  async function syncPending() {
    const pending = activitySessions.filter((session) => session.syncState === 'pending' || session.syncState === 'failed').slice(0, 100)
    if (!pending.length) {
      setSyncMessage('لا توجد جلسات معلقة للمزامنة.')
      return
    }
    setSyncing(true)
    setSyncMessage('جاري إرسال الجلسات إلى المنصة…')
    try {
      const response = await fetch('/api/activity', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessions: pending }) })
      if (!response.ok) throw new Error('تعذر الوصول إلى الخادم.')
      markActivitySessionsSynced(pending.map((session) => session.id))
      setSyncMessage(`تمت مزامنة ${pending.length} جلسة.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذرت المزامنة.'
      markActivitySessionsSynced(pending.map((session) => session.id), message)
      setSyncMessage('المزامنة متوقفة مؤقتًا؛ بقيت البيانات محليًا.')
    } finally {
      setSyncing(false)
    }
  }

  function exportCsv() {
    const header = ['التاريخ', 'التطبيق', 'النطاق', 'البداية', 'النهاية', 'المدة بالدقائق', 'الخمول']
    const rows = visibleSessions.map((session) => [localDateFromIso(session.startedAt), session.appName, session.browserDomain ?? '', session.startedAt, session.endedAt ?? '', Math.round(activityNetSeconds(session) / 60), session.idleSeconds])
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `activity-${selectedDate}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3"><span className="rounded-2xl bg-primary/10 p-3 text-primary"><Activity className="h-5 w-5" /></span><div><h1 className="text-xl font-bold">نشاط Windows</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">جامع تجريبي محلي يحول وقتك على التطبيقات إلى إشارات تساعدك على التخطيط، بدون مراقبة خفية أو لقطات شاشة.</p></div></div>
        <div className="flex flex-wrap items-center gap-2"><Button type="button" variant={activitySettings.collectorEnabled ? 'default' : 'outline'} onClick={toggleActivityCollector} className="rounded-full">{activitySettings.collectorEnabled ? <><Pause className="h-4 w-4" /> الجامع يعمل</> : <><Play className="h-4 w-4" /> تشغيل تجريبي</>}</Button><Button type="button" variant="outline" onClick={syncPending} disabled={syncing} className="rounded-full"><RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> مزامنة</Button>{syncMessage && <p role="status" className="basis-full text-xs text-muted-foreground lg:basis-auto">{syncMessage}</p>}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ActivityMetric icon={MonitorDown} label="نشاط اليوم" value={formatActivityDuration(dailySeconds)} tone="blue" />
        <ActivityMetric icon={BarChart3} label="آخر 7 أيام" value={formatActivityDuration(weeklySeconds)} tone="green" />
        <ActivityMetric icon={CloudOff} label="وقت الخمول" value={formatActivityDuration(idleSeconds)} tone="orange" />
        <ActivityMetric icon={Database} label="بانتظار المزامنة" value={pendingCount} tone="purple" />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <ContentCard className="lg:col-span-7" title="لقطة اليوم" description="اختر يومًا لقراءة الجلسات المسجلة محليًا بعد تطبيق الاستثناءات.">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><label className="grid gap-2 text-sm font-medium">التاريخ<input type="date" value={selectedDate} max={today} onChange={(event) => setSelectedDate(event.target.value)} className="h-10 rounded-xl border border-input bg-background px-3 text-sm" /></label><div className="flex gap-2"><Button type="button" variant="outline" onClick={exportCsv} className="rounded-full"><Download className="h-4 w-4" /> CSV</Button><Button type="button" variant="outline" onClick={() => window.print()} className="rounded-full">طباعة</Button></div></div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2"><div className="rounded-2xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">جلسات صالحة</p><p className="mt-1 text-2xl font-bold">{dailySessions.length}</p></div><div className="rounded-2xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">متوسط الجلسة</p><p className="mt-1 text-2xl font-bold">{dailySessions.length ? formatActivityDuration(dailySeconds / dailySessions.length) : '0د'}</p></div></div>
          <div className="mt-5 flex h-36 items-end gap-1 overflow-hidden rounded-2xl bg-muted/40 p-3">{distribution.map((item) => <div key={item.hour} className="flex h-full flex-1 flex-col justify-end gap-1"><div title={`${item.hour}:00 · ${formatActivityDuration(item.seconds)}`} className="min-h-1 rounded-t-md bg-primary/70" style={{ height: `${Math.max(3, (item.seconds / maxDistribution) * 100)}%` }} /><span className="text-center text-[9px] text-muted-foreground">{item.hour % 3 === 0 ? item.hour : ''}</span></div>)}</div>
        </ContentCard>

        <ContentCard className="lg:col-span-5" title="أكثر التطبيقات استخدامًا" description="المدة الصافية بعد خصم وقت الخمول.">
          <div className="space-y-3">{topApps.length ? topApps.map((item, index) => <div key={item.label} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-sm"><span className="truncate font-medium">{item.label}</span><span className="shrink-0 text-muted-foreground">{formatActivityDuration(item.seconds)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (item.seconds / Math.max(1, topApps[0].seconds)) * 100)}%` }} /></div></div></div>) : <p className="rounded-2xl bg-muted/60 px-4 py-5 text-sm text-muted-foreground">لا توجد جلسات صالحة بعد. شغّل الجامع أو أضف جلسة اختبار محلية.</p>}</div>
        </ContentCard>

        <ContentCard className="lg:col-span-7" title="حالة المزامنة والخصوصية" description="المزامنة اختيارية؛ عند غياب الخادم تظل الجلسات في التخزين المحلي ولا يتوقف التطبيق.">
          <div className="grid gap-3 sm:grid-cols-2"><StatusLine icon={activitySettings.paused ? Pause : Wifi} label="حالة الجمع" value={activitySettings.paused ? 'متوقف مؤقتًا' : activitySettings.collectorEnabled ? 'مفعّل تجريبيًا' : 'غير مفعّل'} /><StatusLine icon={activitySettings.lastSyncError ? CloudOff : CheckCircle2} label="آخر مزامنة" value={activitySettings.lastSyncError ? 'تعذرت؛ البيانات محلية' : lastSyncLabel} /></div>
          <div className="mt-4 rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm leading-7"><p className="font-semibold">الحدود الحالية</p><p className="mt-1 text-muted-foreground">لا يجمع هذا البروتوكول كلمات المرور أو محتوى الرسائل أو لقطات الشاشة أو ضغطات المفاتيح. الجامع الحقيقي يقرأ اسم التطبيق ووقت الجلسة فقط، ويمكن إيقافه وحذف سجله.</p></div>
        </ContentCard>

        <ContentCard className="lg:col-span-5" title="جامع Windows التجريبي" description="الإعدادات تُحفظ محليًا ويمكن تعديلها قبل تثبيت agent حقيقي.">
          <div className="space-y-3"><label className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-3 py-3 text-sm"><span>إيقاف الجمع مؤقتًا</span><input type="checkbox" checked={activitySettings.paused} onChange={toggleActivityPause} className="h-4 w-4 accent-primary" /></label><label className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-3 py-3 text-sm"><span>تسجيل عنوان النافذة</span><input type="checkbox" checked={activitySettings.collectWindowTitle} onChange={(event) => updateActivitySettings({ collectWindowTitle: event.target.checked })} className="h-4 w-4 accent-primary" /></label><label className="grid gap-2 text-sm">حد الخمول بالثواني<input type="number" min="60" max="3600" value={activitySettings.idleThresholdSeconds} onChange={(event) => updateActivitySettings({ idleThresholdSeconds: Number(event.target.value) })} className="h-10 rounded-xl border border-input bg-background px-3" /></label><label className="grid gap-2 text-sm">استثناء التطبيقات<span className="text-xs font-normal text-muted-foreground">افصل بينها بفاصلة</span><Input value={excludedApps} onChange={(event) => setExcludedApps(event.target.value)} onBlur={saveExclusions} placeholder="Slack, Spotify" /></label><label className="grid gap-2 text-sm">استثناء النطاقات<span className="text-xs font-normal text-muted-foreground">افصل بينها بفاصلة</span><Input value={excludedDomains} onChange={(event) => setExcludedDomains(event.target.value)} onBlur={saveExclusions} placeholder="youtube.com" /></label></div>
        </ContentCard>

        <ContentCard className="lg:col-span-7" title="إضافة جلسة محلية للاختبار" description="مسار يدوي لاختبار التحليلات دون تشغيل جامع خارجي.">
          <div className="grid gap-3 sm:grid-cols-3"><label className="grid gap-2 text-sm sm:col-span-2">اسم التطبيق أو الموقع<Input value={appName} onChange={(event) => setAppName(event.target.value)} placeholder="Visual Studio Code" /></label><label className="grid gap-2 text-sm">المدة بالدقائق<Input type="number" min="1" max="720" value={minutes} onChange={(event) => setMinutes(event.target.value)} /></label><label className="grid gap-2 text-sm">الفئة<Select value={category} onChange={(event) => setCategory(event.target.value as ActivityCategory)}><option value="application">تطبيق</option><option value="browser">متصفح</option><option value="idle">خمول</option></Select></label><div className="flex items-end"><Button type="button" onClick={addManualSession} disabled={!appName.trim()} className="w-full rounded-xl">إضافة محلية</Button></div></div>
        </ContentCard>

        <ContentCard className="lg:col-span-5" title="السجل المحلي" description="راجع الجلسات ثم احذف ما لا تريد الاحتفاظ به.">
          <div className="max-h-72 space-y-2 overflow-auto">{activitySessions.slice(0, 12).map((session) => <div key={session.id} className="flex items-center gap-2 rounded-2xl border border-border/60 px-3 py-2 text-sm"><div className="min-w-0 flex-1"><p className="truncate font-medium">{session.appName}</p><p className="text-xs text-muted-foreground">{localDateFromIso(session.startedAt)} · {formatActivityDuration(activityNetSeconds(session))} · {session.syncState === 'synced' ? 'متزامنة' : session.syncState === 'failed' ? 'فشلت' : 'محلية'}</p></div><Button type="button" variant="ghost" size="icon" aria-label={`حذف جلسة ${session.appName}`} onClick={() => deleteActivitySession(session.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}{!activitySessions.length && <p className="text-sm text-muted-foreground">السجل فارغ.</p>}</div><Button type="button" variant="outline" onClick={clearActivityData} disabled={!activitySessions.length} className="mt-3 w-full rounded-xl"><Trash2 className="h-4 w-4" /> حذف كل السجل المحلي</Button></ContentCard>
      </div>
    </div>
  )
}

function ActivityMetric({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: string | number; tone: 'blue' | 'green' | 'orange' | 'purple' }) {
  return <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm"><span className={`inline-flex rounded-2xl p-2 ${metricTone(tone)}`}><Icon className="h-4 w-4" /></span><p className="mt-3 text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>
}

function StatusLine({ icon: Icon, label, value }: { icon: typeof Wifi; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3"><Icon className="h-4 w-4 text-primary" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div></div>
}
