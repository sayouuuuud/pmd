# سجل تحقق دفعة Finance

## نطاق الدفعة

أضيفت مساحة مالية عربية داخل `/money` لتسجيل الدخل والمصروفات، تحديد ميزانية شهرية، قراءة إجمالي الإنفاق والدخل والمتبقي، وتحليل المصروف حسب التصنيف. تدعم العملية المالية ارتباطًا اختياريًا بمشروع وهدف، مع أرشفة ناعمة بدل الحذف النهائي.

## التغييرات التقنية

أضيفت أنواع `FinanceEntry` و`Budget` إلى `CommandCenterProvider`، مع بيانات تجريبية وlocalStorage persistence وremote hydration وoptimistic mutations. أضيف جدول `finance_entry` وجدول `budget` إلى Drizzle schema، وأُنشئت migration رقم `0003_tough_raza.sql`. أضيفت endpoints التالية:

| Endpoint | الوظيفة |
|---|---|
| `GET/POST /api/finance` | قراءة وإضافة العمليات المالية مع فلترة المستخدم |
| `PATCH/DELETE /api/finance/:id` | تحديث أو أرشفة عملية مملوكة للمستخدم |
| `GET/PATCH /api/finance/budget` | قراءة أو تحديث الميزانية الشهرية للمستخدم |

كل عمليات القراءة والكتابة تبدأ باستخراج الجلسة، وكل العلاقات الاختيارية بالمشروع والهدف تتحقق من `user_id` نفسه.

## الاختبارات

| الاختبار | النتيجة |
|---|---|
| `./node_modules/.bin/tsc --noEmit` | ناجح بلا أخطاء |
| `pnpm exec drizzle-kit generate` | ناجح؛ migration `0003_tough_raza.sql` |
| `pnpm exec next build` | ناجح؛ ظهرت Finance routes في build |
| `git diff --check` | ناجح |
| صفحة `/money` | ناجحة بصريًا مع RTL وSemantic Tokens |
| إضافة عملية محليًا دون credentials | ناجحة؛ استُعيدت من localStorage بعد reload |
| `GET /api/finance` دون جلسة | `401 Unauthorized` |
| `POST /api/finance` دون جلسة | `401 Unauthorized` |
| `GET /api/finance/budget` دون جلسة | `401 Unauthorized` |
| `PATCH /api/finance/:id` دون جلسة | `401 Unauthorized` |

## القيود المعروفة

لا توجد credentials فعلية لـNeon أو Better Auth في البيئة الحالية، لذلك لم يُطبّق migration على قاعدة حقيقية ولم يُختبر ownership بين مستخدمين موثقين. عند توفير المتغيرات، يجب تشغيل migration على قاعدة Neon ثم اختبار المسارات بمستخدمين فعليين. كما أن العملية المحلية الحالية تحفظ فورًا، وقد لا ينعكس التغيير في العرض الحالي إلا بعد دورة إعادة تحميل في بعض حالات fallback؛ وقد ثبتت الاستعادة الصحيحة من localStorage.
