# تحقق عربي لنموذج مهمة المشروع — 2026-08-17

## نطاق الدفعة

أُغلقت فجوة التحقق في نموذج **إضافة مهمة للمشروع** داخل `components/projects/projects-workspace.tsx`. أصبح النموذج يستخدم `noValidate`، ويربط حالة الخطأ بالحقل عبر `aria-invalid` و`aria-describedby`، ويعرض رسالة عربية inline بدور `alert` عند محاولة الإضافة دون اسم، ويمسح الخطأ أثناء الكتابة. لم يتغير منطق إنشاء المهمة أو علاقة `projectId`.

## اختبار المتصفح

- فُتحت صفحة `/projects` على `http://localhost:3004/projects` في الواجهة العربية وباتجاه RTL.
- فُتح مشروع «منصة التحكم الشخصي» الذي يحتوي على مهام مرتبطة.
- أُرسل نموذج مهمة المشروع فارغًا؛ ظهرت رسالة الرفض العربية inline المرتبطة بالحقل، ولم تُنشأ مهمة جديدة.
- أُدخل النص العربي `مراجعة بنية المشروع`؛ اختفت رسالة الرفض أثناء الكتابة.
- أُنشئت المهمة العربية التجريبية بنجاح، وظهر عدد المهام المرتبطة مؤقتًا من 1 إلى 2.
- حُذفت المهمة التجريبية وحدها من مخزن الحالة المحلي، مع إزالة عنصر خطة اليوم المرتبط بها، دون المساس بالمهمة الأصلية أو بقية بيانات المستخدم.
- أُعيد تحميل الصفحة؛ عاد عدد المهام المرتبطة إلى 1، واختفى العنوان التجريبي، وعادت خريطة المشاريع إلى حالتها الأصلية.

## بوابات الجودة

السجل الخام: `verification/project-task-validation-quality-20260817T154102Z.log`

- TypeScript: PASS.
- ESLint: PASS.
- staged diff check: PASS.
- Next production build: PASS؛ اكتمل build بنجاح مع تحذير معلوماتي غير حاجز بشأن convention القديم لـ`middleware`.

## فحوص التدقيق المستقلة

السجل الخام: `verification/project-task-validation-audits-20260817T154313Z.log`

- Ownership: PASS؛ `route_count=45`، و`routes_with_session=41`، و`routes_with_visible_ownership=41`، ولا توجد مسارات ناقصة في القائمتين.
- Responsive: PASS؛ `total=34`، و`failures=[]`.
- Accessibility: PASS؛ `total=34`، و`failures=0`، و`failureSummary=[]`.

ملاحظة تشغيلية: انتهى غلاف تجميع السجل برمز غير صفري بسبب محاولة طباعة قيمة `PIPESTATUS` الفارغة بعد الـpipeline، لا بسبب فشل أي فحص. السجل نفسه يثبت أن رموز الفحوص الثلاثة كانت `0` وأن نتائجها PASS، كما أُعيدت artifacts المؤقتة وحُذف `tsconfig.tsbuildinfo`.

## الملفات المرتبطة

- `components/projects/projects-workspace.tsx`
- `verification/project-task-validation-quality-20260817T154102Z.log`
- `verification/project-task-validation-audits-20260817T154313Z.log`
- `verification/project-task-validation-ar-2026-08-17.md`

## القرار

دفعة تحقق مهمة المشروع **مكتملة وظيفيًا وموثقة**، وجاهزة لتحديث `EXECUTION_PLAN.md` و`verification/interaction-smoke-tests.md` و`verification/full-plan-audit-matrix-2026-08-17.md` ثم اعتمادها في commit مستقل بعد فحص staged diff.
