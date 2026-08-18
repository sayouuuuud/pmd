# جرد الريبو — المرحلة الثانية

## نطاق الجرد

تمت مراجعة طبقات التطبيق المطلوبة في الخطة الأصلية: صفحات `app/**/page.tsx`، مكونات `components/**`، متاجر الحالة وfallback في `lib/**`، مسارات `app/api/**`، وتعريفات Drizzle في `server/db/schema.ts` وملفات migrations وjournal. هذا الجرد وصفي؛ لا ينفذ اتصالًا بقاعدة البيانات ولا يغير migration history.

## طبقات الواجهة والتنقل

| الطبقة | النطاق الذي تم جرده | عقد الملكية/الحالة |
|---|---|---|
| App routes | الصفحة الرئيسية، Dashboard، Workspace، المشاريع، العملاء، الحساب، الأرشيف، البحث، التقويم، والإعدادات | المسارات العامة تعرض shell، والمسارات الحساسة تعتمد جلسة المستخدم أو fallback المحلي |
| Workspace UI | Workspace shell، Work Dashboard، Client Profile، Projects، members/invitations | كل سجل Workspace يحمل `workspaceId` أو يمر عبر عضوية نشطة؛ الأفعال الإدارية مربوطة بقدرات RBAC |
| Shared UI | StatCard، ContentCard، EmptyState، النماذج، tabs، dialogs، toast states | حالات loading/empty/error/offline تستخدم مكونات الهوية الحالية وRTL |
| Navigation | روابط Workspace وDashboard وملف العميل وروابط المشاريع ذات الصلة | deep links تستخدم معرف السجل مع بقاء التحقق server-side عند توفر remote adapter |

## الحالة والمتجر المحلي

`lib/command-center-store.tsx` هو مصدر بيانات الواجهة الحالية للحياة اليومية والعمل التجريبي، مع fallback محلي عند غياب قاعدة البيانات. `lib/local-first-contracts.ts` يعرّف حالات `local`, `pending`, `synced`, `failed`، ونطاقًا يتضمن `userId` و`workspaceId`، وأدوار العضوية `owner/admin/member`، وأدوار المشاركة الخارجية `client/reader/reviewer`، وأدوار المشاركة التنفيذية `viewer/commenter/approver`.

لا يسمح العقد بإدخال سجل بلا مالك معروف إلى envelope محلي. السجل الشخصي يتطلب `userId` مطابقًا للجلسة، وسجل Workspace يتطلب `workspaceId` مطابقًا للنطاق. المزامنة البعيدة مؤجلة إلى مرحلة قاعدة البيانات، لكن حالات الفشل تبقى صريحة ولا تتحول إلى نجاح محلي زائف.

## API والملكية

| المجال | المسارات/الطبقة | قاعدة العزل |
|---|---|---|
| Auth/account | Better Auth وAccount/2FA routes | `user_id` والجلسة؛ 2FA خلف feature flag |
| Workspace | workspace، invitations، members | عضوية نشطة؛ capabilities مركزية؛ لا خفض لدور المالك |
| Clients | clients collection و`[id]` | `workspace_id` + `clients:read/manage` |
| Personal records | tasks، notes، habits، journal، finance، reminders وغيرها | `user_id` من الجلسة وليس قيمة مرسلة كإثبات ملكية |
| Shared work | project/update/pricing/share وcalendar/library/activity schemas | اتساق Workspace بين الأب والتابع مطلوب قبل remote writes |

## جرد قاعدة البيانات والعلاقات

تم توثيق جميع العائلات في `docs/data-dictionary.md` و`docs/erd-phase-2.mmd`: الهوية والجلسات، Workspace والعضوية والدعوات، العملاء وبيانات الاعتماد التجريبية، المشاريع والتحديثات والتسعير والمشاركة، المهام والملاحظات، الحياة اليومية والمال، التقويم والمكتبة والنشاط.

العلاقة المقصودة هي: `Workspace → Members → Clients → Projects → Tasks/Updates/Files/Payments`. الروابط النصية الحالية مثل `task.project_id` و`library_resource.project_id` و`finance_entry.project_id` و`daily_plan_item.source_id` موثقة كروابط تحتاج FK أو تحقق خدمة موحد في مرحلة الربط الحقيقي.

## Migrations وjournal

`docs/migration-inventory-phase-2.md` هو سجل التنفيذ الآمن للمigrations. اختلاف journal الحالي مع ملف migration اليدوي التجريبي موثق، ولذلك لم يُشغّل `drizzle-kit generate` ولم تُطبق migrations أو تغييرات Neon في هذه المرحلة.

## نتيجة الجرد

جميع deliverables التوثيقية للمرحلة الثانية موجودة: inventory، data dictionary، ERD، ownership/roles matrix، local-first contract، وقائمة migrations. أدوار العضوية الداخلية منفصلة عن أدوار العميل/القارئ/المراجع الخارجية، وتفعيل المشاركة الفعلية مؤجل إلى المرحلة الثامنة دون إسقاط تعريف الأدوار من العقد الحالي.
