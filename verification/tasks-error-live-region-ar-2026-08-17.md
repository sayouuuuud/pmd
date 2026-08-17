# تقرير تحقق — live-region لخطأ نموذج المهام

**التاريخ:** 2026-08-17 UTC
**النطاق:** `components/tasks/tasks-workspace.tsx` — نموذج «مهمة جديدة» فقط.

## الفجوة

كان عنصر رسالة الخطأ `#new-task-error` يستخدم `role="alert"` ويرتبط بحقل العنوان عبر `aria-describedby`، لكنه لم يصرّح بـ`aria-live` و`aria-atomic`، ما جعل دلالة الإعلان تعتمد على السلوك الضمني للمتصفح.

## الإصلاح

أضيفت الخاصيتان `aria-live="assertive"` و`aria-atomic="true"` إلى عنصر الخطأ، مع إبقاء النص العربي `اكتب اسم المهمة أولًا قبل الإضافة.`، والتحقق المحلي، و`aria-invalid`، و`aria-describedby`، وتدفق إنشاء المهام كما هي. لم يتغير أي API أو جدول أو query أو منطق ownership، ولم تُضف أسرار، ولم تُنفذ `drizzle-kit generate`.

## اختبار المتصفح

فُتحت `http://localhost:3004/tasks`، ثم أُرسل نموذج «مهمة جديدة» فارغًا. ظهرت الرسالة العربية، وأثبت فحص DOM المباشر القيم التالية:

| الخاصية | القيمة |
|---|---|
| النص | `اكتب اسم المهمة أولًا قبل الإضافة.` |
| `role` | `alert` |
| `aria-live` | `assertive` |
| `aria-atomic` | `true` |
| `aria-describedby` في الحقل | `new-task-error` |
| `aria-invalid` في الحقل | `true` |

لم تُنشأ مهمة تجريبية؛ توقف الاختبار عند مسار التحقق المحلي.

## بوابات الجودة

| البوابة | النتيجة |
|---|---|
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm lint` | PASS |
| `pnpm build` | PASS؛ تحذير middleware المعلوماتي المعتاد فقط |
| ownership | PASS؛ 45 route، 41 session، 41 visible ownership، دون نقص |
| responsive | PASS؛ 34/34، دون إخفاق |
| accessibility | PASS؛ 34/34، صفر إخفاق |
| `git diff --check` | PASS بعد تنظيف سجل build |

## حدود التحقق

الاختبار يغطي نموذج إضافة المهمة وحالة الخطأ الفارغة. لا يشمل ذلك إعادة تصميم الواجهة، أو تغيير منطق قاعدة البيانات، أو اختبار مصادقة خارجية، أو تغيير عقود API.

**الحالة:** الإصلاح ناجح وجاهز للتوثيق المركزي والاعتماد كدفعة مستقلة.


## ملحق — دفعة تعديل المهمة والخطوة الفرعية

**النطاق الإضافي:** `task-edit-error` و`subtask-error` داخل نموذج تعديل المهمة ونموذج إضافة الخطوة الفرعية.

كانت الرسالتان تعرضان عبر `role="alert"` دون التصريح الصريح بـ`aria-live="assertive"` و`aria-atomic="true"`. أضيفت الخاصيتان مع الحفاظ على منطق التحقق والارتباطات الحالية.

### اختبار المتصفح وDOM

في `http://localhost:3004/tasks` تم تفريغ حقول العنوان والموعد والتصنيف في نموذج تعديل المهمة ثم إرساله. ظهرت الرسالة `اكتب عنوان المهمة والموعد والتصنيف أولًا.`، وأثبت DOM:

| الخاصية | القيمة |
|---|---|
| `role` | `alert` |
| `aria-live` | `assertive` |
| `aria-atomic` | `true` |
| `aria-describedby` | `task-edit-error` على الحقول الثلاثة |
| `aria-invalid` | `true` على الحقول الثلاثة |

كما تم فتح خطوات المهمة الأولى وإرسال نموذج إضافة الخطوة الفرعية فارغًا. ظهرت الرسالة `اكتب الخطوة الفرعية أولًا.`، وأثبت DOM:

| الخاصية | القيمة |
|---|---|
| `role` | `alert` |
| `aria-live` | `assertive` |
| `aria-atomic` | `true` |
| `aria-describedby` | `subtask-error` على حقل الخطوة الفرعية |
| `aria-invalid` | `true` على حقل الخطوة الفرعية |

الدليل التفصيلي محفوظ في `verification/tasks-error-browser-findings-2026-08-17.md`.

### بوابات الجودة والتدقيق

| البوابة | النتيجة |
|---|---|
| `pnpm exec tsc --noEmit` | PASS (`exit=0`) |
| `pnpm lint` | PASS (`exit=0`) |
| `pnpm build` | PASS (`exit=0`) |
| ownership | PASS؛ 45 route، 41 session، 41 visible ownership |
| responsive | PASS؛ 34/34 |
| accessibility | PASS؛ 34/34، صفر إخفاقات |
| static a11y scan | لم تعد `task-edit-error` و`subtask-error` ضمن الفجوات |

التحذير الوحيد هو تحذير Next.js المعلوماتي بشأن تقادم convention الخاص بـmiddleware، ولم يمنع البناء. لم تتغير API أو schema أو migrations أو Better Auth أو localStorage fallback، ولم تُضاف أسرار أو بيانات اختبارية. حدث تغيّر عرضي مؤقت في موعد مهمة أثناء الاختبار باستخدام فهارس واجهة متغيرة، وتمت إعادته إلى موعده الأصلي قبل إنهاء التحقق.

**الحالة:** PASS — دفعة أخطاء تعديل المهمة والخطوة الفرعية جاهزة للتوثيق المركزي والاعتماد في commit مستقل.
