# تقرير تحقق — أخطاء نماذج المشاريع العربية

**التاريخ:** 2026-08-17

**النطاق:** `components/projects/projects-workspace.tsx`

## الفجوة والإصلاح

كشفت المراجعة الساكنة أن رسائل أخطاء نماذج المشاريع كانت تستخدم `role="alert"` دون إعلان صريح عبر `aria-live` و`aria-atomic`. شملت الدفعة خمسة مسارات: إنشاء المشروع، إضافة مهمة للمشروع، تحديث المشروع، إضافة دفعة، وتعديل دفعة. أضيفت إلى رسائل الخطأ خصائص `aria-live="assertive"` و`aria-atomic="true"` مع الحفاظ على النصوص العربية ومنطق fallback المحلي وملكية البيانات.

أثناء اختبار مسار تحديث المشروع، كُشفت فجوة دلالية إضافية: حقل نص التحديث لم يكن يعلن `aria-invalid` أو `aria-describedby`، كما أن نموذجه لم يكن يحدد `noValidate`. أُصلح الحقل بإضافة `aria-invalid={Boolean(updateError)}` و`aria-describedby={updateError ? 'project-update-error' : undefined}`، مع مسح الخطأ عند التعديل، وأضيف `noValidate` إلى النموذج. لم يتغير سلوك الحفظ أو واجهة API أو مخطط قاعدة البيانات.

## اختبار المتصفح وDOM

على `http://localhost:3004/projects` فُتح مشروع قائم واختُبرت مسارات إنشاء المشروع وإضافة مهمة المشروع وتحديث المشروع بإرسال نماذج فارغة. ظهرت الرسائل العربية دون إنشاء بيانات جديدة.

في مسار إنشاء المشروع أثبت DOM أن `#project-title-error` يحمل `role=alert` و`aria-live=assertive` و`aria-atomic=true`، وأن حقل الاسم مرتبط عبر `aria-describedby=project-title-error` ويحمل `aria-invalid=true`.

في مسار مهمة المشروع أثبت DOM أن `#project-task-error` يحمل خصائص live-region نفسها، وأن حقل المهمة يحمل `aria-describedby=project-task-error` و`aria-invalid=true`.

في مسار تحديث المشروع ظهرت الرسالة `اكتب نص التحديث قبل الحفظ.`. بعد الإصلاح أثبت DOM أن `#project-update-error` يحمل `role=alert` و`aria-live=assertive` و`aria-atomic=true`، وأن حقل نص التحديث يحمل `aria-describedby=project-update-error` و`aria-invalid=true`. كما أثبت الفحص أن النموذج يستخدم `noValidate=true`.

لم تُنشأ بيانات اختبارية؛ اقتصرت الاختبارات على حالات التحقق الفارغة.

## بوابات الجودة والتدقيق

| البوابة | النتيجة |
|---|---|
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm lint` | PASS |
| `pnpm build` | PASS |
| Ownership: 45 route / 41 session / 41 visible ownership | PASS |
| Responsive: 34 حالة | PASS، بلا إخفاقات |
| Accessibility: 34 حالة | PASS، صفر إخفاقات |

سجل الجودة الخام: `verification/projects-error-quality-20260817T1840Z.log`.

سجل التدقيق الخام: `verification/projects-error-audits-20260817T1841Z.log`.

ظهر تحذير Next.js المعلوماتي المعتاد حول تقادم convention الخاص بـmiddleware، ولم يمنع أي بوابة.

## حدود النطاق

لم تتغير API أو قاعدة البيانات أو Better Auth أو قواعد ملكية البيانات. لم تُضف أسرار، ولم تُنفذ `drizzle-kit generate`. لم يتغير التصميم البصري أو النص العربي، واقتصر الإصلاح على الدلالة والوصول والتحقق الأصلي للنموذج.
