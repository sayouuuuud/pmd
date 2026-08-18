# مصفوفة الملكية والأدوار

## 1. نموذج الصلاحيات

الصلاحية لا تُستنتج من `created_by` وحده. يبدأ كل طلب من جلسة مستخدم، ثم يحدد النطاق المطلوب، ثم يتحقق من العضوية النشطة في الـWorkspace، ثم يطبق capability العملية. السجلات الشخصية تعتمد على تطابق `session.user.id` مع `user_id`، بينما السجلات المشتركة تعتمد على `workspace_id` وعضوية المستخدم.

| الدور | قراءة Workspace | إدارة Workspace | قراءة الأعضاء | إدارة الأعضاء | قراءة العملاء | إدارة العملاء |
|---|---:|---:|---:|---:|---:|---:|
| owner | نعم | نعم | نعم | نعم | نعم | نعم |
| admin | نعم | لا | نعم | نعم | نعم | نعم |
| member | نعم | لا | نعم | لا | نعم | لا |

المصفوفة typed ومطبقة في `server/workspaces/access.ts` عبر `WorkspaceRole`, `WorkspaceCapability`, `canManageMembers`, و`canManageClients`. كما يعرّف `lib/local-first-contracts.ts` أدوار `LocalExternalRole` (`client`, `reader`, `reviewer`) وأدوار المشاركة `LocalShareRole` (`viewer`, `commenter`, `approver`) مع قدرات أولية. لا تُمنح هذه الأدوار كعضوية Workspace عامة قبل إغلاق بوابة المشاركة؛ يطبق التفعيل لاحقًا عبر `project_share` وسياسات البوابة.

## 2. مصفوفة العمليات

| المجال | القراءة | الإنشاء | التعديل/الأرشفة | الاسترجاع/الحذف | الحارس الإلزامي |
|---|---|---|---|---|---|
| السجلات الشخصية | صاحب `user_id` | جلسة صاحب الحساب | صاحب السجل | صاحب السجل | session + userId |
| Workspace | عضو active | capability مناسبة | capability مناسبة | capability مناسبة | session + workspace member |
| الأعضاء | owner/admin | owner/admin | owner/admin مع قواعد الدور | owner/admin، لا إزالة owner | `members:manage` |
| الدعوات | أعضاء مخولون | owner/admin | owner/admin أو المدعو للقبول | إلغاء منشيء/مدير | token hash + workspace membership |
| العملاء | كل عضو active للقراءة | owner/admin | owner/admin | owner/admin | `clients:read/manage` |
| بيانات الاعتماد | لا وصول افتراضي | flag + capability | re-auth لاحقًا | owner/admin وفق policy | experimental only |
| المشروع المشترك | عضو workspace أو share active | owner/admin أو policy | owner/admin أو role | owner/admin | workspace + project consistency |
| 2FA | صاحب الحساب | صاحب الحساب | صاحب الحساب + flag | صاحب الحساب | session + recent auth |

## 3. قواعد منع العزل المكسور

يُرفض الطلب إذا غابت الجلسة، أو لم توجد عضوية نشطة، أو كان `workspace_id` المطلوب مختلفًا عن مساحة السجل، أو كان الرابط الداخلي يشير إلى سجل تابع لمساحة أخرى. لا يكفي إخفاء زر في الواجهة؛ يجب أن يعيد Route Handler حالة رفض مستقلة.

عند التعامل مع علاقة مثل project/client أو project/update، يجب أولًا تحميل الكيان الأب ضمن نفس الـWorkspace ثم التحقق من الكيان التابع. لا تُقبل قيم IDs المرسلة من العميل كإثبات ملكية. عند استخدام fallback المحلي يجب تطبيق نفس `LocalScope` وعدم تسريب سجلات مساحة أو مستخدم إلى envelope عام.

## 4. تطبيق الريبو الحالي

| المسار/الطبقة | الحالة الحالية | الدليل |
|---|---|---|
| Workspace membership | مطبق | `server/workspaces/access.ts` |
| invitations | مطبق مع قواعد الدور | `app/api/workspaces/invitations/route.ts` |
| member removal | مطبق على `members:manage` | `app/api/workspaces/members/[memberId]/route.ts` |
| client create/read/update/archive | مطبق على workspace membership وcapability | `app/api/clients/route.ts`, `app/api/clients/[id]/route.ts` |
| local fallback contract | مطبق مبدئيًا | `lib/local-first-contracts.ts` |
| cross-user/cross-workspace مع Neon | غير مثبت فعليًا | لا توجد credentials في البيئة الحالية |

## 5. أدوار بوابة العميل

ستُدار أدوار `viewer`, `commenter`, و`approver` داخل المشاركة الخاصة بالمشروع، وليس عبر رفع دور المستخدم إلى `admin`. يجب أن تكون المشاركة قابلة للإبطال، وأن يُمنع الوصول بعد `status != active`، وأن تُقيد العمليات بنطاق المشروع والـWorkspace.
