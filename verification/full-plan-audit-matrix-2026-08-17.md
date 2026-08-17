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


## دفعة تحقق دفعات المشاريع — 2026-08-17

أُغلقت فجوة التحقق في `components/projects/projects-workspace.tsx` لنموذج إنشاء الدفعات ومحرر تعديلها. اختُبر رفض عنوان الدفعة الفارغ، ورفض المبلغ الفارغ، ومسح الرسائل أثناء الكتابة، ثم إنشاء دفعة صحيحة بمبلغ `1000` وإلغاؤها من الواجهة. كما اختُبر المساران نفسيهما داخل محرر التعديل وأُعيدت القيم الصحيحة دون تغيير بيانات المستخدم.

الأدلة: `verification/project-pricing-validation-ar-2026-08-17.md`، `verification/project-pricing-validation-quality-20260817T142931Z.log`، و`verification/project-pricing-audits-20260817T143233Z.log`. النتيجة: TypeScript وESLint و`git diff --check` و`next build` ناجحة؛ ownership `PASS` مع 45 Route Handler و41 مسارًا مع جلسة وملكية ظاهرة؛ responsive `PASS` (34/34)؛ accessibility `PASS` (34/34).

## 2026-08-17 — دفعة مساحة العمل والعملاء

أُغلقت فجوة التحقق الصامت في `components/workspace/workspace-workspace.tsx`. اختُبر رفض اسم مساحة العمل الفارغ، ثم إنشاء مساحة `مساحة اختبار التحقق` بعد مسح الخطأ. داخلها اختُبر رفض اسم العميل الفارغ، ورفض البريد الاختياري `invalid-email`، ثم نجاح الإنشاء بعد إدخال `test@example.com`. أُرشِف العميل وأُزيلت مساحة الاختبار وبياناتها من localStorage، وبقيت بيانات المستخدم الأصلية.

الأدلة: `verification/workspace-validation-ar-2026-08-17.md`، `verification/workspace-validation-quality-20260817T143610Z.log`، `verification/workspace-validation-audits-20260817T143853Z.log`. البوابات: TypeScript وESLint وdiff check وNext build PASS؛ ownership `45/45` مع 41 route مملوكًا ظاهرًا؛ responsive `34/34`؛ accessibility `34/34`. **الحالة: PASS — فجوة UX مغلقة ولا توجد بيانات اختبار متبقية.**

## 2026-08-17 — دفعة onboarding
أُغلقت فجوة التحقق الصامت في حقل الاسم الإلزامي داخل `components/onboarding/onboarding-flow.tsx`. رفض المسار الاسم الفارغ برسالة عربية inline مرتبطة بـARIA، ومسح الخطأ أثناء الكتابة، ثم نجح المسار الكامل حتى شاشة النجاح. بعد ذلك استُعيدت الحالة المحلية الأصلية وتحقق عدم بقاء بيانات اختبار.

الأدلة: `verification/onboarding-validation-ar-2026-08-17.md`، `verification/onboarding-validation-quality-20260817T144336Z.log`، `verification/onboarding-validation-audits-20260817T145455Z.log`.

النتيجة: **PASS** — TypeScript، ESLint، `git diff --check`، Next build؛ ownership `45` Route Handler (`41` session و`41` visible ownership)؛ responsive `34/34`؛ accessibility `34/34`.

## 2026-08-17 — اليوميات: تحقق عربي ورسائل وصول

| البند | التنفيذ | التحقق | الأدلة | الحالة |
|---|---|---|---|---|
| رفض اليوميات الفارغة | رسالة `اكتب عنوانًا أو سطرًا واحدًا على الأقل قبل الحفظ.` inline مع `role="alert"` و`aria-live="assertive"`، و`aria-invalid`/`aria-describedby` | أُرسل النموذج فارغًا في `/journal` ولم تُنشأ تدوينة | `components/journal/journal-workspace.tsx`، `verification/journal-validation-ar-2026-08-17.md` | PASS |
| مسح الخطأ والحفظ | يمسح الإدخال العربي الخطأ أثناء الكتابة؛ النجاح يظل بإعلان `polite` | أُدخل عنوان ونص عربيان، فارتفع العداد من 1 إلى 2 وظهرت التدوينة | `verification/journal-validation-quality-20260817T145949Z.log` | PASS |
| الأرشفة والاستعادة | لا حذف نهائي؛ أُرشفت التدوينة التجريبية وأعيدت الحالة الأصلية | عاد العداد إلى 1 وبقيت التدوينة الأصلية وحدها بعد إعادة التحميل | `verification/journal-validation-ar-2026-08-17.md` | PASS |
| الملكية والاستجابة والوصول | لم تتغير مسارات البيانات أو تصميم RTL؛ الفحوص العامة بعد التعديل | ownership: `45` route، `41` session، `41` visible؛ responsive `34/34`؛ accessibility `34/34` | `verification/journal-validation-audits-20260817T150228Z.log` | PASS |

## 2026-08-17 — القسم الديني: تحقق عربي للنماذج

| النطاق | التغيير | اختبار التفاعل | Build / ownership | Responsive / accessibility | الحالة | الأدلة |
|---|---|---|---|---|---|---|
| الأدعية المحفوظة | إضافة تحقق عربي مرئي للحقل الفارغ مع `noValidate` و`role="alert"` وARIA ومسح الخطأ أثناء الكتابة | رفض فارغ، مسح الخطأ، حفظ دعاء عربي تجريبي، ثم حذف العنصر وإعادة الحالة الأصلية | TypeScript وESLint و`git diff --check` وNext build PASS؛ ownership `45` route، `41` session، `41` visible ownership | responsive `34/34`؛ accessibility `34/34` و0 failures | PASS | `components/religious/religious-workspace.tsx`، `verification/religious-validation-ar-2026-08-17.md`، `verification/religious-validation-quality-20260817T150746Z.log` |
| قوائم التلاوة | إضافة تحقق عربي مرئي لاسم القائمة الفارغ مع `noValidate` و`role="alert"` وARIA ومسح الخطأ أثناء الكتابة | رفض فارغ، مسح الخطأ، إنشاء `قائمة تلاوة تجريبية`، ثم إزالة القائمة دون بيانات متبقية | نفس بوابات الجودة والملكية أعلاه | نفس نتائج responsive وaccessibility أعلاه | PASS | `components/religious/religious-workspace.tsx`، `verification/religious-validation-audits-20260817T151007Z.log` |

## 2026-08-17 — Quick Add: إغلاق فجوة التحقق
| النطاق | التغيير | اختبار التفاعل | Build / ownership | Responsive / accessibility | الحالة | الأدلة |
|---|---|---|---|---|---|---|
| Quick Add للمهمة | إضافة `noValidate` وARIA للحقل الأساسي ورسالة رفض عربية ومسح الخطأ أثناء الكتابة، مع الحفاظ على parser والتصميم الحالي | رفض فارغ، مسح الخطأ، معاينة، حفظ مهمة عربية، ثم إزالة المهمة التجريبية المحددة واستعادة الحالة الأصلية | TypeScript وESLint و`git diff --check` وNext build PASS؛ ownership `45` route، `41` session، `41` visible ownership | responsive `34/34`؛ accessibility `34/34` و0 failures | PASS | `components/layout/top-nav.tsx`، `verification/quick-add-validation-ar-2026-08-17.md`، `verification/quick-add-validation-quality-20260817T151414Z.log`، `verification/quick-add-validation-audits-20260817T151622Z.log` |

## 2026-08-17 — المهام: تحقق عربي للنماذج

| النطاق | التنفيذ والتحقق | Ownership | Responsive | Accessibility | Quality gates | الحالة | الأدلة |
|---|---|---:|---:|---:|---|---|---|
| تعديل المهمة | رفض عنوان فارغ برسالة `اكتب عنوان المهمة والموعد والتصنيف أولًا.` مع `role="alert"` وARIA؛ مسح الخطأ أثناء الكتابة وإبقاء البيانات الأصلية | PASS — 45 route، 41 session، 41 visible ownership | PASS — 34/34 | PASS — 34/34، 0 failures | TypeScript، ESLint، diff check، Next build PASS | PASS | `components/tasks/tasks-workspace.tsx`، `verification/tasks-validation-ar-2026-08-17.md`، `verification/tasks-validation-quality-20260817T152030Z.log` |
| الخطوة الفرعية | رفض الاسم الفارغ برسالة `اكتب الخطوة الفرعية أولًا.`؛ مسح الخطأ، إضافة `تجهيز ملخص اليوم`، ثم حذف العنصر التجريبي وعودة العداد للصفر | PASS — نفس نتائج الملكية | PASS — 34/34 | PASS — 34/34، 0 failures | نفس البوابات PASS | PASS | `components/tasks/tasks-workspace.tsx`، `verification/tasks-validation-ar-2026-08-17.md`، `verification/tasks-validation-audits-20260817T152404Z.log` |

## 2026-08-17 — الأهداف: تحقق عربي لإضافة مهمة مرتبطة بالهدف
| النطاق | التنفيذ والتحقق | Ownership | Responsive | Accessibility | Quality gates | الحالة | الأدلة |
|---|---|---:|---:|---:|---|---|---|
| مهمة الهدف | إضافة `noValidate` وARIA ورسالة `اكتب مهمة الهدف أولًا.` عند الإرسال الفارغ، مع مسح الخطأ أثناء الكتابة والحفاظ على منطق الإضافة والعلاقات | PASS — 45 route، 41 session، 41 visible ownership | PASS — 34/34 | PASS — 34/34، 0 failures | TypeScript، ESLint، diff check، Next build PASS | PASS | `components/goals/goals-workspace.tsx`، `verification/goals-validation-ar-2026-08-17.md`، `verification/goals-validation-quality-20260817T152817Z.log`، `verification/goals-validation-audits-verified-20260817T153128Z.log` |
| دورة المتصفح والتنظيف | رفض فارغ، مسح الخطأ، حفظ `مراجعة خطة الإطلاق`، ثم حذف المهمة التجريبية وحدها وإعادة التحميل؛ عاد العداد إلى الحالة الأصلية دون بيانات متبقية | PASS | PASS | PASS | موثق في التقرير المستقل | PASS | `verification/goals-validation-ar-2026-08-17.md` |

## 2026-08-17 — المال: تحقق عربي لنموذج الميزانية
| النطاق | التنفيذ والتحقق | Build / ownership | Responsive | Accessibility | الحالة | الأدلة |
|---|---|---|---|---|---|---|
| ميزانية الشهر | إضافة `noValidate` وARIA ورسالة رفض عربية للقيمة الفارغة أو غير الصالحة، ومسح الخطأ أثناء الكتابة؛ اختبار رفض فارغ، إدخال `13000` وحفظه، ثم استعادة `12000` دون تغيير العمليات | TypeScript وESLint و`git diff --check` وNext build PASS؛ ownership PASS — 45 route، 41 session، 41 visible ownership | PASS — 34/34 | PASS — 34/34، 0 failures | PASS | `components/money/money-workspace.tsx`، `verification/money-budget-validation-ar-2026-08-17.md`، `verification/money-budget-validation-quality-20260817T153525Z.log`، `verification/money-budget-validation-audits-20260817T153732Z.log` |

## 2026-08-17 — المشاريع: تحقق عربي لمهمة المشروع المرتبطة
| النطاق | التغيير | اختبار التفاعل | Build / ownership | Responsive / accessibility | الحالة | الأدلة |
|---|---|---|---|---|---|---|
| إضافة مهمة للمشروع | `noValidate` وARIA ورسالة رفض عربية inline عند الاسم الفارغ، مع مسح الخطأ أثناء الكتابة والحفاظ على منطق `projectId` | رفض فارغ، مسح الخطأ بعد إدخال `مراجعة بنية المشروع`، إنشاء المهمة مؤقتًا ثم حذفها وإزالة سطر خطة اليوم المرتبط؛ عادت القائمة إلى حالتها الأصلية | TypeScript وESLint و`git diff --check` وNext build PASS؛ ownership PASS — 45 route، 41 session، 41 visible ownership | responsive PASS — 34/34؛ accessibility PASS — 34/34، 0 failures | PASS | `components/projects/projects-workspace.tsx`، `verification/project-task-validation-ar-2026-08-17.md`، `verification/project-task-validation-quality-20260817T154102Z.log`، `verification/project-task-validation-audits-20260817T154313Z.log` |

## 2026-08-17 — المصادقة: أخطاء الحقول العربية المرتبطة
| النطاق | التغيير | اختبار التفاعل | Build / ownership | Responsive / accessibility | الحالة | الأدلة |
|---|---|---|---|---|---|---|
| أخطاء الاسم والبريد وكلمة المرور | فصل أخطاء الحقول عن الخطأ العام، وربطها عبر `aria-describedby` و`aria-invalid`، مع الحفاظ على Better Auth وتدفق البريد/كلمة المرور دون OAuth | رفض البريد الفارغ، مسح الخطأ بإدخال `test@example.com`، رفض كلمة المرور `123`، مسحها بإدخال `12345678`، ثم رفض الاسم الفارغ في إنشاء الحساب ومسحه بإدخال `مستخدم تجريبي`؛ لم يُنفّذ دخول أو إنشاء حساب حقيقي | TypeScript وESLint و`git diff --check` وNext build PASS؛ ownership PASS — 45 route، 41 session، 41 visible ownership | responsive PASS — 34/34؛ accessibility PASS — 34/34، 0 failures | PASS | `components/auth/auth-form.tsx`، `verification/auth-field-errors-ar-2026-08-17.md`، `verification/auth-field-errors-audits-20260817T154857Z.log`، `verification/auth-field-validation-quality-20260817T154708Z.log` |

## 2026-08-17 — المراجعة الأسبوعية: تصحيح النص ودلالة حالة الحفظ
| النطاق | التغيير | اختبار التفاعل | Build / ownership | Responsive / accessibility | الحالة | الأدلة |
|---|---|---|---|---|---|---|
| قرار الأسبوع القادم وحالة المراجعة | تصحيح النص العربي الظاهر من `أضف كهمة للأسبوع` إلى `أضف كمهمة للأسبوع` وإضافة `aria-live="polite"` لحالة الحفظ الديناميكية، دون تغيير منطق التخزين أو إنشاء المهام | تحقق DOM من النص المصحح واختفاء النص القديم؛ إدخال `إنجاز تجريبي للمراجعة` أظهر `هناك نص غير محفوظ.`؛ لم يُنفذ حفظ أو اعتماد ولم تُنشأ مهمة | TypeScript وESLint و`git diff --check` وNext build PASS؛ ownership PASS — 45 route، 41 session، 41 visible ownership | responsive PASS — 34/34؛ accessibility PASS — 34/34، 0 failures | PASS | `components/review/weekly-review-workspace.tsx`، `verification/weekly-review-copy-aria-2026-08-17.md`، `verification/weekly-review-copy-aria-quality-20260817T160030Z.log`، `verification/visual-audit-findings-20260817T1555Z.md` |

## 2026-08-17 — إدارة تركيز الحوارات وإعادة التركيز إلى المشغّل
| النطاق | التغيير | اختبار التفاعل | Build / ownership | Responsive / accessibility | الحالة | الأدلة |
|---|---|---|---|---|---|---|
| Dialog العام وحوارات الإضافة السريعة والبحث والقائمة والتذكير | إضافة إدارة تركيز مشتركة تحترم autoFocus وتحصر Tab وتعيد التركيز إلى triggerRef عند الإغلاق، مع تمرير مراجع المشغّلات في الحوارات الرئيسية | فتح وإغلاق الإضافة السريعة والبحث والقائمة عبر Escape؛ دخل التركيز إلى العنصر الداخلي وعاد إلى الزر المشغّل، دون حفظ أو إنشاء أو حذف | TypeScript وESLint وdiff check وNext build PASS؛ ownership PASS — 45 route، 41 session، 41 visible ownership | responsive PASS — 34/34؛ accessibility PASS — 34/34، 0 failures | PASS | `components/ui/dialog.tsx`، `components/layout/top-nav.tsx`، `components/search/global-search-dialog.tsx`، `components/reminders/reminders-workspace.tsx`، `verification/dialog-focus-management-ar-2026-08-17.md`، `verification/dialog-focus-quality-20260817T162000Z.log`، `verification/dialog-focus-audits-20260817T162300Z.log` |

## 2026-08-17 — الحساب: حوارات التأكيد وإدارة التركيز
| النطاق | التغيير | اختبار التفاعل | Build / ownership | Responsive / accessibility | الحالة | الأدلة |
|---|---|---|---|---|---|---|
| مسح بيانات الجهاز وحذف الحساب | استبدال native confirm بحوارات Dialog عربية مستقلة مع triggerRef واستعادة التركيز إلى المشغّل | فتح الحوارات وإغلاقها بـ Escape أعاد التركيز إلى زر المشغّل، دون تنفيذ المسح أو الحذف أو إرسال DELETE | TypeScript وESLint وNext build PASS؛ ownership PASS — 45 route، 41 session، 41 visible ownership | responsive PASS — 34/34؛ accessibility PASS — 34/34، 0 failures | PASS | `components/account/account-workspace.tsx`، `components/ui/dialog.tsx`، `verification/account-confirm-dialog-ar-2026-08-17.md`، `verification/account-confirm-dialog-quality-20260817T163000Z.log`، `verification/account-confirm-dialog-audits-20260817T163100Z.log` |

## 2026-08-17 — القسم الديني: حالة تحميل القراء وإعادة المحاولة
| النطاق | التغيير | اختبار التفاعل | Build / ownership | Responsive / accessibility | الحالة | الأدلة |
|---|---|---|---|---|---|---|
| قائمة القراء في القسم الديني | فصل حالة القراء عن حالة القرآن، وإظهار نجاح/فشل صريحين مع رسالة عربية `role=status` وزر إعادة محاولة عند فشل المصدر الخارجي | اعتراض `/api/religious/reciters` أظهر `تعذر تحميل قائمة القراء` وزر `إعادة تحميل القراء`؛ بعد استعادة الشبكة وإعادة المحاولة ظهرت 31 خانة قارئ واختفى مسار الفشل، دون تشغيل صوت أو حفظ بيانات | TypeScript وESLint وdiff check وNext build PASS؛ ownership PASS — 45 route، 41 session، 41 visible ownership | responsive PASS — 34/34؛ accessibility PASS — 34/34، 0 failures | PASS | `components/religious/religious-workspace.tsx`، `verification/religious-reciter-retry-ar-2026-08-17.md`، `verification/religious-reciter-quality-20260817T163700Z.log`، `verification/religious-reciter-audits-20260817T163800Z.log` |

## 2026-08-17 — الحساب: إعلان رسائل نتيجة البيانات عبر status/live
| النطاق | التغيير | اختبار التفاعل | Build / ownership | Responsive / accessibility | الحالة | الأدلة |
|---|---|---|---|---|---|---|
| رسائل النسخ والاستعادة ونتائج عمليات الحساب | إضافة `role="status"` و`aria-live="polite"` و`aria-atomic="true"` إلى رسالة النتيجة دون تغيير منطق البيانات أو التصميم | تشغيل تنزيل النسخة المحلية أظهر الرسالة العربية وفحص DOM أثبت خصائص status/live/atomic؛ لم تُنفذ عمليات المسح أو حذف الحساب | TypeScript وESLint وNext build PASS؛ ownership PASS — 45 route، 41 session، 41 visible ownership | responsive PASS — 34/34؛ accessibility PASS — 34/34، 0 failures | PASS | `components/account/account-workspace.tsx`، `verification/account-status-announcement-ar-2026-08-17.md`، `verification/account-status-quality-20260817T164210Z.log`، `verification/account-status-audits-20260817T164300Z.log` |

## 2026-08-17 — مساحة العمل: إعلان حالة التحميل العربية
| النطاق | التغيير | اختبار التفاعل | Build / ownership | Responsive / accessibility | الحالة | الأدلة |
|---|---|---|---|---|---|---|
| تحميل مساحات العمل | إضافة `role=status` و`aria-live=polite` و`aria-busy=true` إلى رسالة التحميل العربية دون تغيير منطق الجلب أو fallback | تأخير طلب المساحات مؤقتًا داخل جلسة المتصفح، ثم إثبات ظهور `جاري تحميل المساحات...` وخصائص DOM أثناء التحميل واختفائها بعد النجاح، دون إنشاء أو تعديل بيانات | TypeScript وESLint وNext build PASS؛ ownership PASS — 45 route، 41 session، 41 visible ownership | responsive PASS — 34/34؛ accessibility PASS — 34/34، 0 failures | PASS | `components/workspace/workspace-workspace.tsx`، `verification/workspace-loading-status-ar-2026-08-17.md`، `verification/workspace-loading-status-quality-20260817T164800Z.log`، `verification/visual-audit-findings-20260817T1555Z.md` |

## 2026-08-17 — التقويم: إعلان نتائج العمليات المحلية

| البند | الحالة | الدليل |
|---|---|---|
| إعلان نتيجة الحفظ/التعديل/الحذف/تغيير الحالة | مكتمل | `components/calendar/calendar-workspace.tsx` يستخدم حالة `notice` ورسائل عربية بعد العمليات المحلية |
| دلالة قارئات الشاشة | مكتمل | عنصر الإشعار يحمل `role="status"` و`aria-live="polite"` و`aria-atomic="true"` |
| اختبار المتصفح | PASS | إنشاء «حدث تدقيق تجريبي» أظهر `تم حفظ الحدث محليًا.` مع خصائص DOM الصحيحة، ثم حُذف الحدث وعادت القائمة إلى 5 عناصر |
| TypeScript / ESLint / Next build | PASS | `verification/calendar-status-quality-20260817T165500Z.log` |
| Ownership | PASS | 45 route، 41 session، 41 visible ownership |
| Responsive | PASS | 34/34 حالة |
| Accessibility | PASS | 34/34 حالة، 0 failures |
| التوثيق | مكتمل | `verification/calendar-status-announcement-ar-2026-08-17.md` |

## 2026-08-17 — مساحة العمل: إعلان نتائج العمليات المحلية
| البند | النتيجة | الدليل |
|---|---|---|
| الفجوة | رسائل نجاح/أرشفة مساحة العمل والعميل كانت مرئية دون live-region مكتملة | `components/workspace/workspace-workspace.tsx` قبل الإصلاح |
| الإصلاح | إضافة `role="status"` و`aria-live="polite"` و`aria-atomic="true"` إلى عنصر `notice` مع الحفاظ على fallback المحلي والملكية | `components/workspace/workspace-workspace.tsx` |
| اختبار المتصفح | إنشاء «عميل تدقيق تجريبي» محليًا؛ ظهور `تم حفظ العميل محليًا.`؛ فحص DOM أكد `status/polite/true`؛ ثم أرشفة العميل وتنظيف الحالة | `verification/workspace-status-browser-test-2026-08-17.md` |
| TypeScript / ESLint / Build | PASS | `verification/workspace-status-quality-20260817T170017Z.log` |
| Ownership | PASS: `45` routes، `41` session، `41` visible ownership، بلا مسارات ناقصة | `verification/workspace-status-audits-20260817T170046Z.log` |
| Responsive | PASS: `34/34`، بلا failures | `verification/workspace-status-audits-20260817T170046Z.log` |
| Accessibility | PASS: `34/34`، `0` failures | `verification/workspace-status-audits-20260817T170046Z.log` |
| حدود الدليل | لا يثبت اتصال Neon أو جلسة Better Auth الإنتاجية لغياب credentials في البيئة الحالية | تقرير المتصفح |
| القرار | دفعة مكتملة وقابلة للاعتماد؛ لا تغيير في البيانات أو الأسرار أو التصميم | سجلات الدفعة |

## 2026-08-17 — دفعة اليوميات وmetadata العربية

- **اليوميات:** فُصلت تهيئة نموذج اليوميات عن مسح notice عند تحديث السجل، وأصبح إشعار النجاح live-region صريحًا عبر `role="status"` و`aria-live="polite"` و`aria-atomic="true"`؛ الخطأ يستخدم `alert/assertive`، والنص المساعد بلا notice لا يُعلن كمنطقة حية.
- **اختبار التفاعل:** حفظ تدوينة مؤقتة غير حساسة فأُعلنت الرسالة العربية، ثم أُرشفت التدوينة وعادت الحالة إلى تدوينة واحدة. فحص DOM أكد `status/polite/true`.
- **metadata:** عُوِّد عنوان `/money` من `الفلوس | Personal Command Center` إلى `الفلوس | مركز القيادة الشخصي`، وأثبت المتصفح عنوان الوثيقة العربي.
- **الجودة:** TypeScript PASS، ESLint PASS، Next build PASS، ownership PASS (`45` route، `41` session، `41` visible ownership)، responsive PASS (`34/34`)، accessibility PASS (`34/34`، `0` failures)، و`git diff --check` PASS بعد تنظيف artifacts.
- **الحدود:** لا تغيير في user ownership أو عقود API/DB أو localStorage fallback أو الأسرار، ولم تُنفذ `drizzle-kit generate`.
- **الأدلة:** `verification/journal-metadata-ar-2026-08-17.md`، `verification/journal-metadata-quality-20260817T170700Z.log`، `verification/journal-metadata-audits-20260817T170800Z.log`.

## 2026-08-17 — الأرشيف: إعلان نتائج الاستعادة بالعربية
| البند | النتيجة | الدليل |
|---|---|---|
| الفجوة | إشعار الاستعادة كان يحمل `role="status"` دون `aria-live` و`aria-atomic` مكتملتين | `components/archive/archive-workspace.tsx` قبل الإصلاح |
| الإصلاح | إضافة `aria-live="polite"` و`aria-atomic="true"` إلى إشعار الأرشيف مع إبقاء النص والتصميم ومنطق الاستعادة وfallback المحلي كما هي | `components/archive/archive-workspace.tsx` |
| اختبار المتصفح | استعادة عنصر اختبار غير حساس من `/archive`؛ DOM التقط `تمت استعادة «يوم هادئ للتجربة» إلى اليوميات.` بالقيم `role=status`, `aria-live=polite`, `aria-atomic=true`؛ ثم أُعيدت التدوينة إلى الأرشيف | `verification/archive-live-region-ar-2026-08-17.md` |
| TypeScript / ESLint / Build | PASS؛ تحذير middleware deprecated معلوماتي فقط | `verification/archive-live-quality-20260817T171220Z.log` |
| Ownership | PASS: `45` route، `41` session، `41` visible ownership، بلا مسارات ناقصة | `verification/archive-live-audits-20260817T171220Z.final.log` |
| Responsive | PASS: `34/34`، بلا failures | `verification/archive-live-audits-20260817T171220Z.final.log` |
| Accessibility | PASS: `34/34`، `0` failures | `verification/archive-live-audits-20260817T171220Z.final.log` |
| الحدود | لم يتغير API/DB أو user ownership أو الأسرار، ولم تُنفذ `drizzle-kit generate`؛ اتصال Neon والجلسة الإنتاجية خارج نطاق إثبات localStorage fallback | تقرير الدفعة |
| القرار | دفعة مكتملة وقابلة للاعتماد | تقرير الدفعة وسجلات الجودة |

## 2026-08-17 — PWA: live-region لإشعار التثبيت والتحديث
| البند | النتيجة | الدليل |
|---|---|---|
| الفجوة | إشعار PWA كان يستخدم `role="status"` دون `aria-live` و`aria-atomic` مكتملتين | `components/pwa/pwa-register.tsx` قبل الإصلاح |
| الإصلاح | إضافة `aria-live="polite"` و`aria-atomic="true"` إلى عنصر الإشعار مع الحفاظ على النص العربي ومنطق Service Worker والتثبيت والتحديث والإخفاء | `components/pwa/pwa-register.tsx` |
| اختبار المتصفح | خادم إنتاج على `http://localhost:3005/` مع سياق آمن وService Worker controller فعّال؛ محاولة `beforeinstallprompt` صناعية لم تُظهر prompt الأصلي، فسُجلت كدليل محدود لا كـPASS لظهور الحالة الأصلية | `verification/pwa-live-browser-test-2026-08-17.md` |
| TypeScript / ESLint / Build | PASS؛ تحذير middleware deprecated معلوماتي فقط | `verification/pwa-live-quality-20260817T172300Z.log` |
| Ownership | PASS: `45` route، `41` session، `41` visible ownership، بلا مسارات ناقصة | `verification/pwa-live-audits-20260817T172400Z.log` |
| Responsive | PASS: `34/34`، بلا failures | `verification/pwa-live-audits-20260817T172400Z.log` |
| Accessibility | PASS: `34/34`، `0` failures | `verification/pwa-live-audits-20260817T172400Z.log` |
| الحدود | لا يثبت الاختبار ظهور prompt الحقيقي على كل متصفح؛ يثبت تعديل live-region والبوابات فقط. لا تغييرات API/DB أو ownership أو الأسرار، ولم تُنفذ `drizzle-kit generate` | `verification/pwa-live-region-ar-2026-08-17.md` |
| القرار | الإصلاح مكتمل وقابل للاعتماد، مع إبقاء قيد اختبار prompt موثقًا | تقرير الدفعة وسجلات الجودة |
