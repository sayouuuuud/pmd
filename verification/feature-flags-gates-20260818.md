# سجل اعتماد — اعتماد النطاق وFeature Flags

**الختم الزمني:** 2026-08-18T02:05:34Z

## النطاق

إغلاق أول فجوة في تقرير مقارنة الخطة المدمجة: عقد Feature Flags مركزي، فصل المستقر عن التجريبي، إيقاف الميزات الحساسة افتراضيًا، وربط 2FA التجريبي بالبوابة نفسها في العميل والواجهة وخادم Better Auth.

## التنفيذ

أُضيف [`lib/feature-flags.ts`](../lib/feature-flags.ts) بعقد typed يعرّف الميزات المستقرة والتجريبية والمحظورة. أُضيفت متغيرات البيئة التجريبية إلى [`.env.example`](../.env.example)، وأنشئت وثيقة [`docs/feature-flags.md`](../docs/feature-flags.md) التي تذكر سبب الإيقاف الافتراضي وشروط الفتح لكل ميزة. لا توجد secrets جديدة.

رُبط 2FA التجريبي في `lib/auth-client.ts` و`components/account/account-workspace.tsx` و`server/auth.ts`. عند الإيقاف لا تُركب إضافة 2FA في العميل أو الخادم ولا تظهر بطاقة 2FA. عند الفتح الصريح تظهر البطاقة التجريبية، دون اعتبار ذلك موافقة على جاهزية الإنتاج.

## البوابات

| الفحص | النتيجة |
|---|---|
| TypeScript | PASS |
| ESLint | PASS؛ تحذير hooks سابق غير حاجز في `components/workspace/workspace-workspace.tsx` |
| Webpack build — flags الافتراضية متوقفة | PASS |
| Webpack build — `NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_2FA=1` | PASS |
| `git diff --check` | PASS |
| Browser `/account` على `localhost:3004` مع flags متوقفة | PASS؛ بطاقة 2FA غير ظاهرة |
| Browser `/account` على `localhost:3006` مع 2FA مفعّل صراحةً | PASS؛ بطاقة 2FA التجريبية ظاهرة |
| RTL وبقية إعدادات الحساب | PASS بصريًا في الحالتين |

## الحدود

لا يثبت هذا السجل جاهزية 2FA للإنتاج. ما تزال login challenge وrecovery/backup-code rotation وإبطال الجلسات والاختبارات بقاعدة بيانات حقيقية مفتوحة. متغيرات `NEXT_PUBLIC_*` ليست طبقة صلاحيات، وتظل فحوص الجلسة و`user_id` والملكية على الخادم إلزامية.

بعد الاختبار المؤقت أُعيد بناء `.next` بالوضع الافتراضي، لذلك لا تبقى أي ميزة تجريبية مفعلة في النسخة المحلية النهائية.
