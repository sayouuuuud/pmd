# تحقق دلالة أخطاء خطة اليوم — 2026-08-17

## النطاق

تدقيق رسالتي التحقق في نماذج خطة اليوم داخل `components/daily-plan/daily-plan-workspace.tsx`: نموذج نقل العنصر إلى تاريخ آخر، ونموذج تعديل عنوان العنصر. حافظت الدفعة على الهوية البصرية الحالية، واللغة العربية، وRTL، وfallback المحلي، وعقود البيانات وملكية المستخدم.

## الفجوة

كانت رسالتا `move-date-*-error` و`plan-title-*-error` مرتبطتين بالحقول وتستخدمان `role="alert"`، لكنهما تفتقدان `aria-live` و`aria-atomic` الصريحتين.

## الإصلاح

أُضيفت `aria-live="assertive"` و`aria-atomic="true"` إلى الرسالتين. لم يتغير النص العربي أو التحقق أو `aria-invalid` أو `aria-describedby` أو منطق النقل والتعديل.

## اختبار المتصفح

- الصفحة: `http://localhost:3004/daily-plan`.
- فُتح نموذج تعديل عنصر قائم، أُفرغ عنوانه، ثم أُرسل النموذج.
- النص الظاهر: `اكتب عنوان العنصر أولًا.`.
- فحص DOM: عنصر الخطأ `plan-title-plan-1786979712975-error` يحمل `role=alert` و`aria-live=assertive` و`aria-atomic=true`.
- فحص الحقل: `aria-invalid=true` و`aria-describedby=plan-title-plan-1786979712975-error`.
- لم تُحفظ قيمة اختبار جديدة؛ بقيت الحالة محلية وفي وضع الخطأ فقط.

## بوابات الجودة

- `pnpm exec tsc --noEmit`: PASS.
- `pnpm lint`: PASS.
- `pnpm build`: PASS.
- `scripts/audit_route_ownership.py`: PASS — 45 route handlers، و41 مسارًا مع جلسة ومرئية ملكية، دون مسارات ناقصة.
- `scripts/responsive-audit.py`: PASS — 34 حالة، دون إخفاقات.
- `scripts/accessibility-audit.py`: PASS — 34 حالة، و0 إخفاقات.

ظل تحذير Next.js بشأن convention الخاص بـ`middleware` معلوماتيًا وغير حاجز.

## حدود التحقق

يغطي الاختبار حالة العنوان الفارغ في نموذج التعديل. لم يغيّر الإصلاح APIs أو قاعدة البيانات أو Better Auth أو ownership، ولم ينفذ `drizzle-kit generate`.

## الأدلة

- `verification/daily-plan-error-quality-20260817T1805Z.log`
- `verification/daily-plan-error-audits-20260817T1806Z.log`
- `verification/daily-plan-error-browser-findings-2026-08-17.md`

الحكم: **PASS — الدفعة جاهزة للاعتماد بعد تنظيف artifacts.**
