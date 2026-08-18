# محضر المرحلة الخامسة — Backend والبيانات

التاريخ: 2026-08-18

## نطاق الدفعة

راجعت هذه الدفعة عقود الجلسة والاتصال بقاعدة البيانات، عزل الاستعلامات بالمستخدم، مخطط Drizzle، تصدير الحساب وحذفه، مع الالتزام بعدم تشغيل `drizzle-kit generate` بسبب اختلاف journal الموثق سابقًا.

## المطابقة

| البند | الحالة | الدليل |
|---|---|---|
| 5.1 — schema وعلاقات الملكية | مغلق محليًا | `server/db/schema.ts`، `docs/data-dictionary.md`، `docs/ownership-and-roles.md`، وتدقيق Route الملكية |
| 5.2 — Better Auth والجلسة | مغلق تعاقديًا | `server/auth/session.ts` وRoutes البيانات تستخدم `getCurrentUser` مع 401 عند غياب الجلسة |
| 5.3 — Route Handlers والـlocal fallback | مغلق في الكود المحلي | Route Handlers الحالية تستخدم `getDb` بعد التحقق من الجلسة، وتعيد 503 آمنًا عند غياب إعداد الخادم، بينما الواجهة تحتفظ بمسار localStorage fallback |
| 5.4 — عزل user_id والملكية | مغلق في التدقيق الساكن | `scripts/audit_route_ownership.py`: 48 Route، منها 44 session/visible، و44 ذات ملكية ظاهرة، دون فجوات |
| 5.5 — export/delete | محسّن ومختبر بنيويًا | توسعة `app/api/account/export/route.ts` لتشمل workspace والعملاء والتقويم والمكتبة والجلسات و2FA وتحديثات/تسعير/مشاركة المشاريع، وتوسعة `app/api/account/route.ts` لحذف الجداول الشخصية الجديدة داخل transaction |

## التعديلات التنفيذية

أصبح تصدير الحساب يغطي البيانات الشخصية التي أضيفت في مساحة العمل والدومينات التجريبية، مع تقييد كل قراءة بـ`currentUser.id` أو بحقل الملكية المناسب مثل `ownerId` و`createdBy`. كما أصبح حذف الحساب ينظف بيانات هذه الدومينات داخل transaction قبل حذف المستخدم، مع الاعتماد على علاقات `onDelete: cascade` الموجودة للجداول التابعة.

## البوابات

| البوابة | النتيجة |
|---|---|
| TypeScript | PASS |
| ESLint | PASS |
| Webpack production build | PASS — 28 صفحة و48 Route API |
| Route ownership audit | PASS — 48/48 |
| Responsive audit | PASS — 34/34، بلا failures |
| Accessibility audit | PASS — 34/34، بلا failures |
| `git diff --check` | PASS قبل تنظيف artifacts |

## حدود التحقق

`DATABASE_URL` و`BETTER_AUTH_SECRET` غير موجودين في بيئة التنفيذ الحالية؛ لذلك لم أدّعِ اختبار اتصال Neon أو جلسة Better Auth إنتاجية أو migration على قاعدة حقيقية. ما يزال اختلاف `server/db/migrations/meta/_journal.json` مع ملفات migrations اللاحقة قائمًا، ولم يتم تشغيل `drizzle-kit generate` أو تطبيق migration تلقائيًا.

## قرار الدفعة

المرحلة الخامسة مغلقة محليًا من ناحية العقود والكود والتدقيقات، مع إبقاء التحقق الإنتاجي الفعلي وقاعدة البيانات في قائمة الاعتماد المشروط حتى تُضاف credentials الصحيحة ويُحل اختلاف journal بأمان.

## اختبار إضافي بعد build

أُعيد تشغيل خادم الإنتاج المحلي من build المرحلة الخامسة على `localhost:3004`. أعادت الصفحة الرئيسية `/` الحالة 200، وأعادت صفحة `/account` واجهة عربية RTL سليمة دون أخطاء مرئية. أعاد `GET /api/account/export` الحالة 401 عند غياب الجلسة، وهو السلوك المتوقع قبل الوصول إلى قاعدة البيانات؛ وأعاد `GET /api/account` الحالة 405 لأن Route الحساب لا يعرّف GET، بينما DELETE محمي بعقد الجلسة في الكود.
