# Migration Inventory — Phase 2

## قاعدة تشغيل إلزامية

لا يُشغّل `drizzle-kit generate` ولا تُطبّق migrations على Neon ضمن المرحلة الثانية. السبب أن `server/db/migrations/meta/_journal.json` يسجل حتى `0006_add_journal_entertainment`، بينما ملف `0010_workspace_work_system_experimental.sql` موجود يدويًا خارج journal. يجب حل الفرق بمراجعة schema وbaseline وقاعدة Neon في المرحلة الخامسة الأصلية/مرحلة الربط الأخيرة قبل أي تنفيذ.

## الحالة الحالية

| النطاق | المعرّف/الملف | الحالة | القرار |
|---|---|---|---|
| التاريخ المسجل | `0000_romantic_shiver_man` إلى `0006_add_journal_entertainment` | موجود في journal | لا تعديل رجعي |
| Workspace والعملاء | `0010_workspace_work_system_experimental.sql` | SQL يدوي غير مسجل في journal | مراجعة يدوية فقط؛ لا تشغيل |
| الفهارس | workspace/member/project indexes داخل 0010 | مقترحة/تجريبية | التحقق من uniqueness قبل التطبيق |
| بيانات الاعتماد | `client_credential` | تجريبية | لا تخزين إنتاجي ولا أسرار نصية |
| النشاط | `activity_session` | تجريبي | لا Agent إنتاجي في هذه المرحلة |
| 2FA الموازي | `second_factor_setting` | تجريبي | Better Auth هو المصدر الفعلي؛ يحتاج توحيدًا لاحقًا |

## ترتيب التنفيذ المقترح لاحقًا

1. أخذ نسخة احتياطية من Neon وقراءة migrations المطبقة فعليًا.
2. مقارنة `schema.ts` مع journal وmigration 0010 ومخرجات introspection.
3. تقسيم SQL اليدوي إلى migrations مرقمة غير متعارضة، مع فهارس مركبة ownership.
4. اختبار على قاعدة staging فارغة وقاعدة staging تحتوي بيانات قبل الإنتاج.
5. تشغيل migration داخل نافذة موثقة ثم اختبار rollback/restore والعزل متعدد المستخدمين.

## الفهارس المطلوبة عند الإغلاق الإنتاجي

يجب توفير فهارس على `(user_id, updated_at)` للسجلات الشخصية، وعلى `(workspace_id, updated_at)` لسجلات Workspace، وعلى `(workspace_id, user_id)` للعضوية، وعلى `(workspace_id, project_id)` للعلاقات المشتركة. يجب ألا تُستخدم unique indexes حيث المطلوب مجرد lookup index، كما حدث في بعض الفهارس التجريبية؛ تتم مراجعتها قبل التطبيق.

## ضوابط عدم فقدان البيانات

كل migration يجب أن تكون قابلة للتتبع، ولا تُحذف أو تعيد تسمية أعمدة مباشرة دون backfill وخطة rollback. لا تُنقل السجلات الشخصية إلى Workspace تلقائيًا. عند فشل remote sync، تبقى local envelope محفوظة بحالة `failed` وتُعرض للمستخدم دون اعتبارها synced.
