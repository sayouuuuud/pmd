# تحقق دلالة live-region — أخطاء نماذج الأهداف

**التاريخ:** 2026-08-17 UTC
**النطاق:** `components/goals/goals-workspace.tsx`
**الدفعة:** إضافة خصائص الإعلان إلى خطأي إنشاء هدف وإضافة مهمة إلى هدف قائم.

## الفجوة

كانت الرسالتان `#goal-title-error` و`#goal-task-error` تستخدمان `role="alert"` وترتبطان بالحقول عبر `aria-describedby`، لكنهما لم تحددا صراحةً `aria-live` أو `aria-atomic`. كان ذلك يترك سلوك إعلان التحديثات أقل وضوحًا لقارئات الشاشة من النمط المعتمد في بقية النماذج.

## الإصلاح

أضيفت إلى كل رسالة:

```tsx
role="alert"
aria-live="assertive"
aria-atomic="true"
```

مع إبقاء النصوص العربية، ومنطق التحقق، وfallback المحلي، وملكية البيانات دون تغيير.

## اختبارا المتصفح

### إنشاء هدف

في `http://localhost:3004/goals` تُرك حقل عنوان الهدف فارغًا وأُرسل النموذج. ظهرت الرسالة `اكتب اسم الهدف أولًا`، وأثبت DOM:

| الخاصية | القيمة |
|---|---|
| `role` | `alert` |
| `aria-live` | `assertive` |
| `aria-atomic` | `true` |
| الحقل المرتبط | حقل عنوان الهدف (`INPUT`) |
| `aria-invalid` | `true` |
| `aria-describedby` | `goal-title-error` |

### إضافة مهمة إلى هدف قائم

فُتح هدف «إطلاق النسخة الأولى من المنتج» المرتبط بمشاريع، وتُرك حقل المهمة فارغًا وأُرسل النموذج. ظهرت الرسالة `اكتب مهمة الهدف أولًا.`، وأثبت DOM:

| الخاصية | القيمة |
|---|---|
| `role` | `alert` |
| `aria-live` | `assertive` |
| `aria-atomic` | `true` |
| الحقل المرتبط | حقل مهمة جديدة للهدف (`INPUT`) |
| `aria-invalid` | `true` |
| `aria-describedby` | `goal-task-error` |

لم تُنشأ أهداف أو مهام جديدة ولم تتغير البيانات الموجودة. تفاصيل الفحص محفوظة في `verification/goals-error-browser-findings-2026-08-17.md`.

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

لا تتضمن الدفعة تغييرات في API أو قاعدة البيانات أو Better Auth أو التصميم المرئي أو الأسرار أو ملكية البيانات. جرى الاختبار على fallback المحلي ولم تُنشأ بيانات اختبار.

## الأدلة

- `verification/goals-error-browser-findings-2026-08-17.md`
- `verification/goals-error-quality-20260817T1816Z.log`
- `verification/goals-error-audits-20260817T1817Z.log`

**الحكم:** PASS — الدفعة جاهزة للاعتماد كـcommit مستقل.
