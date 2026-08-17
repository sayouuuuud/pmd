# مصدر المقارنة: الخطة المدمجة الكاملة — Personal Command Center

المصدر: `/home/ubuntu/upload/الخطةالمدمجةالكاملة—PersonalCommandCenter.md`

## ملاحظات الحالة
- الوثيقة تصف نفسها بأنها مسودة نقاش محدثة تجمع الخطة الأصلية والإضافات الجديدة.
- البنود الجديدة التي تدخل النطاق التجريبي: بوابة العميل، مشاركة المشاريع، تعدد المستخدمين، بيانات الدخول التجريبية، الفوترة والمحاسبة التجريبية، مراقبة Windows الموسعة، و2FA التجريبي.
- الوثيقة تذكر أن التنفيذ لم يبدأ اعتمادًا عليها وأن `EXECUTION_PLAN.md` لم يكن معدّلًا بها؛ لذلك يجب اعتبار حالة الكود والأدلة والـcommits هي المرجع التنفيذي الفعلي.

## مراحل المقارنة
1. اعتماد النطاق التجريبي والقرارات الكبرى: features flags، حدود التجريبي والإنتاج، المصطلحات والنطاق الرسمي.
2. تدقيق الأساس وعقود البيانات والملكية: جرد routes/components/stores/API/tables، user_id، Workspace/Member/Role، العلاقات، التواريخ، الأرشفة، localStorage/remote sync، migrations.
3. إغلاق فجوات الأساس وتجربة الاستخدام: shell والتنقل والبحث/dashboard، loading/empty/error/offline بالعربية، RTL والموبايل ولوحة المفاتيح والنوافذ، components/ui، deep links/anchors.
4. MVP الحياة اليومية: Tasks/Subtasks، Notes، Habits/Journal، Daily Plan، Dashboard، Weekly Review، Quick Add.
5. Backend وBetter Auth وNeon و2FA التجريبي: secrets، auth flows، remote sync، 2FA feature flag، isolation، network failure/recovery، indexes.
6. مساحة العمل وملفات العملاء: work dashboard، client profile، accounts experimental، CRUD/archive/restore، project/search/calendar relations.
7. المشاريع والتحديثات والتسعير والمال: client/team links، milestones، updates، pricing، payments، project-finance integration.
8. بوابة العميل والمشاركة والتعاون متعدد المستخدمين: invitations، shared projects/files، comments/approval، roles/permissions، audit/change log، revoke access.
9. التقويم الموحد: all sources، month/week/day، filters، events، deep source links، timezone، dashboard widget.
10. البحث والأرشيف والتذكيرات والعلاقات: expanded search، unified archive/restore، reminders، deep links، suggestion log.
11. المكتبة والموارد والملفات: resource types، links/AI/prompts/templates/files، relations، uploads, search/favorites/archive.
12. الفوترة والمحاسبة التجريبية: quotes، invoice states، project/client links، revenue dashboards، export/print، Finance source.
13. Windows monitor التجريبي: settings/flags، processes/apps/windows/screenshots/keylogging/notifications/usage، consent/privacy/retention boundaries.
14. لوحة العميل العامة والتواصل: client portal/public links، shared data, comments, approvals, notifications, revocation.
15. الأمان والتقوية قبل التشغيل الحقيقي: secrets vault/encryption/reauth، 2FA hardening، isolation/RBAC/audit/rate limits/CSRF/XSS/uploads/backups/retention.
16. PWA وOffline والمزامنة: installability، icons/manifest، service worker، offline queue/conflict resolution/sync states.
17. الاختبارات والإطلاق والتشغيل: unit/integration/e2e/a11y/responsive/security/load، seed/demo data، CI/build/migrations/observability/rollback/runbook.
18. التحسينات النهائية: performance، accessibility، RTL/i18n، UX polish، design system consistency، onboarding/help/empty states.

## معايير التصنيف
- منفذ ومثبت: يوجد implementation فعلي + اختبار/دليل أو commit مناسب.
- منفذ جزئيًا: جزء من النطاق موجود لكن العلاقات أو حالات الاستخدام أو الأدلة ناقصة.
- غير منفذ: لا يوجد implementation قابل للاستخدام.
- خارج النطاق/غير محسوم: مذكور في الوثيقة لكنه يحتاج قرار نطاق أو تقوية قبل production.

## قواعد الأدلة
- لا يُعد وجود route وحده تنفيذًا كاملًا للمرحلة.
- يُراجع الكود، schema/API، اختبارات verification، وgit history معًا.
- لا تُعتبر الأسرار أو بيانات الدخول التجريبية جاهزة للإنتاج دون تقوية أمنية.
- يجب تسجيل البنود غير القابلة للتحقق بوضوح بدل افتراض تنفيذها.

## أرقام المراحل
المراحل المقروءة صراحة من الوثيقة تمتد من 1 إلى 18، ويجب قراءة بقية الملف كاملًا قبل إعداد المصفوفة النهائية لتضمين معايير الإغلاق والتفاصيل الفرعية لكل مرحلة.
