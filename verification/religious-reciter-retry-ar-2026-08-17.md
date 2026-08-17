# تقرير تحقق — حالة تحميل القراء وإعادة المحاولة في القسم الديني

## النطاق

تستهدف الدفعة حالة قائمة القراء في `components/religious/religious-workspace.tsx`. قبل الإصلاح كانت واجهة الاختيار تعرض قيمة تحميل قد تبقى مضللة عند فشل الشبكة. أصبح للمكوّن الآن مسار حالة صريح للتحميل والنجاح والفشل، مع رسالة عربية دلالية وزر إعادة محاولة، بينما يظل تشغيل التلاوة محصورًا في وجود قارئ محمّل فعليًا.

## الإصلاح

فُصلت حالة القراء عن حالة محتوى القرآن، وأضيف عنصر حالة مرتبط بالقائمة عبر `aria-describedby="reciter-status"` و`role="status"`. عند فشل طلب `/api/religious/reciters` أو وصول قائمة فارغة، تظهر رسالة `تعذر تحميل قائمة القراء` وزر `إعادة تحميل القراء`. إعادة المحاولة تستخدم token مستقلًا حتى لا تُترك الواجهة على حالة تحميل قديمة.

## اختبار المتصفح

في جلسة محلية على `http://localhost:3004/religious` جرى اعتراض طلب قائمة القراء اعتراضًا مؤقتًا ومحدودًا. ظهرت حالة الفشل العربية وزر إعادة التحميل دون تشغيل صوت أو تعديل بيانات دائمة. بعد استعادة `fetch` الأصلي وتشغيل إعادة المحاولة، ظهرت قائمة ناجحة تحتوي 31 خيارًا فعليًا، واختفى زر إعادة التحميل، وظهر `المصدر: MP3Quran` داخل عنصر `role="status"`. لم تُشغّل التلاوة، ولم تُنشأ قائمة، ولم يُحفظ أي تقدم.

## بوابات الجودة

| البوابة | النتيجة |
|---|---|
| TypeScript (`pnpm exec tsc --noEmit`) | PASS |
| ESLint (`pnpm exec eslint .`) | PASS |
| Next build (`pnpm build`) | PASS |
| Ownership | PASS — 45 route، 41 session، 41 visible ownership |
| Responsive | PASS — 34/34، دون failures |
| Accessibility | PASS — 34/34، 0 failures |
| `git diff --check` | PASS |

تحذير Next.js الوحيد معلوماتي ويتعلق بتقادم convention الخاص بـ`middleware`، وليس فشلًا حاجزًا للبناء.

## الأدلة

- `components/religious/religious-workspace.tsx`
- `verification/visual-audit-findings-20260817T1555Z.md`
- `verification/religious-reciter-quality-20260817T163700Z.log`
- `verification/religious-reciter-audits-20260817T163800Z.log`

## القرار

**PASS — الدفعة جاهزة للاعتماد.**
