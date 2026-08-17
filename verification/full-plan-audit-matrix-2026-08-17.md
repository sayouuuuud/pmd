# Full Plan Audit Matrix — baseline
Timestamp (UTC): 2026-08-17T11:19:59+0000

## Page probes
/account                 HTTP=200 lang="ar" dir="rtl"
/archive                 HTTP=200 lang="ar" dir="rtl"
/board                   HTTP=200 lang="ar" dir="rtl"
/calendar                HTTP=200 lang="ar" dir="rtl"
/daily-plan              HTTP=200 lang="ar" dir="rtl"
/design-system           HTTP=200 lang="ar" dir="rtl"
/entertainment           HTTP=200 lang="ar" dir="rtl"
/goals                   HTTP=200 lang="ar" dir="rtl"
/habits                  HTTP=200 lang="ar" dir="rtl"
/journal                 HTTP=200 lang="ar" dir="rtl"
/login                   HTTP=200 lang="ar" dir="rtl"
/money                   HTTP=200 lang="ar" dir="rtl"
/notes                   HTTP=200 lang="ar" dir="rtl"
/offline                 HTTP=200 lang="ar" dir="rtl"
/onboarding              HTTP=200 lang="ar" dir="rtl"
                         HTTP=200 lang="ar" dir="rtl"
/projects                HTTP=200 lang="ar" dir="rtl"
/religious               HTTP=200 lang="ar" dir="rtl"
/reminders               HTTP=200 lang="ar" dir="rtl"
/review                  HTTP=200 lang="ar" dir="rtl"
/tasks                   HTTP=200 lang="ar" dir="rtl"
/workspace               HTTP=200 lang="ar" dir="rtl"

## Direct color tokens
app/layout.tsx:41:  themeColor: '#ededf0',
components/money/money-workspace.tsx:75:  const donutBackground = categoryTotals.length ? `conic-gradient(${categoryTotals.map((item, index) => { const start = categoryTotals.slice(0, index).reduce((sum, current) => sum + current.percentage, 0); return `${item.color} ${start}% ${start + item.percentage}%` }).join(', ')})` : 'conic-gradient(hsl(var(--muted)) 0 100%)'
components/board/board-workspace.tsx:257:      <section className="rounded-3xl border border-border bg-muted/35 p-3 sm:p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2"><div><h2 className="text-sm font-semibold">{activeBoard.title}</h2><p className="mt-1 text-[11px] text-muted-foreground">اسحب الخلفية للتحريك، واسحب البطاقات لإعادة ترتيبها داخل المساحة.</p></div><div className="flex items-center gap-1 rounded-full border border-border bg-card p-1"><Button type="button" variant="ghost" aria-label="تصغير اللوحة" onClick={() => setZoom((current) => Math.max(0.7, Number((current - 0.1).toFixed(1))))} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><ZoomOut className="h-4 w-4" /></Button><span className="min-w-12 text-center text-[11px] font-semibold">{Math.round(zoom * 100)}%</span><Button type="button" variant="ghost" aria-label="تكبير اللوحة" onClick={() => setZoom((current) => Math.min(1.4, Number((current + 0.1).toFixed(1))))} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><ZoomIn className="h-4 w-4" /></Button><Button type="button" variant="ghost" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} className="rounded-full px-2 py-1 text-[11px] font-semibold text-primary hover:bg-muted">إعادة ضبط</Button></div></div><div ref={boardRef} className={`relative min-h-[420px] overflow-hidden rounded-2xl border border-dashed border-border bg-background/80 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}><div onPointerDown={startPan} style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left' }} className="relative select-none bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border)/.7)_1px,transparent_0)] [background-size:24px_24px]">{visibleNotes.map((note) => <BoardNoteCard key={note.id} note={note} groupTitle={groupOptions.find((group) => group.id === (note.groupId ?? 'ungrouped'))?.title ?? 'بدون مجموعة'} groupOptions={groupOptions} onMove={moveNote} onAssignGroup={assignNoteGroup} onResize={resizeNote} onArchive={archiveNote} onConvertToTask={convertNoteToTask} onConvertToNote={convertNoteToNote} onDragEnd={(event) => moveNotePosition(note.id, event.clientX, event.clientY)} />)}{visibleNotes.length === 0 && <div className="absolute inset-0 flex items-center justify-center p-6"><EmptyState icon={Lightbulb} title={groupFilter === 'all' && colorFilter === 'all' ? 'السبورة فارغة' : 'لا توجد أوراق بهذه الفلاتر'} description="أضف أول فكرة أو غيّر منطقة التجميع أو لون الورقة لعرض المزيد من الأوراق." /></div>}</div></div></section>

## Form validation markers
components/ui/button.tsx:7:  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
components/ui/input.tsx:11:        'flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
components/ui/textarea.tsx:10:        'flex min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
components/ui/select.tsx:10:        'flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
components/tasks/tasks-workspace.tsx:98:      <ContentCard title="مهمة جديدة" description="أصغر خطوة واضحة أفضل من قائمة طويلة."><form onSubmit={createTask} noValidate><Input value={newTitle} onChange={(event) => { setNewTitle(event.target.value); if (newTaskError) setNewTaskError('') }} aria-label="عنوان المهمة الجديدة" aria-invalid={Boolean(newTaskError)} aria-describedby={newTaskError ? 'new-task-error' : undefined} className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="اكتب اسم المهمة..." />{newTaskError && <p id="new-task-error" role="alert" className="mt-2 text-xs text-destructive">{newTaskError}</p>}<div className="mt-3 flex gap-2">{(['high', 'medium', 'low'] as Task['priority'][]).map((item) => <Button key={item} type="button" variant={priority === item ? "secondary" : "outline"} size="sm" onClick={() => setPriority(item)} className={`flex-1 rounded-xl border px-2 py-2 text-xs ${priority === item ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground'}`}>{item === 'high' ? 'عالية' : item === 'medium' ? 'متوسطة' : 'منخفضة'}</Button>)}</div><div className="mt-3 rounded-2xl border border-border bg-muted/40 p-2"><p className="px-1 text-[11px] font-semibold text-muted-foreground">التكرار</p><div className="mt-2 flex gap-1">{(['none', 'daily', 'weekly'] as TaskRecurrence[]).map((item) => <Button key={item} type="button" variant={newRecurrence === item ? "default" : "ghost"} size="sm" onClick={() => setNewRecurrence(item)} className={`flex-1 rounded-xl px-2 py-2 text-[11px] ${newRecurrence === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>{item === 'none' ? 'بدون' : item === 'daily' ? 'يومي' : 'أسبوعي'}</Button>)}</div></div><Button type="submit" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> إضافة المهمة</Button></form></ContentCard>
components/onboarding/onboarding-flow.tsx:104:function Field({ label, value, onChange, placeholder, type = 'text', icon, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; icon?: React.ReactNode; required?: boolean }) { return <label className="block text-sm font-medium">{label}{required && <span className="mr-1 text-destructive" aria-hidden="true">*</span>}<span className="relative mt-2 block">{icon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}<Input autoComplete="off" required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`h-12 rounded-2xl px-4 text-sm ${icon ? 'pr-10' : ''}`} /></span></label> }
components/auth/auth-form.tsx:69:    <form className="space-y-4" onSubmit={submit} noValidate>
components/money/money-workspace.tsx:218:        <form onSubmit={createEntry} noValidate className="space-y-3">
components/money/money-workspace.tsx:221:            <Input name="amount" type="number" min="1" aria-label="مبلغ العملية" aria-invalid={Boolean(entryFormError)} aria-describedby={entryFormError ? 'finance-entry-error' : undefined} onChange={() => { if (entryFormError) setEntryFormError('') }} className="h-auto rounded-2xl py-3" placeholder="المبلغ" />
components/money/money-workspace.tsx:223:          <Input name="title" aria-label="عنوان العملية" aria-invalid={Boolean(entryFormError)} aria-describedby={entryFormError ? 'finance-entry-error' : undefined} onChange={() => { if (entryFormError) setEntryFormError('') }} className="h-auto rounded-2xl px-4 py-3" placeholder="مثال: مشتريات البيت" />

## Visual audit checkpoint 1 — `/`
- الصفحة استجابت بعنوان عربي، وHTML يعلن `lang="ar"` و`dir="rtl"`.
- ظهر TopNav كاملًا مع الروابط الأساسية، إضافة سريعة، البحث الشامل، والتنبيهات.
- ظهرت كروت خطة اليوم والمهام والعادات والملاحظات والفلوس والصلوات والورد والاقتراحات، مع روابط سياق مباشرة.
- لم يظهر خطأ JavaScript أو hydration في المحتوى المستخرج؛ مؤشر Next DevTools ظاهر فقط في وضع التطوير.
- بيانات الصفحة محلية/تجريبية في الجولة الحالية، لذلك لا يُعد ذلك تحققًا من Neon أو جلسة Better Auth إنتاجية.

## Visual audit checkpoint 2 — `/tasks` and `/notes`
- `/tasks` حملت بنجاح وتعرض البحث، تبويبات الكل/اليوم/المفتوحة/المكتملة، فلاتر الحالة والأولوية والتصنيف، أعمدة الزمن، أزرار النقل، الخطوات الفرعية، ونموذج مهمة جديدة برسائل عربية وبلا اعتماد على تحقق المتصفح الإنجليزي.
- `/notes` حملت بنجاح وتعرض الشبكة/القائمة، البحث في العنوان والمحتوى والوسوم، فلتر الوسوم، تثبيت/إلغاء تثبيت، وكارت التقاط سريع مع وسوم عربية متعددة.
- الصفحتان حافظتا على RTL والهوية البصرية الحالية، ولم يظهر خطأ تطبيق ظاهر في المحتوى المستخرج.
- البيانات الحالية fallback محلية؛ لم يُعتبر ذلك اختبارًا لقاعدة Neon أو جلسة إنتاجية.

## Visual audit checkpoint 3 — `/goals` and `/money`
- `/goals` حملت بنجاح وتعرض أهدافًا نشطة، تقدمًا نسبيًا، عدد المشاريع والمهام المرتبطة، إيقافًا مؤقتًا وأرشفة، ونموذج هدف جديد مع أفق زمني.
- `/money` حملت بنجاح وتعرض مصروفات/دخل/ميزانية/عدد العمليات، تحليل التصنيفات، مقارنة ستة أشهر، المصاريف المتكررة، نموذج العملية المالية، والروابط السياقية للمشروع والهدف.
- نموذج الفلوس يعلن حقولًا عربية للعنوان والمبلغ، ويستخدم رسائل React المخصصة بدل رسالة متصفح إنجليزية.
- لا توجد أخطاء تحميل ظاهرة في المحتوى المستخرج، والصفحتان محافظتان على RTL وSemantic Design System.

## Visual audit checkpoint 4 — `/religious` and `/habits`
- `/religious` حملت بنجاح وتعرض أوقات الصلاة، حالات الصلوات، الورد اليومي، الحفظ، العادات الدينية، الأدعية، الأذكار، إعدادات التصفح والقراء، وآيات قابلة للحفظ/المفضلة. ظهرت روابط مباشرة إلى خطة اليوم والعادة المرتبطة.
- `/habits` حملت بنجاح وتعرض 6 عادات، إنجاز اليوم، سجل 35 يومًا، روابط المشروع والهدف، زر عادة جديدة، وأرشفة. الترتيب RTL والكروت والـSemantic Tokens متماسكة بصريًا.
- لم تظهر أخطاء تحميل أو Runtime في المحتوى المرئي لهذه الجولة. الاختبار التفاعلي العميق لتسجيل/إلغاء عادة، الأرشفة والاستعادة، والبيانات الخارجية سيُنفذ في الجولة التالية.

## Visual audit checkpoint 5 — `/review` and `/board`
- `/review` حملت بنجاح وتعرض مؤشرات المهام والعادات والدين والمال والورد والحفظ والترفيه، روابط سياق عميقة، ثلاثة حقول كتابة، حفظ مسودة واعتماد مراجعة، واقتراح قرار قابل للتحويل إلى مهمة.
- `/board` حملت بنجاح وتعرض اختيار السبورة، إنشاء Sticky Note، مناطق التجميع، فلاتر الألوان، التحكم بالتحجيم، بطاقات قابلة للنقل للمرحلة التالية، وتحويل الورقة إلى مهمة أو ملاحظة، إضافة إلى روابط السياق للأهداف والمشاريع والمهام.
- لم تظهر أخطاء تحميل أو Runtime في المحتوى المستخرج. الاختبار التفاعلي للسحب/النقل، الإضافة، التحويل، والأرشفة سيُنفذ لاحقًا ضمن Work Item مستقل.

## Visual audit checkpoint 6 — `/archive` and `/calendar`
- `/archive` حملت بنجاح وتعرض البحث داخل الأرشيف، فلاتر الأقسام من المهام حتى السبورة، تحديد النتائج الظاهرة، استعادة المحدد، وحالة الفراغ الآمنة دون حذف مباشر.
- `/calendar` حملت بنجاح بعرض شهري RTL لأغسطس 2026، أزرار الشهر السابق/التالي واليوم وحدث جديد، وتجميع أحداث التذكيرات مع روابط المصدر. ظهر يوم 17 مع 3 عناصر مرتبطة، كما ظهر قسم مصادر التقويم بخمسة أنواع، بينما أظهر البناء حالة Compiling في مؤشر أدوات Next فقط وليس خطأ تطبيقًا.
- الاختبار التفاعلي للإنشاء والحذف والفلاتر والاستعادة سيُنفذ لاحقًا ضمن Work Item مستقل.

## Visual audit checkpoint 7 — `/journal` and `/entertainment`
- `/journal` حملت بنجاح وتعرض إحصاءات التدوينات والكلمات، تقلب المزاج الشهري، اختيار التاريخ، محرر العنوان والمحتوى، اختيار المزاج، حفظ التدوينة، وأرشفة مساحة اليوم مع دفتر الأيام. ظهر مؤشر Compiling لأدوات Next فقط دون خطأ تطبيق.
- `/entertainment` حملت بنجاح وتعرض اقتراحًا قادمًا، إحصائيات الشهر، البحث، فلاتر النوع والتصنيف، قوائم الحالات الثلاث، التقييم والانطباع الشخصي، الترشيح والتحميل والأرشفة والإضافة.
- الجولة الحالية بصرية/تحميلية فقط؛ يجب تنفيذ CRUD وتغيير الحالة والتقييم والأرشفة ثم التحقق من fallback والتنظيف في الجولة التفاعلية.

## Visual audit checkpoint 8 — `/projects` and `/workspace`
- `/projects` حملت بنجاح وتعرض لوحة كانبان RTL بأربع حالات، إنشاء مشروع، ربط الهدف، التقدم، المهام المرتبطة، السحب/النقل، الأرشفة، وتفاصيل المشروع. التدقيق التفاعلي سيغطي التبويبات والتحديثات والدفعات والعميل.
- `/workspace` حملت بنجاح في وضع محلي مؤقت بسبب غياب قاعدة البيانات، وتعرض مساحة شخصية، إضافة مساحة، البحث في العملاء، عميل شركة النور، التحرير والأرشفة، ونموذج إضافة العميل. حالة fallback ظاهرة للمستخدم بوضوح.
- لا توجد أخطاء تحميل ظاهرة في الجولتين؛ ستُعاد اختبارات الملكية والـAPI والتحرير والأرشفة من خلال طلبات مباشرة واختبارات المتصفح.

## Visual audit checkpoint 9 — `/account` and `/reminders`
- `/account` حملت بنجاح وتعرض وضع local fallback بوضوح، تفضيلات الاسم والمدينة وبداية اليوم وفترة العمل والهدف الرئيسي، حفظ التفضيلات، تنزيل النسخة المحلية، تصدير CSV، استعادة JSON، مسح بيانات الجهاز، وحذف الحساب والبيانات مع توضيح الآثار.
- `/reminders` حملت بنجاح وتعرض التذكيرات المستحقة، المكتملة، المتكررة، الاقتراحات الهادئة، إضافة الاقتراحات، فلاتر المفتوحة/الكل، فتح السياق، تم، تأجيل، وأرشفة. ظهر 4 تذكيرات فعلية وروابطها إلى المهام وخطة اليوم.
- الجولة الحالية لا تغلق CRUD؛ يلزم اختبار إنشاء تذكير، التأجيل، الإكمال، الأرشفة، الفلترة، والاستعادة أو انعكاس الحالة في التقويم.

## Tooling audit checkpoint — official project audit script
تعذر تشغيل `scripts/project_audit.py` لأن المسار والملف غير موجودين في الريبو، وكانت نتيجة الأمر `AUDIT_EXIT=2`. تم البحث عن بدائل فوجدت `scripts/responsive-audit.py` فقط، إضافة إلى سجلات تدقيق متعددة داخل `verification/` و`docs/`. لا أعتبر غياب السكربت فشلًا وظيفيًا للمنتج، لكنه فجوة في قابلية تكرار خط الأساس ويجب تسجيلها ضمن البنود المفتوحة أو توفير بديل موثق.


## Responsive audit checkpoint — 2026-08-17T11:37Z
- شُغّل `scripts/responsive-audit.py` على 17 مسارًا، بمقاسي mobile وtablet، بعد تصحيح المنفذ إلى `localhost:3004`.
- النتيجة بعد إصلاح TopNav وصفوف Timeline والمهام: `34/34` تحميل ناجح، `horizontal_overflow=0`، و`load_failures=0`.
- كان الفشل السابق محصورًا في `/religious` بسبب انتظار networkidle أثناء طلبات المصادر الخارجية؛ أضيفت مهلة `8s` لمسارات AlAdhan وAlQuran Cloud وMP3Quran، فأصبحت الصفحة تعود وتعرض حالة الخطأ العربية/fallback بدل التعليق.
- بقيت استجابات `401` من طلبات الـAPI المحمية متوقعة في جلسة المتصفح غير المسجلة، وبقيت `502` في الديني محصورة في تعذر المصدر الخارجي ومغطاة برسائل واجهة عربية؛ اختبار curl المباشر في الجولة الحالية أعاد `200` للمواقيت والفهرس والسورة والقراء بزمن أقل من ثانية.
- بوابات TypeScript وESLint و`git diff --check` نجحت بعد الإصلاحات.
- لا يُعد هذا بديلًا عن اختبار جلسة Better Auth/Neon حقيقية؛ تلك الحالة تحتاج credentials فعلية غير متاحة في بيئة التدقيق الحالية.

## Responsive repair scope
- `components/layout/top-nav.tsx`: التفاف صف الحساب وأزرار التحكم على الشاشات الضيقة.
- `components/daily-plan/daily-plan-workspace.tsx`: التفاف صف Timeline وإضافة `min-w-0` لعنوان العنصر.
- `components/tasks/tasks-workspace.tsx`: `min-w-0` لشبكة الأعمدة والبطاقات، والتفاف صف المهمة ومجموعة أزرار النقل.
- `app/api/religious/{timings,quran,reciters}/route.ts`: مهلة 8 ثوانٍ للطلبات الخارجية.
- `scripts/responsive-audit.py`: استخدام المنفذ الفعلي `3004` في فحص المشروع.

## Findings requiring deeper interaction testing
- يجب اختبار العادات، السبورة، الأرشيف، التذكيرات، الحساب، اليوميات، الترفيه، المشاريع، ومساحة العمل بتغييرات فعلية ثم rollback نظيف.
- يجب فصل نتائج localStorage fallback عن نتائج المزامنة البعيدة؛ لا توجد credentials إنتاجية في هذه الجولة.
- يجب إجراء build إنتاجي بعد انتهاء دفعة الإصلاح الحالية قبل commit، مع عدم تشغيل migrations.

### 2026-08-17 — الجولة التفاعلية: نموذج العادات
- **الفجوة المكتشفة:** كان إرسال نموذج عادة فارغًا يعتمد على `required` الأصلي، فظهرت رسالة المتصفح الإنجليزية بدل تحقق عربي.
- **الإصلاح:** إضافة `noValidate`، وحالة `habitFormError`، ورسالة `اكتب اسم العادة أولًا.` مع `role="alert"` و`aria-invalid` و`aria-describedby`.
- **الاختبار:** فتح نموذج عادة جديدة ثم الضغط على «حفظ العادة» دون اسم؛ بقي النموذج مفتوحًا وظهرت الرسالة العربية داخل الحقل، ولم تُنشأ عادة جديدة.
- **الحالة:** مغلق بعد الإصلاح، مع إبقاء بوابات الجودة النهائية مطلوبة قبل commit.

### 2026-08-17 — الجولة التفاعلية: دورة العادات الكاملة
تم تنفيذ دورة فعلية على صفحة `/habits`: أُرسل نموذج فارغ أولًا فظهرت رسالة التحقق العربية دون إنشاء سجل؛ ثم أُضيفت عادة مؤقتة بعنوان «اختبار تدقيق العادات» وهدف «10 دقائق». ظهرت في قائمة العادات النشطة، وسُجل إنجازها اليومي فزاد العداد من 0 إلى 1 وارتفع مؤشر إنجاز اليوم. أُرشفت العادة فاختفت من القائمة النشطة، ثم ظهرت في `/archive` مع نوع «العادات» وزر الاستعادة. بعد الاستعادة ظهر إشعار عربي، وأصبح عدد عناصر الأرشيف صفرًا، ثم عادت العادة إلى `/habits` مع بقاء إنجازها اليومي محفوظًا.

**الحالة:** دورة الإضافة → التسجيل → الأرشفة → الاستعادة مجتازة بصريًا وتفاعليًا، مع تنظيف منطقي للأثر عبر الاستعادة بدل ترك بيانات الاختبار مؤرشفة.

### الجولة التفاعلية العميقة — المهام والأرشيف — 2026-08-17
- صفحة `/tasks`: أُرسل نموذج المهمة فارغًا وظهرت رسالة التحقق العربية دون إنشاء عنصر غير صالح.
- أُنشئت مهمة مؤقتة بعنوان «اختبار تدقيق المهام»، ثم ظهرت ضمن قائمة المهام المفتوحة.
- أُكملت المهمة؛ ظهرت حالة إعادة الفتح وتحدّثت مؤشرات القائمة.
- أُرشفت المهمة؛ اختفت من القائمة النشطة وظهرت في `/archive` ضمن قسم المهام.
- أُعيدت المهمة من الأرشيف؛ ظهر إشعار عربي «تمت استعادة «اختبار تدقيق المهام» إلى المهام» وأصبح الأرشيف فارغًا، بما يؤكد دورة الأرشفة الكاملة وإرجاع الحالة.
- أُعيدت الحالة إلى نظافة وظيفية دون ترك عنصر مؤرشف.
- الجولة البصرية: RTL وشريط التنقل والبطاقات والأزرار ظهرت دون خطأ ظاهر؛ ملاحظة devtools overlay في لقطة الاختبار ليست جزءًا من واجهة المستخدم.

- `/notes` فتحت بنجاح مع شبكة الملاحظات والبحث وفلتر الوسوم والتثبيت ونموذج الالتقاط السريع.
- بدأ اختبار ملاحظة مؤقتة بعنوان «ملاحظة تدقيق شاملة» ومحتوى عربي؛ تم إدخال الحقول بنجاح، وسيُستكمل اختبار الوسوم والحفظ والتعديل والأرشفة في الجولة الحالية.

- في نموذج الالتقاط السريع للملاحظات تم اختيار «شخصي» ثم «شغل» للملاحظة المؤقتة، وبقيت الحقول العربية والوسوم معروضة دون انهيار بصري.

- بعد إضافة وسم «تطوير» والضغط على «حفظ الملاحظة»، ارتفع العدد من 5 إلى 6 وظهرت «ملاحظة تدقيق شاملة» في الشبكة مع محتواها ووسمي «شغل» و«تطوير»، ثم عاد نموذج الالتقاط فارغًا.

- البحث بعنوان «ملاحظة تدقيق شاملة» صفّى العرض إلى بطاقة واحدة فقط، مؤكداً عمل البحث المحلي.
- زر التثبيت غيّر حالته من «تثبيت» إلى «إلغاء التثبيت»، وظهرت أزرار «تعديل الملاحظة» و«أرشفة الملاحظة» على البطاقة بعد التفاعل.

- فتح محرر البطاقة، تعديل العنوان إلى «ملاحظة تدقيق شاملة معدلة» والمحتوى إلى نص محدث، ثم حفظ التعديل. انعكس العنوان والمحتوى فورًا في البطاقة، وبقيت وسوم «شغل» و«تطوير» ظاهرة.

- الجولة التفاعلية للملاحظات: إنشاء ملاحظة مؤقتة بعنوان «ملاحظة تدقيق شاملة» مع ثلاثة وسوم، اختبار البحث والتثبيت، تعديل العنوان والمحتوى، أرشفتها، التحقق من ظهورها في الأرشيف، ثم استعادتها. ظهرت بعد الاستعادة بعنوان «ملاحظة تدقيق شاملة معدلة» ومحتواها المحدث ووسما «شغل» و«تطوير» في القائمة النشطة. بقيت بيانات محلية سابقة موجودة كما كانت، ولم تُترك الملاحظة الاختبارية مؤرشفة.

## الجولة التفاعلية العميقة — الأهداف والأرشيف — 2026-08-17

- أُنشئ هدف مؤقت باسم «اختبار تدقيق الأهداف» من نموذج الأهداف، وظهر في قائمة الأهداف النشطة مع مؤشرات 0% و0 مشاريع و0/0 مهام.
- فُتحت تفاصيل الهدف، وظهرت بطاقة السبب، حالة التقدم، المشاريع الحاملة، والمهام المرتبطة مع حالة «لا توجد مهام بعد».
- عُدّل وصف الهدف وموعده من المحرر، وحُفظت التعديلات وظهرت في البطاقة: «وصف محدث بعد تدقيق دورة الهدف بالكامل.» و«قبل منتصف الشهر».
- أُرشف الهدف؛ اختفى من الأهداف النشطة، وانخفض عداد الأهداف النشطة، وظهر في `/archive` تحت تصنيف الأهداف.
- أُعيد الهدف من الأرشيف؛ ظهر إشعار عربي «تمت استعادة ... إلى الأهداف»، أصبح عداد الأرشيف 0، واختفى من نتائج الأرشيف.
- النتيجة: دورة إنشاء/عرض تفاصيل/تعديل/أرشفة/استعادة الهدف نجحت، ولم تُترك بيانات الاختبار مؤرشفة.

## الجولة التفاعلية العميقة — الفلوس (2026-08-17)

- فُتح نموذج العملية المالية الفارغ، وظهرت رسائل التحقق العربية دون إنشاء سجل غير صالح.
- أُنشئت عملية اختبار عربية وربطت بمشروع وهدف موجودين، وظهر السياق في قائمة آخر العمليات.
- أُرشفت العملية، ثم ظهرت في الأرشيف تحت قسم «الفلوس» مع زر استعادة.
- استُعيدت العملية بنجاح إلى صفحة الفلوس، ثم أزيل سجل الاختبار المعروف من `localStorage` فقط للتأكد من عدم ترك أثر تجريبي.
- بعد التنظيف عادت مؤشرات الفلوس إلى حالتها السابقة: 6 عمليات، 2,520 جنيه مصروفات، 21,950 جنيه دخل، ولم يعد عنوان الاختبار ظاهرًا.
- لم يُختبر تحرير العملية المالية لأن الواجهة الحالية تعرض الأرشفة كمسار التعديل المتاح ولا توفر محررًا مستقلًا للعملية.

## جولة اليوميات — 2026-08-17
- أُنشئت تدوينة اختبارية بعنوان «جلسة تركيز اختبارية» مع محتوى عربي ومزاج محايد.
- عُدّل العنوان والمحتوى والمزاج إلى «هادئ»، وحُفظ التعديل في السجل نفسه دون تكرار.
- أُرشفت التدوينة، فعادت الصفحة إلى حالة فارغة لتاريخ اليوم مع بقاء التدوينة الأساسية.
- أثناء الضغط على رابط الأرشيف توقف dev server وظهر `ERR_CONNECTION_REFUSED`؛ لم يُسجّل ذلك كعطل تطبيق قبل إعادة تشغيل الخادم، إذ عاد للعمل طبيعيًا خلال 340ms.
- استكمال استعادة التدوينة من `/archive` مطلوب في الجولة التالية.

## الجولة التفاعلية العميقة — التذكيرات — 2026-08-17
- فُتح نموذج «تذكير جديد»، وأُدخل عنوان عربي وموعد «اليوم، ١٨:٣٠»، مع اختيار تكرار يومي.
- حُفظ التذكير وظهر في القائمة، وارتفع عداد المستحق الآن من 4 إلى 5 وعدّاد التذكيرات المتكررة من 1 إلى 2.
- أُجّل التذكير، فاختفى من عداد المستحق الآن وعُرض موعده «لاحقًا اليوم» مع بقائه في القائمة.
- ما زال اختبار الإكمال ثم الأرشفة والاستعادة والتنظيف مطلوبًا.
- بعد التأجيل، أدى الضغط على «تم» في التذكير اليومي إلى ترحيل الموعد إلى «غدًا» مع بقاء التكرار، وهو سلوك إكمال للدورة التالية.
- أُرشف التذكير، ثم استُعيد من /archive بنجاح، وظهر إشعار «تمت استعادة ... إلى التذكيرات» وانخفض عدد العناصر المؤرشفة من 3 إلى 2.

## الجولة التفاعلية العميقة — الترفيه — 2026-08-17
- أُضيف «فيلم اختبار الترفيه» مع نوع فيلم، تصنيف دراما، سنة 2026، وملاحظة عربية.
- ظهر العمل في عمود «عايز أتفرج» وارتفع إجمالي القائمة من 4 إلى 5.
- غُيّرت الحالة إلى «بتفرج» فانتقل العمل إلى عمود المشاهدة الحالية وارتفع عداده من 1 إلى 2.
- ما زال اختبار التقييم، ثم الأرشفة والاستعادة والتنظيف مطلوبًا.
- غُيّرت الحالة إلى «خلصت» فارتفع عداد الأعمال المكتملة من 1 إلى 2، ثم سُجل تقييم 4/5 فصار المتوسط 4.5/5.
- أُدخل الانطباع «تجربة اختبارية ممتعة ومفيدة.» وظهر داخل بطاقة العمل.
- أُرشف العمل ثم استُعيد من /archive بنجاح، مع إشعار عربي وانخفاض عدد عناصر الأرشيف من 3 إلى 2.
- كُتبت مراجعة أسبوعية عربية في الحقول الثلاثة، ثم حُفظت كمسودة وظهر إشعار «تم حفظ المسودة».
- اعتُمدت المراجعة بنجاح وظهر إشعار «تم اعتماد مراجعة هذا الأسبوع».
- حُوّل قرار الأسبوع إلى مهمة جديدة بعنوان «أبدأ كل صباح بمهمة عميقة واحدة قبل فتح بقية السياقات.»، وارتفع عدد المهام التي تحتاج قرارًا من 5 إلى 6.


## 2026-08-17 — جولة التقويم وإصلاح تحرير الأحداث

اكتملت دورة التقويم اليدوي: إنشاء حدث عربي بتاريخ ووقت ووصف، فتح نموذج التحرير، تعديل العنوان والوقت والوصف داخل السجل نفسه، ثم حذف الحدث الاختباري مع بقاء أحداث التذكيرات. أثناء الجولة كُشفت فجوة عملية: لم تكن هناك واجهة تحرير للأحداث اليدوية، كما كان تأثير الحفظ في `calendar-workspace.tsx` يمسح `localStorage` في أول تحميل قبل اكتمال قراءة الحالة. أضيف زر التحرير ومسار PATCH للأحداث البعيدة مع fallback محلي، وأضيفت حراسة `storageLoaded` لمنع الكتابة المبكرة. بوابات TypeScript وESLint وdiff check وNext build نجحت. أُزيلت بيانات الاختبار بعد التحقق.


## إعادة فحص hydration بعد تثبيت Better Auth — 2026-08-17

استُبدلت تهيئة `baseURL` في `lib/auth-client.ts` التي كانت تعتمد على `typeof window` بقيمة `process.env.NEXT_PUBLIC_APP_URL ?? undefined` ثابتة أثناء SSR وCSR. بعد نجاح بوابات TypeScript وESLint و`git diff --check` و`next build` أُعيد فتح `/board` في المتصفح؛ ظهرت السبورة كاملة مع RTL والكروت والبطاقات المرتبطة، ولم تسجل وحدة التحكم سوى React DevTools وHMR، دون hydration mismatch أو خطأ React. يظل الإصلاح وقائيًا لأن التحذير السابق لم يكن قابلًا لإعادة الإنتاج في التحميل الطبيعي.

### 2026-08-17 — Quick Add: مهمة
- أُدخلت صيغة عربية: «ضيف مهمة بكرة الساعة ٨ مراجعة Quick Add الاختبارية».
- المعاينة فسّرت النوع كمهمة، والتاريخ كـ«بكرة»، والوقت كـ08:00، والعنوان كما هو متوقع.
- تم الحفظ بنجاح وظهر العداد 2/8 مع ظهور المهمة كتركيز تالٍ.
- أزيلت المهمة الاختبارية من `personal-command-center-state-v2` بالمعرّف `task-1786970732557`، ولم يتبقَ تطابق لها.

## 2026-08-17 — تدقيق البحث الشامل: الديني
اكتمل اختبار نتيجة صلاة فعلية بالاستعلام «الفجر». كشفت الجولة أن النتيجة كانت تُفهرس تحت «الديني» لكنها تنتقل إلى `/religious` العام، رغم وجود بطاقة ثابتة بــ`id="prayer-tracker"`. أُصلحت الفجوة في `components/search/global-search-dialog.tsx` بتوجيه نتائج `religious.prayerLogs` إلى `/religious#prayer-tracker`. أُعيد الاختبار في المتصفح ونجح الانتقال إلى الرابط العميق وتموضع بطاقة «صلوات اليوم». كما عُدّل وصف البحث وplaceholder لذكر الأقسام المفهرسة فعليًا، دون تغيير البيانات أو الهوية البصرية.

حالة تغطية البحث التفاعلية الحالية: العادات، الملاحظات، المهام، خطة اليوم، المشاريع، الأهداف، الفلوس، الترفيه، والديني مجتازة بروابط عميقة. التذكيرات واليوميات تحتاج فقط إلى إعادة اختبار مباشر منفصل إذا لم تكن قد سُجلت في جولة سابقة.


## 2026-08-17 — دفعة التحقق العربي في الترفيه

أُضيف تحقق عربي يدوي لنموذج إضافة فيلم أو مسلسل داخل `components/entertainment/entertainment-workspace.tsx`، مع `noValidate` و`role="alert"` و`aria-invalid` و`aria-describedby`. اختُبرت حالة النموذج الفارغ، الاسم دون تصنيف، تصحيح الحقل، الحفظ الصحيح، والأرشفة والتنظيف. نجحت بوابات TypeScript وESLint و`git diff --check` وNext build، ثم أُعيدت فحوص ownership وresponsive وaccessibility: 45 route و41 مسارًا بملكية ظاهرة — PASS؛ 34 حالة responsive بلا فشل — PASS؛ 34 حالة accessibility بلا فشل — PASS. التفاصيل في `verification/entertainment-validation-ar-2026-08-17.md`.


### المصادقة — التحقق العربي — 2026-08-17
- في `/login` اختُبرت حالات الإرسال الفارغ، البريد غير الصالح، الاسم المفقود، وكلمة المرور القصيرة في وضعي تسجيل الدخول وإنشاء الحساب؛ ظهرت رسائل عربية محلية واضحة دون إنشاء حساب أو تنفيذ مصادقة ناجحة.
- لم تُستخدم بيانات شخصية أو credentials تشغيلية. الحالة: PASS ضمن التحقق المحلي، مع إبقاء اختبار Better Auth الفعلي خارج الجولة لعدم وجود حساب تشغيل مخصص.
- التقرير المستقل: `verification/auth-validation-ar-2026-08-17.md`.

## 2026-08-17 — دفعة التحقق العربي في الأهداف

أُغلقت فجوة الاعتماد على رسالة المتصفح الإنجليزية في نموذج إنشاء الهدف داخل `components/goals/goals-workspace.tsx`. الإرسال الفارغ يعرض `اكتب اسم الهدف أولًا` في رسالة عربية مخصصة مع `role="alert"`، ويدعم الحقل `aria-invalid` و`aria-describedby`. نجح إدخال هدف اختباري وحفظه، ثم أُرشف من الواجهة المرئية ونُظفت البيانات الاختبارية. نجحت بوابات TypeScript وESLint و`git diff --check` وNext build، كما مرّت فحوص ownership على 45 Route Handler، وresponsive على 34 حالة بلا فشل، وaccessibility على 34 حالة بلا فشل. التقرير المستقل: `verification/goals-validation-ar-2026-08-17.md`.


## دفعة إصلاح التحقق العربي في التذكيرات — 2026-08-17
أُغلقت فجوة UX في نموذج إنشاء التذكير داخل `components/reminders/reminders-workspace.tsx`. أُلغي الاعتماد على رسالة المتصفح الافتراضية، وأضيفت رسالة عربية inline لعنوان التذكير مع ربط ARIA ومسح الخطأ أثناء الكتابة، دون تغيير منطق التخزين أو الهوية البصرية. اختُبرت حالة الإرسال الفارغ، ثم إدخال `اختبار تحقق التذكير` وحفظ السجل وأرشفته عبر الواجهة المرئية، وعاد العدد إلى حالته السابقة. التقرير المستقل: `verification/reminders-validation-ar-2026-08-17.md`. وقت القياس الأساسي: `2026-08-17T13:44:44Z`. يلزم اعتماد بوابات الجودة وفحوص ownership وresponsive وaccessibility قبل commit.
**الحالة:** اختبار المتصفح مكتمل؛ بوابات الاعتماد قيد التنفيذ.

## إعادة التدقيق المرحلي الشامل — 2026-08-17

أُعيد تشغيل بوابات ownership وresponsive وaccessibility على الشجرة النظيفة بعد آخر دفعات التحقق العربي والبحث والديني. القياس الفعلي من ساعة النظام: `2026-08-17T13:50:19Z`–`2026-08-17T13:51:37Z`.

| البوابة | النتيجة |
|---|---|
| Ownership | PASS — 45 Route Handler؛ 41 لها session وvisible ownership |
| Responsive | PASS — 34/34 حالة، `failures: []` |
| Accessibility | PASS — 34/34 حالة، 0 failures، `failureSummary: []` |

المرجع الخام: `verification/final-review-audits-2026-08-17.log`. التقرير: `verification/final-review-audit-2026-08-17.md`. أُعيدت artifacts المولدة من responsive إلى النسخ الملتزمة بعد حفظ القياس النصي.


## 2026-08-17 — خطة اليوم: تحقق عربي لمساري التعديل والنقل

أُغلقت فجوة الفشل الصامت في تعديل عنوان عنصر خطة اليوم ونقله. اختُبر رفض العنوان الفارغ برسالة عربية inline، ومسح الخطأ أثناء إعادة العنوان، ثم الحفظ الصحيح. واختُبر رفض تاريخ النقل الفارغ، ثم نقل العنصر إلى `2026-08-17` وإرجاعه إلى `2026-08-16` مع التحقق البصري من ظهوره في اليوم الوسيط ثم عودته إلى موضعه الأصلي. لم تُنشأ سجلات جديدة ولم تُترك بيانات اختبار.

الأدلة: `components/daily-plan/daily-plan-workspace.tsx`، `verification/daily-plan-validation-ar-2026-08-17.md`، `verification/daily-plan-validation-quality-20260817T141123Z.log`، و`verification/interaction-smoke-tests.md`.

النتيجة: PASS — TypeScript، ESLint، diff check، Next build، ownership (45/45 Route Handler؛ 41 session و41 visible ownership)، responsive (34/34)، accessibility (34/34).


## 2026-08-17 — الحساب: تحقق عربي للاسم
أُغلقت فجوة الفشل الصامت في نموذج تفضيلات الحساب: الإرسال باسم فارغ يعرض `اكتب اسمك أولًا.` inline مع `noValidate` وARIA، وإدخال `اختبار الإعداد` يمسح الخطأ ثم يحفظ بنجاح. لم تتغير بيانات المستخدم ولم تُترك بيانات اختبار. الأدلة: `components/account/account-workspace.tsx`، `verification/account-validation-ar-2026-08-17.md`، `verification/account-validation-quality-20260817T141801Z.log`، و`verification/account-validation-audits-20260817T141920Z.log`. النتيجة: PASS — 45 Route Handler ownership، و34/34 responsive، و34/34 accessibility، إضافة إلى TypeScript وESLint وdiff check وNext build.


## 2026-08-17 — التقويم: تحقق عربي لحقول الحدث

أُغلقت فجوة التحقق في نموذج إنشاء الحدث داخل `components/calendar/calendar-workspace.tsx`. أُرسل العنوان والتاريخ ووقت البداية فارغًا بالتتابع، وجُرّبت نهاية أسبق من البداية؛ ظهرت رسائل عربية inline مرتبطة بـARIA، ثم اختفت أثناء تصحيح الحقول. حُفظ حدث اختباري صحيح، ثم حُذف من الواجهة وعادت بيانات التقويم الأصلية.

الأدلة: `verification/calendar-validation-ar-2026-08-17.md`، `verification/calendar-validation-quality-20260817T142300Z.log`، `verification/calendar-validation-audits-20260817T142523Z.log`، و`verification/interaction-smoke-tests.md`.

النتيجة: PASS — TypeScript، ESLint، diff check، Next build، ownership (45 Route Handler؛ 41 session و41 visible ownership)، responsive (34/34)، accessibility (34/34).
