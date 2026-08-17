# تحقق دلالة خطأ نموذج التقويم — 2026-08-17

## الفجوة

كان خطأ التحقق في نموذج إضافة/تعديل الحدث يحمل `role="alert"` ويرتبط بالحقول عبر `aria-describedby`، لكنه لم يصرّح صراحةً بخصائص `aria-live` و`aria-atomic`. لذلك كان الإعلان الدلالي يعتمد على السلوك الضمني بدل عقد واضح ومتسق مع بقية رسائل المنصة.

## الإصلاح

أضيفت `aria-live="assertive"` و`aria-atomic="true"` إلى عنصر الخطأ ذي المعرّف `calendar-event-error` في `components/calendar/calendar-workspace.tsx`. لم يتغير نص الرسالة أو تصميمها أو التحقق أو منطق الحفظ المحلي/الخادمي.

## اختبار المتصفح

فُتحت صفحة `/calendar` محليًا، ثم فُتح نموذج «حدث جديد» وأُرسل فارغًا. ظهرت الرسالة العربية `اكتب عنوان الحدث أولًا.`. أعاد فحص DOM القيم التالية:

| الخاصية | النتيجة |
|---|---|
| `role` | `alert` |
| `aria-live` | `assertive` |
| `aria-atomic` | `true` |
| النص | `اكتب عنوان الحدث أولًا.` |
| ارتباط الحقل | `aria-describedby="calendar-event-error"` |

**نتيجة اختبار DOM: PASS.** لم تُنشأ بيانات اختبار ولم يتغير محتوى المنصة.

## بوابات الجودة والتدقيق

| البوابة | النتيجة |
|---|---|
| TypeScript (`pnpm exec tsc --noEmit`) | PASS |
| ESLint (`pnpm lint`) | PASS |
| Next build (`pnpm build`) | PASS؛ التحذير الوحيد معلوماتي متعلق بتسمية middleware deprecated |
| Route ownership | PASS؛ 45 مسارًا، 41 بمسارات جلسة وملكية مرئية، دون مسارات ناقصة |
| Responsive audit | PASS؛ 34 حالة، 0 إخفاقات |
| Accessibility audit | PASS؛ 34 حالة، 0 إخفاقات |
| `git diff --check` | متوقع بعد تنظيف artifacts قبل الاعتماد |

## حدود النطاق

هذه الدفعة تعالج رسالة خطأ نموذج أحداث التقويم فقط. لا تشمل إعادة تصميم التقويم أو تغيير عقود API أو migrations أو منطق الملكية أو fallback المحلي.
