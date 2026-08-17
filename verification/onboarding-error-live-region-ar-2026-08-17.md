# تحقق دفعة live-region لخطأ اسم onboarding

**التاريخ:** 2026-08-17
**المكوّن:** `components/onboarding/onboarding-flow.tsx`
**المسار:** `/onboarding`
**الحالة:** PASS

## الفجوة والإصلاح

كان خطأ الاسم في مكوّن `Field` يستخدم `role="alert"` ويرتبط بالحقل عبر `aria-describedby`، لكنه لم يعلن صراحةً عن `aria-live` أو `aria-atomic`. أضيفت `aria-live="assertive"` و`aria-atomic="true"` إلى عنصر الخطأ فقط، دون تغيير نص الرسالة العربية أو منطق الانتقال بين خطوات onboarding أو التخزين المحلي أو أي API.

## اختبار المتصفح

فُتح `http://localhost:3004/onboarding`، وبقي حقل الاسم فارغًا، ثم أُرسل نموذج الخطوة الأولى عبر «التالي». ظهرت الرسالة العربية `اكتب اسمك أولًا.`. أثبت فحص DOM القيم التالية:

| الخاصية | النتيجة |
|---|---|
| نص الخطأ | `اكتب اسمك أولًا.` |
| `role` | `alert` |
| `aria-live` | `assertive` |
| `aria-atomic` | `true` |
| `aria-describedby` | `onboarding-name-error` |
| `aria-invalid` | `true` |
| قيمة الحقل | فارغة |

توجد التفاصيل الخام في `verification/onboarding-error-browser-findings-2026-08-17.md`. لم تُنشأ بيانات onboarding اختبارية.

## بوابات الجودة والتدقيق

| البوابة | النتيجة |
|---|---|
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm lint` | PASS |
| `pnpm build` | PASS |
| `python3 scripts/audit_route_ownership.py` | PASS — 45 route، 41 session، 41 visible ownership |
| `python3 scripts/responsive-audit.py` | PASS — 34/34 |
| `python3 scripts/accessibility-audit.py` | PASS — 34/34، صفر إخفاقات |

ظهر تحذير Next.js المعلوماتي المعتاد بشأن تقادم convention الخاص بـmiddleware، ولم يكن حاجزًا. لا توجد تغييرات في API أو قاعدة البيانات أو Better Auth أو ملكية البيانات، ولم تُضف أسرار، ولم تُنفذ `drizzle-kit generate`.

## حدود النطاق والأدلة

اقتصر التغيير على خصائص الإعلان الدلالي لخطأ اسم onboarding. الأدلة المرتبطة هي تقرير DOM، وسجل الجودة `verification/onboarding-error-quality-20260817T1832Z.log`، وسجل التدقيق `verification/onboarding-error-audits-20260817T1833Z.log`، وسجل اختبارات التفاعل، ومصفوفة التدقيق الشاملة، وخطة التنفيذ المركزية.

**قرار الاعتماد:** جاهز للاعتماد في commit مستقل بعد تنظيف artifacts العابرة وفحص `git diff --check`.
