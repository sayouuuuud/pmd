# محضر جودة المرحلة الحادية عشرة — المكتبة والموارد والملفات

**التاريخ:** 18 أغسطس 2026

**المشروع:** Personal Command Center

**نطاق المرحلة:** إنشاء مكتبة عربية محلية للروابط والقوالب والمستندات والفيديوهات والملفات، مع البحث والتصفية والمفضلة والأرشفة والاسترجاع والربط بالعميل أو المشروع، ودعم حفظ بيانات المرفقات محليًا دون رفع محتواها، وتجهيز طبقة قاعدة البيانات في ملف SQL مؤجل.

## نتيجة الإغلاق

اكتمل التنفيذ المحلي والواجهاتي للمرحلة الحادية عشرة. أضيف مسار `/library` إلى الملاحة الرئيسية، وأنشئت واجهة مكتبة متوافقة مع الهوية البصرية الحالية وRTL، مع عقد `Resource` و`ResourceAttachment` داخل المتجر المركزي، وتطبيع آمن، وتخزين واستيراد وتصدير وإعادة ضبط محلي للموارد. المرفقات الحالية metadata-only: تحفظ الواجهة الاسم والحجم ونوع MIME وتاريخ الإنشاء، ولا ترفع محتوى الملف إلى أي خدمة.

اجتازت التعديلات TypeScript وESLint وبناء الإنتاج وتدقيق ملكية المسارات وتدقيق الاستجابة وتدقيق إمكانية الوصول. اختُبرت صفحة `/library` بصريًا وتفاعليًا على `localhost:3004` بعد تشغيل آخر build، بما في ذلك اختيار ملف محلي، إنشاء مورد عربي من نوع ملف، ظهور المرفق وحجمه، البحث، التصفية بنوع الملف، المفضلة، الأرشفة، تبويب الأرشيف، والاسترجاع. لم يظهر إخراج في Console بعد التفاعلات.

ملف SQL موجود في `sql/phase-11-library-resources-files.sql` وموسوم بوضوح بأنه **مؤجل**؛ لم يُشغّل على Neon، ولم تُشغّل `drizzle-kit generate` التزامًا بالقيد الخاص باختلاف سجل migrations.

## المطابقة التفصيلية

| البند | التنفيذ | الحالة |
|---|---|---|
| عقد الموارد | إضافة `ResourceType` و`ResourceAttachment` و`Resource` كأنواع exported في `lib/command-center-store.tsx` | مكتمل محليًا |
| البيانات التجريبية | إضافة `initialResources` بموارد عربية واقعية تشمل رابطًا وقالبًا | مكتمل محليًا |
| التطبيع والحماية | إضافة `normalizeResourceAttachments` و`normalizeResource` مع حدود وأنواع آمنة قبل hydration | مكتمل محليًا |
| دورة التخزين المحلي | توسيع `PersistedState` و`getDefaultState` وربط resources بالـhydration وlocalStorage والتصدير والاستيراد وإعادة الضبط | مكتمل محليًا |
| إجراءات المكتبة | `addResource` و`updateResource` و`archiveResource` و`restoreResource` و`toggleResourceFavorite` | مكتمل محليًا |
| صفحة المكتبة | إنشاء `app/library/page.tsx` باستخدام `PageShell` و`LibraryWorkspace` | مكتمل محليًا |
| واجهة المكتبة | بحث بالعنوان والوسوم، تصفية بالنوع، تبويبات النشطة والمفضلة والأرشيف، بطاقات، حالات فارغة، وروابط السياق | مكتمل محليًا |
| المرفقات المحلية | اختيار ملفات متعددة، تحويل metadata إلى `ResourceAttachment[]` عند الحفظ، وعرض الاسم والحجم وMIME/الشارة محليًا | مكتمل محليًا |
| ربط السياق | اختيار العميل والمشروع من البيانات المحلية وعرض العلاقة في بطاقة المورد | مكتمل محليًا |
| الملاحة | إضافة `/library` إلى `top-nav.tsx` لتظهر في الملاحة الرئيسية والاختصار السريع | مكتمل محليًا |
| طبقة قاعدة البيانات | تجهيز جدول `library_resource_attachment` وفهارس الملكية/المساحة/المورد، وجدول علاقات الموارد، وفهرس tags في SQL منفصل | SQL مؤجل |
| الملكية والخصوصية | عقود SQL تحمل `user_id` و`workspace_id` حيث يلزم، والواجهة الحالية local-first ولا تدعي تخزينًا إنتاجيًا | محضر ومخطط مؤجل |

## بوابات الجودة

| البوابة | النتيجة |
|---|---|
| `pnpm exec tsc --noEmit` | PASS — exit 0 |
| `pnpm lint` | PASS — exit 0؛ سجل ESLint لا يحتوي أخطاء |
| `NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=2048 pnpm exec next build --webpack` | PASS؛ شملت المخرجات `/library` ضمن المسارات الثابتة، وظهرت تحذيرات Next.js المعروفة فقط دون فشل البناء |
| `python3 scripts/audit_route_ownership.py` | PASS — `route_count=48`، و`routes_with_session=44`، و`routes_with_visible_ownership=44`، والقوائم الناقصة فارغة |
| `python3 scripts/responsive-audit.py` | PASS — `total=34` و`failures=[]`، ولا يوجد overflow أفقي في القياسات المسجلة؛ أخطاء MIME/500 القديمة أثناء تشغيل الخادم سُجلت كأخطاء موارد منفصلة ثم زالت بعد إعادة تشغيل الخادم على آخر build |
| `python3 scripts/accessibility-audit.py` | PASS — `total=34` و`failures=0` |
| Browser visual/interactions | PASS — `/library` على `localhost:3004`: إضافة ملف محلي، حفظ مورد عربي، عرض المرفق `134` بايت، البحث، فلتر `ملف`, تفعيل المفضلة، الأرشفة، تبويب الأرشيف، الاسترجاع، وظهور المورد مجددًا |
| Browser Console | PASS — لا يوجد Console output بعد التفاعلات |
| Git diff review | مكتمل؛ ستُستبعد الملفات المؤقتة وملفات build/cache ولقطات التدقيق المولدة غير الخاصة بالمرحلة من commit |

## ملف SQL المؤجل

الملف `sql/phase-11-library-resources-files.sql` يضم جدول `library_resource_attachment` مع `user_id` و`workspace_id` و`resource_id` وmetadata الملف و`storage_key` و`checksum` و`archived_at`، مع منع الأحجام السالبة وفهارس الملكية والمساحة والمورد. كما يضم جدول `library_resource_relation` لعلاقات المورد مع العميل أو المشروع أو تحديث المشروع أو حدث التقويم أو قيد مالي، مع uniqueness وفهرس الملكية، وفهرس GIN على `library_resource.tags`.

الملف لا يُشغّل من التطبيق أو من هذا المحضر. قبل تطبيقه يجب reconcile لسجل Drizzle، والتحقق من أسماء الجداول والأنواع في البيئة المنشورة، إضافة ومراجعة سياسات RLS، ثم اختباره على staging عبر مسار migrations المعتمد. لا يضيف الملف عمود `favorite` إلى `library_resource` لأن المفضلة في التنفيذ الحالي local-first داخل عقد `Resource`، ويجب تصميم ذلك العمود لاحقًا فقط إذا تقرر نقل المفضلة إلى التخزين الخادمي.

> لا يجوز تشغيل ملف SQL مباشرة على قاعدة الإنتاج قبل مراجعة الملكية وRLS وتعارض journal. وجود `COMMIT` داخل الملف لا يعني أنه نُفّذ.

## الحدود المعروفة

التنفيذ الحالي يغلق الشريحة المحلية والواجهية للمكتبة والموارد والمرفقات metadata-only، لكنه لا يرفع الملفات ولا ينشئ تخزينًا خادميًا أو signed URLs، ولا يطبق جداول العلاقات أو المرفقات على Neon. الربط الإنتاجي والمزامنة متعددة المستخدمين يظلان معتمدين على توفير credentials وحل اختلاف Drizzle journal. لا توجد أسرار أو بيانات اتصال داخل المستودع.

## قرار الاعتماد

**القرار:** اعتماد المرحلة الحادية عشرة محليًا وواجهياً، مع تسجيل طبقة قاعدة البيانات والتخزين كـSQL مؤجل. معيار الإغلاق متحقق: المستخدم يستطيع العثور على المورد أو الملف بسرعة، ومعرفة علاقته بالعميل أو المشروع، وإضافة روابط وقوالب وملفات وصفية، والبحث والتصفية والمفضلة والأرشفة والاسترجاع دون رفع محتوى الملف.

**الملفات الرئيسية:**

- `lib/command-center-store.tsx`
- `components/library/library-workspace.tsx`
- `app/library/page.tsx`
- `components/layout/top-nav.tsx`
- `sql/phase-11-library-resources-files.sql`
- `EXECUTION_PLAN.md`

**أدلة التشغيل المؤقتة:**

- `/tmp/pmd-phase11-build.log`
- `/tmp/pmd-phase11-lint.log`
- `/tmp/pmd-phase11-route-rerun.log`
- `/tmp/pmd-phase11-responsive-rerun.log`
- `/tmp/pmd-phase11-accessibility-rerun.log`
- Console log محفوظ محليًا في `/home/ubuntu/console_outputs/view_console_2026-08-18_14-08-49_145.log`
