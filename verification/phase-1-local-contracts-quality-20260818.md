# اختبار المرحلة الأولى — تثبيت النطاق والعقود المحلية

التاريخ: 2026-08-18

## نطاق التنفيذ

أُعيد ترتيب المراحل في `docs/local-first-phases.md`، وأُضيف العقد المحلي المركزي في `lib/local-first-contracts.ts`. لم تُجرَ أي تغييرات على schema أو migrations أو credentials، ولم يُشغّل `drizzle-kit generate`.

## بوابات الجودة

| البوابة | النتيجة |
|---|---|
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm lint` | PASS |
| `NEXT_TELEMETRY_DISABLED=1 pnpm exec next build --webpack` | PASS؛ 27 صفحة ثابتة ومسارات API مجمعة |
| `python3 scripts/audit_route_ownership.py` | PASS؛ 48 route، 44 session، 44 visible ownership |
| `python3 scripts/responsive-audit.py` | PASS؛ 34/34، بلا failures |
| `python3 scripts/accessibility-audit.py` | PASS؛ 34/34، صفر failures |

## اختبار المتصفح

### الصفحة الرئيسية — `http://localhost:3004/`

- عادت الصفحة بحالة HTTP 200.
- العنوان العربي والـShell والتنقل الكامل ظهروا دون شاشة بيضاء.
- ظهر زر Quick Add، البحث، التنبيهات، القائمة، ووضع الثيم.
- ظهرت خطة اليوم والمهام والعادات والمال والصلوات والورد والاقتراحات.
- اتجاه RTL والهوية البصرية الحالية ظهرا متسقين في لقطة المتصفح.

### صفحة نظام التصميم — `http://localhost:3004/design-system`

- عادت الصفحة بحالة HTTP 200.
- ظهرت كروت الإحصاءات، تنويعات الأزرار والشارات، الحقول، حالات Empty/Loading، والـDialog.
- الصفحة تعرض قواعد استخدام semantic tokens وRTL، ولم يظهر كسر بصري بعد إضافة العقد المحلي.

## التحذيرات والقيود

ظهر تحذير Next.js المعلوماتي المعتاد بشأن تقادم convention الخاص بـmiddleware، وتحذير Edge Runtime صادر من اعتماديات Next.js. لم يمنعا build وليسا ناتجين عن عقد المرحلة الأولى.

لم يتوفر `references/domain_model.md` في المسار المتوقع داخل الريبو، لذلك لم يُفترض محتوى غير موجود. استُخدمت عقود `lib/workspace-types.ts` و`server/db/schema.ts` الحالية كمرجعين فعليين فقط.

## النتيجة

المرحلة الأولى جاهزة للإغلاق بعد مراجعة diff وتنظيف artifacts. لا تُعد هذه النتيجة اتصالًا بقاعدة البيانات أو اختبارًا إنتاجيًا.
