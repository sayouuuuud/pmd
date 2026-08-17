# مقارنة الخطة المدمجة بالريبو الفعلي

**المشروع:** Personal Command Center — منصة تشغيل شخصي عربية

**تاريخ اللقطة:** 2026-08-17

**مصدر الخطة:** `/home/ubuntu/upload/الخطةالمدمجةالكاملة—PersonalCommandCenter.md`

**مصادر التنفيذ:** `EXECUTION_PLAN.md`، الشجرة الحالية، schema وAPI والمكونات، سجلات `verification/`، وسجل Git.

**نقطة المقارنة:** `36148d7 (HEAD -> main, origin/main) — feat: add Arabic dark mode theme`

## 1. منهج المقارنة

تم التفريق بين وجود ملف أو Route وبين اكتمال الوظيفة. لا يُعد وجود Route أو جدول وحده تنفيذًا كاملًا. صُنّف كل بند وفق الأدلة التالية:

| التصنيف | التعريف العملي |
|---|---|
| **منفذ ومثبت** | يوجد تنفيذ فعلي قابل للاستخدام، ومعه اختبار أو سجل تحقق أو commit يثبت السلوك. |
| **منفذ جزئيًا** | يوجد جزء حقيقي من الوظيفة، لكن بعض العلاقات أو الحالات أو تكامل الإنتاج أو الأدلة ما زالت ناقصة. |
| **غير منفذ** | لا يوجد مسار استخدام قابل للاختبار ضمن الريبو الحالي. |
| **قرار/تقوية لاحقة** | البند موجود في الخطة، لكنه تجريبي أو حساس ويحتاج feature flag أو تقوية قبل اعتباره جاهزًا للإنتاج. |

الجرد الفعلي يثبت وجود **21 صفحة تطبيق، و45 ملف API route، و33 جدولًا في schema**. هذه الأرقام تثبت اتساع الأساس، لكنها لا تعني اكتمال المراحل الأعلى؛ لذلك أُضيفت الأدلة النوعية لكل محور.

## 2. الخلاصة التنفيذية

الريبو الحالي ليس فارغًا ولا مجرد Prototype بصري. توجد قاعدة قوية للحياة اليومية، ومصادقة email/password، وطبقة Drizzle/Neon، ومسارات Remote محمية لعدد كبير من المجالات، وWorkspace/Client أساسيان، وProjects/Pricing، وPWA جزئي، واختبارات متصفح وتدقيق RTL/responsive/accessibility موثقة. كما أُضيف Dark Mode عام في commit `36148d7` مع حفظ التفضيل في `localStorage` ودعم تفضيل النظام.

في المقابل، الخطة المرفقة وسّعت النطاق جذريًا إلى بوابة عميل، وتعاون متعدد المستخدمين، وحسابات دخول تجريبية، وفوترة، و2FA، ومراقبة Windows، ومكتبة ملفات، وتقوية إنتاجية. هذه الإضافات **ليست منفذة بالكامل** في الكود الحالي، وبعضها غير منفذ أصلًا. كما أن الخطة المرفقة نفسها تنص على أنها مسودة نقاش لم تُعتمد رسميًا، بينما `EXECUTION_PLAN.md` هو سجل التنفيذ الفعلي الموجود في المستودع؛ لذلك لا يصح اعتبار المراحل الجديدة مغلقة لمجرد وجودها في الوثيقة.

> النتيجة المختصرة: **الأساس اليومي والـVertical Slice الأول قويان، والـV1 منفذ جزئيًا، أما V1.5 وV2 التجريبي وProduction Hardening فما زالت مراحل مستقبلية بدرجات مختلفة.**

## 3. مصفوفة المقارنة المرحلية

| المرحلة في الخطة المرفقة | الحالة الحالية | ما يثبت التنفيذ | الفجوة أو القيد |
|---|---|---|---|
| **1. اعتماد النطاق التجريبي والقرارات الكبرى** | **قرار غير مغلق** | الخطة تحدد أن بوابة العميل، المشاركة، الحسابات الحساسة، 2FA، Windows monitor، والفوترة تجريبية. | لا توجد قائمة رسمية موحدة للـfeature flags وحدود التجريبي/الإنتاج في runtime. الوثيقة نفسها ما زالت مسودة، ولم تُحوّل بالكامل إلى `EXECUTION_PLAN.md`. |
| **2. تدقيق الأساس وعقود البيانات والملكية** | **منفذ جزئيًا وبأساس قوي** | توجد جداول `workspace`, `workspace_member`, `workspace_invitation`, `client`, `client_credential`، ومساعدات `getWorkspaceForMember` و`ensureWorkspaceMember`. توجد APIs محمية وملكية للمستخدم/مساحة العمل، وسجلات migrations مرتبة. | أدوار العضو موجودة كأساس، لكن تدفقات الدعوات والقبول والصلاحيات التفصيلية وإبطال الوصول غير مكتملة. لا توجد ERD/قاموس بيانات نهائيان مطابقان لكل الإضافات الجديدة. لا يجوز تشغيل `drizzle-kit generate` قبل حل اختلاف journal. |
| **3. إغلاق فجوات الأساس وتجربة الاستخدام** | **منفذ بدرجة جيدة مع بنود جزئية** | Shell وTopNav وPageShell و`components/ui` وRTL/Cairo وloading/empty/offline موجودة. اختبارات responsive وaccessibility المركزية موثقة، وسلسلة إصلاحات live-region العربية أُغلقت. Dark Mode العام أُضيف واختُبر في `dark-mode-browser-findings-2026-08-17.md`. | لا يوجد دليل واحد يثبت مراجعة كل حالة loading/empty/error لكل Route في اللقطة الحالية. بعض النوافذ القديمة ما زالت خارج Dialog الموحد، والاختبارات الشاملة للموبايل/keyboard لكل المسارات تحتاج مصفوفة مستقلة. |
| **4. إغلاق MVP الحياة اليومية** | **منفذ جزئيًا وقابل للاستخدام** | Tasks وSubtasks، Notes، Habits، Journal، Daily Plan، Dashboard، Weekly Review، Quick Add ومساراتها الأساسية موجودة. توجد سجلات متصفح وبوابات جودة متعددة، وروابط مصدرية عميقة في Daily Plan وWeekly Review. | بعض التفاصيل المتقدمة ما زالت ناقصة أو جزئية: Heatmap/mood الكامل في Journal، التكرار المتقدم ونقل التاريخ في Daily Plan، الربط العميق الشامل بين الملاحظة والمهمة، وعمق حالات الفشل/المزامنة في كل الأقسام. معيار «إدارة يوم كامل دون فقدان السياق» يحتاج اختبار E2E مركزيًا واحدًا. |
| **5. Backend وBetter Auth وNeon و2FA التجريبي** | **Backend/Auth جزئي؛ 2FA غير منفذ runtime** | `server/auth.ts` يثبت Better Auth email/password مع Drizzle/session، و`app/api/auth/[...all]` موجود. توجد APIs محمية لـTasks/Notes/Habits/Daily Plan/Profile وغيرها، واتصال Neon lazy، وfallback محلي. يوجد جدول `second_factor_setting` في schema. | لا يوجد plugin أو challenge أو recovery flow أو feature flag فعلي لـ2FA في `server/auth.ts`. التحقق بجلسة وقاعدة بيانات حقيقية ينتظر credentials. اختبارات cross-user/network recovery والفهارس المركبة الشاملة غير مغلقة كحزمة إنتاجية. |
| **6. مساحة العمل وملفات العملاء** | **منفذ جزئيًا** | `/workspace` موجود، مع Workspace API لإنشاء/عرض المساحات، وClients CRUD، archive/restore، ownership عبر workspace membership، وصفحة ومكونات عربية. توجد أدلة `workspace-clients-browser-audit.md` ودفعة live-region الأخيرة. | لا توجد Work Dashboard كاملة بكل العملاء والمشاريع والدفعات والموارد كما تصف الخطة. ملف العميل لا يغطي كامل الحقول والعلاقات المطلوبة. `client_credential` موجود في schema، لكن تدفقات الحسابات التجريبية المقنّعة/feature flag والخزنة غير موجودة. لا توجد دعوات أعضاء أو صلاحيات عملية. |
| **7. المشاريع والتحديثات والتسعير والمال** | **منفذ جزئيًا** | توجد Projects/Goals UI وAPIs للمشاريع، updates، pricing، وجداول `project_update` و`project_pricing` و`finance_entry`. pricing يدعم العميل والمبلغ والعملة والحالات وتواريخ الاستحقاق والتحصيل، مع ownership checks، ويوجد Finance workspace وAPI. | لا توجد منظومة milestones متكاملة، أو أعضاء فريق للمشروع، أو تعليقات/ملفات مرتبطة بالتحديثات. تكامل «عند تحصيل الدفعة أنشئ دخلًا تلقائيًا» غير مثبت كتدفق مكتمل. السعر التجريبي ليس نظام فواتير/دفعات قانونيًا، ولا توجد لوحة مالية موحدة بكل العلاقات المطلوبة. |
| **8. بوابة العميل والمشاركة والتعاون متعدد المستخدمين** | **غير منفذ عمليًا** | توجد أساسيات Workspace/Member/Client في schema ومساعدات membership. | لا توجد بوابة عميل عامة، ولا invitation acceptance، ولا shared-project permissions، ولا comments/approval، ولا audit/change log، ولا revoke access flow. لا توجد صفحات أو APIs عامة مخصصة للعميل. هذا محور كبير يحتاج Milestone مستقلًا، وليس مجرد توسيع Workspace CRUD. |
| **9. التقويم الموحد** | **منفذ جزئيًا** | `/calendar` و`calendar-events` API و`calendarEvent` table موجودة، مع مكون Calendar وروابط من بعض المجالات. توجد ownership checks وarchived state في API. | لا يوجد دليل اكتمال كل المصادر المذكورة: milestones، updates، habits، reviews، payments، client appointments. عروض month/week/day والفلاتر والتأكيد عند نقل عنصر مرتبط وtimezone وDashboard widget ليست كلها مثبتة في سجل واحد. |
| **10. البحث والأرشيف والتذكيرات والعلاقات** | **منفذ جزئيًا** | Global Search Dialog موجود، وArchive API/page يغطي عدة أنواع منها clients، tasks، notes، habits، goals، projects، finance، reminders، journals وentertainment. Reminders page/API موجودة، وبعض deep links والعلاقات موجودة. | البحث لا يغطي بوضوح resources/files/events/updates/payments كلها. سجل الاقتراحات مع accept/reject/reason غير مثبت. استرجاع كل الأنواع مع الحفاظ على كل العلاقات، والتذكيرات المرتبطة بالدفعات والمتابعات، تحتاج اختبارًا وتوسيعًا. |
| **11. المكتبة والموارد والملفات** | **غير منفذ كميزة مستخدم** | جدول `library_resource` موجود ضمن schema، ما يدل على قابلية توسعة بيانات أولية. | لا توجد صفحة أو API أو component كامل للمكتبة، ولا upload/storage/search/favorites/archive لملفات الموارد. وجود الجدول وحده لا يحقق معيار الإغلاق. |
| **12. الفوترة والمحاسبة التجريبية** | **منفذ جزئيًا جدًا** | `project_pricing` وPricing APIs تدعم عنوان السعر والمبلغ والعملة والحالة والتاريخ وربط العميل/المشروع، وFinance موجود. | لا توجد quotes/invoices كاملة، ولا حالات الفاتورة السبع، ولا بنود وخصومات وضرائب، ولا export/print، ولا Revenue dashboard متكاملة، ولا تدفق مصدر واضح من invoice إلى Finance. |
| **13. جامع نشاط Windows التجريبي والتحليلات** | **غير منفذ** | لا يوجد Windows agent أو runtime لجمع مدة التطبيقات/الخمول أو مزامنة جلسات النشاط ضمن جرد التطبيق الحالي. | لا توجد settings/flags، ولا local queue، ولا pause/exceptions/delete، ولا Dashboard نشاط. Screenshots وkeylogging وقراءة محتوى الصفحات ليست منفذة، ويجب أن تبقى منفصلة وخلف flags وبعد قرار أمني صريح. |
| **14. التقوية النهائية والأمان والخصوصية والإطلاق الحقيقي** | **غير مغلق** | توجد ownership checks، session-aware APIs، وبعض accessibility/security hygiene، ولا توجد secrets في الريبو بحسب السجلات الحالية. | لا توجد خزنة أسرار وإعادة مصادقة، 2FA hardened، RBAC كامل، مراجعة مشاركة/إبطال، فحص مرفقات، سياسات retention، Security headers/CSRF suite موثقة، cross-user/cross-workspace E2E، backup/restore/runbook، أو بوابة إطلاق حقيقية مكتملة. |

## 4. المطابقة مع ترتيب الإصدارات

| الإصدار | تقييم الحالة الحالية |
|---|---|
| **MVP الحالي** | **قوي لكنه غير مغلق رسميًا بالكامل.** معظم الحياة اليومية موجودة، لكن بعض العلاقات وحالات الاستخدام واختبار E2E المركزي ما زالت جزئية. |
| **V1** | **منفذ جزئيًا.** Religious وProjects وGoals وFinance وSearch وReminders وWorkspace وClients وCalendar لها أساس فعلي، لكن الربط الإنتاجي والتفاصيل الكاملة والعلاقات ما زالت غير مكتملة. |
| **V1.5** | **معظمه غير منفذ.** بوابة العميل، المشاركة، تعدد المستخدمين، المكتبة، الملفات، التسعير المتقدم، والفوترة الكاملة ليست جاهزة. |
| **V2 التجريبي** | **غير منفذ إلا أجزاء PWA/Theme والبنية الأولية.** 2FA المتقدم وWindows monitor والتحليلات والاقتراحات الذكية وOffline sync الكامل غير مغلقة. |
| **Production Hardening** | **غير منفذ كمرحلة إطلاق.** الأساس الأمني موجود، لكن بوابة التشغيل الحقيقي لم تنجح بعد وفق معايير الخطة المرفقة. |

## 5. ملاحظات مهمة على `EXECUTION_PLAN.md`

يحتوي `EXECUTION_PLAN.md` حاليًا على **114 علامة `[x]` و0 علامات غير مغلقة `[ ]`**. هذا مفيد كسجل لما أُنجز ضمن الخطة الأصلية، لكنه لا يعني اكتمال الخطة المدمجة الجديدة؛ فالخطة المرفقة تضيف مراحل بوابة العميل، المكتبة، الفوترة، Windows، و2FA المتقدم بعد آخر أقسام الخطة الأصلية.

لذلك يجب عدم تحويل «كل العلامات القديمة مكتملة» إلى نسبة اكتمال للخطة المدمجة. الأفضل إضافة سجل صريح للمراحل الجديدة بحالات `جزئي/غير منفذ/قرار مطلوب` بدل وضع علامات `[x]` عامة.

كما أن الخطة المرفقة تقول في السطر 7 إن التنفيذ لم يبدأ اعتمادًا عليها وإن `EXECUTION_PLAN.md` لم يكن معدّلًا بها، بينما حالة Git الحالية تثبت أن الريبو نفذ بالفعل دفعات لاحقة، من بينها:

| Commit | الدلالة |
|---|---|
| `36148d7` | Dark Mode عربي عام مع حفظ التفضيل |
| `3e8a227` | إغلاق تدقيق accessibility لرسائل التحقق العربية |
| `bfe947d` | live-region لأخطاء مساحة العمل |
| `bff363a` | live-region لأخطاء تعديل المهمة والخطوة الفرعية |
| `5578894` | توحيد metadata للقسم الديني |
| `2e73739` | live-region لأخطاء نماذج القسم الديني |

هذا يعني أن الخطة المرفقة أصبحت **مرجع نطاق ومقارنة**، بينما `EXECUTION_PLAN.md` وسجل Git هما مرجع ما حدث فعليًا.

## 6. أعلى الفجوات ذات الأولوية

| الأولوية | الفجوة | سبب الأولوية | تعريف الإغلاق المقترح |
|---|---|---|---|
| P0 | تثبيت الخطة الرسمية والـfeature flags | يمنع تنفيذ ميزات حساسة بلا حدود تشغيل | تحديث `EXECUTION_PLAN.md` بمصفوفة المراحل الجديدة، وتحديد flags وبيئة تجريبية وحدود production |
| P0 | 2FA تجريبي قابل للاختبار | الخطة تعتبره جزءًا من V2/Backend، والجدول وحده غير كافٍ | تفعيل/تعطيل/challenge/recovery/status مع feature flag واختبارات جلسة وفقدان وصول |
| P0 | ownership/RBAC والدعوات | أساس بوابة العميل والتعاون | invitation/accept/revoke، أدوار وصلاحيات، cross-user/cross-workspace tests، audit log |
| P1 | إكمال Client Workspace | يفتح الطريق للمشاركة والتسعير والفوترة | Dashboard عمل، ملف عميل كامل، علاقات projects/files/updates/calendar/search، وCRUD/archive/restore موثق |
| P1 | إكمال Projects/Pricing/Finance | يربط قيمة المشروع بالتحصيل والمال | milestones، updates، pricing states، payment transitions، Finance source integration، dashboard |
| P1 | توحيد Calendar/Search/Archive | يقلل الجزر المنفصلة ويحفظ السياق | كل المصادر، filters، deep links، timezone، restore relation integrity، suggestion log |
| P2 | Library/Files/Attachments | مطلوب لبوابة العميل والفريق والفوترة | resource CRUD، private upload/storage، relations، search/favorites/archive |
| P2 | Client Portal/Collaboration | نطاق V1.5 مستقل وكبير | public/authenticated portal، shared data، comments/approvals، notification، revoke |
| P2 | Billing experimental | يعتمد على client/project/pricing/finance | quotes/invoices/states/line items/export وربط مالي موثق |
| P3 | Windows monitor | نطاق منتج مستقل وخطره الأمني مرتفع | agent اختياري، consent/flags، local queue، sync، pause/delete/retention، dashboard، اختبارات offline |
| P3 | Production hardening وPWA offline الكامل | شرط التشغيل الحقيقي | vault/reauth/security headers/CSRF/uploads/backups/runbook، offline queue/conflicts، production E2E |

## 7. ما تم إنجازه في جلسة Dark Mode

أُضيفت طبقة Dark Mode عامة متسقة مع الهوية الحالية، مع `ThemeProvider`، bootstrap مبكر لمنع الوميض، semantic dark tokens، وزر تبديل عربي في `TopNav`. اختُبر التبديل في المتصفح، والتحقق من class الجذر و`color-scheme` و`localStorage`، ثم إعادة التحميل واستعادة التفضيل. نجحت بوابات TypeScript وESLint وNext build والتدقيقات الحالية، واعتمدت الدفعة في `36148d7` ورفعت إلى `origin/main`.

## 8. القرار التنفيذي المقترح

لا يُنصح بالانتقال مباشرة إلى Windows monitor أو تخزين بيانات دخول العملاء أو Keylogging/Screenshots. الترتيب الآمن والعملي هو:

1. اعتماد هذا التقرير كخط أساس صريح، وتحديث `EXECUTION_PLAN.md` بحالات المراحل الجديدة بدل اعتبارها مغلقة.
2. إغلاق 2FA التجريبي وRBAC/invitations مع اختبارات cross-user قبل أي بوابة عميل.
3. إكمال Workspace/Client ثم Projects/Pricing/Finance والعلاقات المشتركة.
4. تنفيذ Calendar/Search/Archive/Reminders كطبقة تكاملية واحدة.
5. تنفيذ Library/Files ثم Client Portal/Billing التجريبي.
6. تأجيل Windows monitor وميزات Screenshots/Keylogging/قراءة المحتوى إلى تجربة منفصلة خلف flags وبعد توثيق consent/retention/delete.
7. إنهاء Production Hardening وPWA offline الكامل قبل اعتبار المنتج جاهزًا للتشغيل الحقيقي.

## 9. الأدلة المرجعية

- الخطة المدمجة: `/home/ubuntu/upload/الخطةالمدمجةالكاملة—PersonalCommandCenter.md`
- الخطة التنفيذية الفعلية: `/home/ubuntu/pmd/EXECUTION_PLAN.md`
- الجرد النظيف: `verification/plan-comparison-clean-inventory-2026-08-17.txt`
- ملخص مصدر المقارنة: `verification/plan-comparison-source-summary-2026-08-17.md`
- أدلة Dark Mode: `verification/dark-mode-browser-findings-2026-08-17.md` و`verification/dark-mode-live-region-ar-2026-08-17.md`
- سجلات accessibility المركزية: `verification/a11y-validation-gap-closure-2026-08-17.md` و`verification/full-plan-audit-matrix-2026-08-17.md`
- آخر حالة Git: `36148d7`, متزامنة مع `origin/main` قبل إضافة تقرير المقارنة.

**الخلاصة:** الخطة الأصلية قطعت شوطًا كبيرًا في الأساس والـMVP وبدأت V1، لكن الخطة المدمجة الجديدة أوسع بكثير من التنفيذ الحالي. أكبر فجوات حقيقية هي 2FA runtime، RBAC/invitations، بوابة العميل، المكتبة والملفات، الفوترة الكاملة، Windows monitor، وProduction Hardening. يجب التعامل معها كمراحل مستقلة قابلة للاختبار، لا كميزات مكتملة لمجرد وجود جداول أو Routes أولية.

---

## ملحق: تصحيح تعارض عدد المراحل

ظهر في ملخص العمل المحلي السابق تعبير «18 مرحلة»، لكن الوثيقة المرفقة نفسها تحتوي على **14 مرحلة رئيسية** من المرحلة 1 إلى المرحلة 14، ثم أقسام ترتيب الإصدارات ودورة التحقق ونقاط القرار. اعتمد هذا التقرير عناوين الوثيقة الأصلية ذات الـ14 مرحلة، حتى لا تُحتسب أقسام الإصدارات أو القرارات كمراحل تنفيذ مستقلة.

## ملحق: حدود التحقق

هذا التقرير يقيّم التنفيذ الموجود في الشجرة وسجل Git وسجلات التحقق المتاحة. لا يدّعي نجاح اتصال الإنتاج أو credentials أو اختبارات مستخدمين حقيقيين لم تُشغّل في هذه اللقطة. كما لا يعتبر وجود `client_credential` أو `second_factor_setting` أو `library_resource` وحده تنفيذًا للميزات الحساسة المرتبطة بها.

تظل قاعدة التنفيذ سارية: لا أسرار في الريبو، كل query محمي بملكية/جلسة مناسبة، لا `drizzle-kit generate` قبل حل اختلاف journal، ولا تُعلن مرحلة مكتملة دون اختبار قابل للتكرار ودليل محفوظ.

---

*أُعد هذا التقرير للمقارنة واتخاذ قرار ترتيب التنفيذ، وليس لتحويل البنود التجريبية الحساسة إلى ميزات إنتاجية تلقائيًا.*
