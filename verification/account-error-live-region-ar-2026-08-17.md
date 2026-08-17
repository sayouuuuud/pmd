# تحقق دلالة خطأ اسم الحساب — 2026-08-17

## النطاق

تدقيق رسالة التحقق العربية في نموذج تفضيلات الحساب داخل `components/account/account-workspace.tsx`، مع الحفاظ على تدفق Better Auth، وfallback المحلي، وملكية البيانات، والنص والتصميم الحاليين.

## الفجوة

كانت رسالة خطأ اسم الحساب مرتبطة بالحقل وتستخدم `role="alert"`، لكنها لم تكن تحمل خصائص `aria-live` و`aria-atomic` صريحة. هذا يجعل عقد الإعلان أقل وضوحًا واتساقًا من بقية إصلاحات الوصول المعتمدة في المنصة.

## الإصلاح

أُضيفت `aria-live="assertive"` و`aria-atomic="true"` إلى عنصر الخطأ مع الإبقاء على النص العربي، و`id="profile-name-error"`، وارتباط `aria-describedby`، والتحقق المحلي، ومسار الحفظ كما هي. لم تُضف أي أسرار أو تغييرات في عقود API أو queries.

## اختبار المتصفح

- الصفحة: `http://localhost:3004/account`
- أُفرغ حقل الاسم ثم أُرسل نموذج التفضيلات.
- النص الظاهر: `اكتب اسمك أولًا.`
- نتيجة DOM الفعلية: `role=alert`, `aria-live=assertive`, `aria-atomic=true`.
- ارتباط الحقل: `aria-invalid=true`, `aria-describedby=profile-name-error`.
- أُجري الاختبار على بيانات محلية غير حساسة ولم تُحفظ أي بيانات اختبار جديدة.

## بوابات الجودة

- `pnpm exec tsc --noEmit`: PASS
- `pnpm lint`: PASS
- `pnpm build`: PASS
- `scripts/audit_route_ownership.py`: PASS — 45 route handlers، مع 41 مسارًا يتطلب جلسة ومرئية ملكية، دون مسارات ناقصة.
- `scripts/responsive-audit.py`: PASS — 34 حالة، دون إخفاقات.
- `scripts/accessibility-audit.py`: PASS — 34 حالة، و0 إخفاقات.

تحذير Next.js الخاص بإهمال convention الخاص بـ`middleware` بقي معلوماتيًا وغير حاجز، ولم يكن جزءًا من هذه الدفعة.

## حدود التحقق

يغطي الاختبار حالة خطأ الاسم الفارغ في الواجهة المحلية. لا يغيّر هذا الإصلاح التحقق من Better Auth أو سلوك الجلسة أو تخزين Neon، ولا يدّعي اختبار مسار مصادقة بعيد غير متاح أثناء التشغيل المحلي.

## الملفات المرتبطة

- `components/account/account-workspace.tsx`
- `verification/account-error-quality-20260817T1758Z.log`
- `verification/account-error-audits-20260817T1759Z.log`
- `verification/account-error-live-region-ar-2026-08-17.md`

الحكم: **PASS — جاهز للاعتماد بعد staging وفحص diff.**
