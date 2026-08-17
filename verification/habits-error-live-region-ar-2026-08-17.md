# تحقق دلالة live-region — خطأ نموذج العادات

**التاريخ:** 2026-08-17 UTC
**النطاق:** `components/habits/habits-workspace.tsx`
**الدفعة:** إضافة خصائص الإعلان إلى خطأ اسم العادة.

## الفجوة

كانت رسالة `#habit-form-error` تستخدم `role="alert"` وترتبط بحقل الاسم عبر `aria-describedby`، لكنها لم تحدد صراحةً `aria-live` أو `aria-atomic`. أضعف ذلك وضوح سلوك الإعلان عند ظهور الخطأ أو تغيّره لقارئات الشاشة.

## الإصلاح

أضيفت إلى الرسالة:

```tsx
role="alert"
aria-live="assertive"
aria-atomic="true"
```

مع الحفاظ على النص العربي، ومنطق التحقق، و`aria-invalid` و`aria-describedby`، وfallback المحلي وملكية البيانات.

## اختبار المتصفح

في `http://localhost:3004/habits` فُتح نموذج «عادة جديدة»، وتُرك حقل اسم العادة فارغًا ثم أُرسل النموذج. ظهرت الرسالة `اكتب اسم العادة أولًا.` دون إنشاء عادة جديدة. أثبت DOM:

| الفحص | النتيجة |
|---|---|
| النص | `اكتب اسم العادة أولًا.` |
| `role` | `alert` |
| `aria-live` | `assertive` |
| `aria-atomic` | `true` |
| الحقل المرتبط | حقل اسم العادة (`INPUT`) |
| `aria-invalid` | `true` |
| `aria-describedby` | `habit-form-error` |

تفاصيل فحص DOM محفوظة في `verification/habits-error-browser-findings-2026-08-17.md`.

## بوابات الجودة والتدقيق

| البوابة | النتيجة |
|---|---|
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm lint` | PASS |
| `pnpm build` | PASS |
| route ownership | PASS — `45` route، `41` session، `41` visible ownership، دون نقص |
| responsive audit | PASS — `34/34`، دون إخفاقات |
| accessibility audit | PASS — `34/34`، `0` إخفاقات |
| `git diff --check` | PASS بعد تنظيف السجلات |

تحذير middleware في build معلوماتي وغير حاجز، ولم يُجرَ `drizzle-kit generate` وفق القيد القائم.

## حدود النطاق

لا تتضمن الدفعة تغييرات في API أو قاعدة البيانات أو Better Auth أو التصميم المرئي أو الأسرار أو ملكية البيانات. لم تُنشأ بيانات اختبار جديدة.

## الأدلة

- `verification/habits-error-browser-findings-2026-08-17.md`
- `verification/habits-error-quality-20260817T1821Z.log`
- `verification/habits-error-audits-20260817T1822Z.log`

**الحكم:** PASS — الدفعة جاهزة للاعتماد كـcommit مستقل.
