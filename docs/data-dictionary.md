# قاموس بيانات Personal Command Center

> هذه الوثيقة هي عقد المرحلة الثانية لعلاقات البيانات والملكية. وهي تصف schema الحالي كما هو، ولا تعني أن كل الجداول أو كل migrations المرتبطة به جاهزة للتطبيق الإنتاجي.

## 1. قواعد الملكية العامة

توجد فئتان من السجلات. السجلات الشخصية تُملك بواسطة `user_id` وتُقرأ وتُعدّل فقط ضمن جلسة صاحبها. سجلات مساحة العمل تُملك بواسطة `workspace_id`، ويُسمح بالوصول إليها فقط بعد التحقق من عضوية المستخدم النشطة وقدرته بحسب الدور. يظل `created_by` سجل تدقيق للفاعل ولا يحل محل فحص العضوية.

| النطاق | مفتاح العزل الإلزامي | حارس القراءة | حارس التعديل | أمثلة |
|---|---|---|---|---|
| شخصي | `user_id` | session user = `user_id` | session user = `user_id` | tasks, notes, habits, finance |
| Workspace | `workspace_id` + عضوية نشطة | `workspace:read` أو capability متخصصة | capability متخصصة | clients, invitations, updates |
| هوية | `user_id` | صاحب الحساب فقط | صاحب الحساب مع إعادة تحقق عند الحساسية | account, 2FA |
| مشاركة | `workspace_id` + `project_id` + عضو/دعوة | workspace membership + share status | owner/admin أو سياسة المشروع | project_share |

## 2. كيانات الهوية والحساب

| الجدول | الغرض | الملكية | الحقول الحساسة | الحالة/الحذف |
|---|---|---|---|---|
| `user` | هوية المستخدم وبياناته الأساسية | `id` هو المعرّف | email، حالة 2FA | حذف تابع للمصادر المرتبطة |
| `session` | جلسة Better Auth | `user_id` | token، IP، user agent | انتهاء زمني وحذف تابع |
| `account` | مزود الدخول وبيانات الاعتماد | `user_id` | password وtokens | لا تُعرض للعميل |
| `verification` | رموز التحقق المؤقتة | identifier/value | value | expiry إلزامي |
| `user_profile` | إعدادات اليوم والتهيئة | `user_id` كمفتاح أساسي | تفضيلات المستخدم | صف واحد لكل مستخدم |
| `two_factor` | حالة Better Auth TOTP | `user_id` فريد | secret، backup codes | تجريبي خلف flag |
| `second_factor_setting` | إعداد 2FA التجريبي الموازي | `user_id` كمفتاح أساسي | secret، recovery codes | تجريبي؛ يحتاج توحيدًا قبل الإنتاج |

## 3. كيانات Workspace والعملاء

| الجدول | الغرض | الملكية والعلاقات | الحقول التشغيلية |
|---|---|---|---|
| `workspace` | مساحة شخصية أو مساحة عمل | `owner_id`، والعضوية عبر `workspace_member` | `kind`, `name`, timestamps |
| `workspace_member` | عضوية المستخدم في مساحة | `workspace_id` + `user_id` فريدان | `role`: owner/admin/member؛ `status` |
| `workspace_invitation` | دعوة مستخدم بالبريد | workspace + invitedBy؛ token hash فريد | role، status، expiry، acceptedAt |
| `client` | ملف عميل داخل مساحة | `workspace_id` + `created_by` | contact fields، status، archivedAt |
| `client_credential` | بيانات دخول عميل تجريبية | workspace + client + createdBy | platform، username، secretValue، experimental flag |

## 4. كيانات العمل

| الجدول | الغرض | الملكية والعلاقات | ملاحظات الملكية |
|---|---|---|---|
| `project` | مشروع شخصي أو مرتبط بمساحة | `user_id`، و`workspace_id` اختياري، و`goal_id` اختياري | يجب منع خلط مشروع شخصي بمحتوى Workspace |
| `project_update` | تحديث تقدم مشروع | workspace + project + createdBy | يلزم تحقق أن المشروع يتبع نفس workspace |
| `project_pricing` | عرض/دفعة متوقعة للمشروع | workspace + project + client اختياري | يلزم تحقق اتساق workspace للروابط الثلاثة |
| `project_share` | مشاركة مشروع | workspace + project + member/invitedEmail | `role` و`status` لا يكفيان دون عضوية/دعوة |
| `task` | مهمة شخصية | `user_id` | `project_id` الحالي نص اختياري ويحتاج تحقق ملكية التطبيق |
| `subtask` | جزء من مهمة | `user_id` + `task_id` | يجب أن يتطابق user مع المهمة |
| `note` | ملاحظة شخصية | `user_id` | sourceTaskId اختياري ويحتاج تحقق ملكية |

## 5. كيانات الحياة والمال

| الجدول | الغرض | الملكية |
|---|---|---|
| `goal` | هدف شخصي | `user_id` |
| `habit` | عادة شخصية وروابط اختيارية | `user_id`، مع روابط task/project/goal |
| `habit_log` | سجل إنجاز عادة | `user_id` + habit | user/habit consistency إلزامية |
| `daily_plan_item` | عنصر خطة يومية | `user_id` | sourceId مرن ويحتاج تقييد نوع المصدر |
| `finance_entry` | حركة مالية شخصية | `user_id`، project/goal اختياريان | روابط المشروع/الهدف تحتاج تحقق ملكية |
| `budget` | ميزانية المستخدم | `user_id` كمفتاح أساسي | صف واحد لكل مستخدم |
| `reminder` | تذكير شخصي | `user_id` | sourceId يحتاج تحقق المصدر |
| `journal_entry` | يوميات | `user_id` | فهرس user + localDate فريد |
| `weekly_review` | مراجعة أسبوعية | `user_id` | فهرس user + weekStart فريد |
| `religious_settings` | إعدادات دينية وسجلات شخصية | `user_id` كمفتاح أساسي | JSONB يحتاج حدود حجم وتحقق |
| `entertainment_item` | مكتبة ترفيه شخصية | `user_id` | status/rating/archive |

## 6. كيانات التقويم والمكتبة والنشاط

| الجدول | الغرض | الملكية والعلاقات |
|---|---|---|
| `calendar_event` | حدث موحد لمساحة | workspace + createdBy | sourceType/sourceId مرنان ويحتاجان registry |
| `library_resource` | رابط/مرجع/مورد | workspace + createdBy، client اختياري | projectId الحالي يحتاج FK أو تحقق خدمة |
| `activity_session` | نشاط Windows تجريبي | workspace + userId | windowTitle/domain حساسان؛ experimental policy |

## 7. الحقول المشتركة والحالات

كل سجل قابل للتزامن يجب أن يحمل `id`, `created_at`, `updated_at`، وحيث يدعم الأرشفة `archived_at`. التواريخ الزمنية تُخزن كـtimestamp عندما تكون لحظة مطلقة، و`local_date`/`due_date` عندما تكون مرتبطة بيوم المستخدم، مع timezone صريح للأحداث. الحالات النصية الحالية تحتاج لاحقًا إلى enums أو validation مركزية قبل الإنتاج.

حالات المزامنة المحلية معرفة في `lib/local-first-contracts.ts` كالتالي: `local`, `pending`, `synced`, `failed`. لا يُسمح لطبقة localStorage بتجاوز `LocalScope` أو استبدال جلسة المستخدم بمفتاح ثابت عام.

## 8. فجوات العقد التي تبقى للمرحلة الأخيرة

تحتاج الروابط النصية الحالية مثل `task.project_id`, `note.source_task_id`, `library_resource.project_id`, `finance_entry.project_id`, و`daily_plan_item.source_id` إلى قيود FK أو تحقق خدمة موحد. كما أن كيانات Workspace تستخدم `workspace_id` و`created_by` بدل `user_id` المباشر، وهو تصميم صحيح للبيانات المشتركة بشرط فرض العضوية النشطة في كل query؛ يجب عدم تحويلها آليًا إلى user-owned records.
