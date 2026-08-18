# محضر إغلاق المرحلة السادسة — التلميع والروابط العميقة

**التاريخ:** 2026-08-18
**النطاق:** توحيد الروابط العميقة وعلاقات السياق في واجهات Personal Command Center، مع إعادة اختبار البناء والاستجابة والوصول والملكية والفحص البصري.
**الحالة:** جاهزة للاعتماد بعد commit ورفع GitHub.

## الملخص التنفيذي

أُغلقت دفعة المرحلة السادسة المستهدفة بإضافة عقد مركزي للروابط العميقة، ثم تطبيقه على Weekly Review وخطة اليوم والملاحظات والبحث والعادات والتقويم والقسم الديني والفلوس. الهدف هو منع اختلاف صيغ anchors بين المجالات، بحيث تقود الروابط من السياق الحالي إلى العنصر الصحيح دون فقدان المستخدم لموضعه.

لم تُضف بيانات تجريبية جديدة خلال جولة التحقق الأخيرة، ولم تُجرَ أي عملية مالية أو تعديل ديني أو تغيير دائم في بيانات المستخدم.

## المطابقة البندية

| البند | التنفيذ | الأدلة | الحالة |
|---|---|---|---|
| توحيد روابط المهمة والعادة والمشروع والهدف | إنشاء `lib/context-links.ts` بعقد typed لدوال `contextHref` وأنواع السياق | `lib/context-links.ts` | مغلق |
| Weekly Review | استبدال صيغ الروابط الموضعية بالـhelper المركزي لعلاقات المهمة والعادة والمشروع والهدف | `components/review/weekly-review-workspace.tsx` | مغلق |
| Daily Plan | توحيد روابط المهمة والعادة والمشروع والهدف مع إبقاء روابط الصلاة والورد ضمن المسارات الدينية | `components/daily-plan/daily-plan-workspace.tsx` | مغلق |
| Notes وGlobal Search | توحيد روابط نتائج الملاحظات والبحث الشامل مع الحفاظ على التجميع العربي والانتقال السياقي | `components/notes/notes-workspace.tsx`, `components/search/global-search-dialog.tsx` | مغلق |
| Habits وCalendar وReligious وMoney | إزالة الصيغ الموضعية المتبقية وربطها بعقد السياق المركزي | `components/habits/habits-workspace.tsx`, `components/calendar/calendar-workspace.tsx`, `components/religious/religious-workspace.tsx`, `components/money/money-workspace.tsx` | مغلق |
| الحفاظ على الهوية وRTL | عدم تغيير الألوان أو التخطيط أو نصوص الواجهة؛ التعديل اقتصر على href وعقد الروابط | الفحص البصري للمسارات الرئيسية | مغلق |
| عدم لمس قاعدة البيانات أو migration journal | لم يُشغّل `drizzle-kit generate` ولم تُعدّل migrations أو schema | سجل المرحلة الخامسة وقواعد المشروع | مغلق |

## عقد الروابط الناتج

يعرّف helper المركزي الأنواع التالية: `task`, `habit`, `project`, `goal`, `prayer`, `quran`, و`finance`. وتستخدم الدالة `contextHref` المسارات والـanchors التالية:

| النوع | المسار | شكل الـanchor |
|---|---|---|
| المهمة | `/tasks` | `task-{id}` |
| العادة | `/habits` | `{id}` |
| المشروع | `/projects` | `{id}` |
| الهدف | `/goals` | `{id}` |
| الصلاة | `/religious` | `prayer-tracker` |
| الورد | `/religious` | `quran-progress` |
| الفلوس | `/money` | `{id}` |

هذا العقد لا يفرض تغييرًا على بيانات العناصر، بل يثبت طريقة توليد الروابط في الواجهة ويقلل احتمال ظهور رابط إلى anchor غير موجود.

## بوابات الجودة

| البوابة | النتيجة | الملاحظة |
|---|---|---|
| TypeScript | PASS | نجح بعد إضافة helper وتطبيقه على المكونات المتأثرة. |
| ESLint | PASS | لا توجد imports غير مستخدمة أو أخطاء lint جديدة. |
| Webpack build | PASS | نجح build الإنتاج بحد الذاكرة الآمن المستخدم في المشروع. |
| Route ownership | PASS | لم تُضف مسارات جديدة ولم يتغير حارس الملكية. |
| Responsive audit | PASS بعد إعادة تشغيل خادم 3004 من build الحالي | أُعيد تشغيل التدقيق بعد معالجة artifacts القديمة وchunks المفقودة. |
| Accessibility audit | PASS بعد إعادة تشغيل خادم 3004 من build الحالي | لم يظهر تراجع في الأدوار أو الحقول أو التنقل. |
| Browser visual check | PASS | تم فحص `/review`, `/notes`, `/habits`, `/calendar`, و`/money` على RTL. |
| Git diff check | PASS | مرّ `git diff --check` بعد تنظيف artifacts. |

## الفحص البصري

أظهر `/habits` روابط المشروع والهدف بصيغ anchors الموحدة مثل `/projects#project-3` و`/goals#goal-2`. وأظهر `/calendar` روابط مصادر الأحداث في سياقها دون overflow ظاهر. كما أظهر `/money` روابط السياق مثل `/projects#project-1` و`/goals#goal-1` مع بقاء تخطيط RTL سليمًا. لم تُنشأ بيانات اختبار جديدة أثناء الجولة الأخيرة.

## الملفات المعدلة

- `lib/context-links.ts`
- `components/review/weekly-review-workspace.tsx`
- `components/daily-plan/daily-plan-workspace.tsx`
- `components/notes/notes-workspace.tsx`
- `components/search/global-search-dialog.tsx`
- `components/habits/habits-workspace.tsx`
- `components/calendar/calendar-workspace.tsx`
- `components/religious/religious-workspace.tsx`
- `components/money/money-workspace.tsx`

## الحدود المتبقية

لا تزال اختبارات Neon/Better Auth الإنتاجية الكاملة مشروطة بتوفير credentials صالحة، كما يظل اختلاف Drizzle migration journal قائمًا ولذلك لم يتم توليد migration جديد. لا يمثل ذلك فشلًا في تعديل الروابط العميقة الحالي، لكنه حد معروف يجب أن يبقى موثقًا قبل أي دفعة قواعد بيانات لاحقة.

## قرار الإغلاق

تُعتبر المرحلة السادسة مغلقة وظيفيًا ضمن نطاقها المحدد: **توحيد الروابط العميقة وعلاقات السياق مع نجاح بوابات البناء والتدقيق والفحص البصري**. الخطوة التالية هي إنشاء commit ورفعه إلى `origin/main`، ثم تنفيذ انتظار فعلي قدره 120 ثانية من ساعة النظام قبل استخراج نطاق المرحلة السابعة.
