# سجل تحقق دفعة Projects / Goals

## نطاق الدفعة

أضيفت واجهة عربية للأهداف والمشاريع مع علاقة واضحة `goal → project → task`. تعتمد الواجهة على البيانات التجريبية والحالة المركزية مع optimistic localStorage fallback، بينما أصبحت طبقة المزامنة وRoute Handlers جاهزة للعمل عند توفير جلسة Better Auth وقاعدة Neon.

## الملفات الرئيسية

| المجال | الملفات |
|---|---|
| الحالة والمزامنة | `lib/command-center-store.tsx`، `lib/backend-sync.ts` |
| الواجهة | `components/goals/goals-workspace.tsx`، `components/projects/projects-workspace.tsx`، `app/goals/page.tsx`، `app/projects/page.tsx` |
| قاعدة البيانات | `server/db/schema.ts`، `server/db/migrations/0002_zippy_pestilence.sql` |
| APIs | `app/api/goals/route.ts`، `app/api/goals/[id]/route.ts`، `app/api/projects/route.ts`، `app/api/projects/[id]/route.ts`، وتوسعة Tasks لدعم `projectId` |

## الاختبارات المنفذة

| الاختبار | النتيجة |
|---|---|
| `./node_modules/.bin/tsc --noEmit` | ناجح بلا أخطاء |
| `pnpm exec next build` | ناجح؛ تم توليد 18 مسارًا، منها `/goals` و`/projects` وواجهاتهما البرمجية |
| فتح `/projects` بعد إعادة تشغيل production | ناجح؛ ظهرت لوحة Kanban بأعمدة قادم، جاري، مكتمل وبطاقات المشاريع ونموذج الإضافة |
| فتح `/goals` | ناجح؛ ظهرت بطاقات الأهداف ومؤشرات التقدم وعدد المشاريع المرتبطة ونموذج الإضافة |
| إضافة هدف من المتصفح دون credentials | ناجح؛ ظهر الهدف فورًا وتغيرت الإحصاءات، ما يؤكد fallback المحلي المتفائل |
| `GET /api/goals` دون جلسة | `401 Unauthorized` مع رسالة عربية: يجب تسجيل الدخول أولًا |
| `GET /api/projects` دون جلسة | `401 Unauthorized` مع `application/json`، ولا تُعرض أي بيانات؛ ظهر body في بعض استدعاءات curl بشكل غير ثابت بسبب الاستجابة chunked المحلية |

## قيود معلومة

لا توجد قيم فعلية لـ`DATABASE_URL` أو`BETTER_AUTH_SECRET` في البيئة الحالية، لذلك لم يُختبر الاتصال الفعلي بقاعدة Neon أو سيناريو مستخدم مسجل الدخول. ما تم التحقق منه هو حماية الـAPI، سلامة compilation، وتجربة الواجهة مع fallback المحلي.

يبقى drag-and-drop والتحرير التفصيلي داخل البطاقات تحسينًا لاحقًا؛ الدفعة الحالية توفر تغيير الحالة عبر الأزرار، الإضافة، التقدم، الأرشفة، وربط الهدف بالمشروع والمشروع بالمهمة.

## قرار الدفعة

الدفعة مكتملة جزئيًا وقابلة للانتقال إلى Finance أو Religious ضمن V1، مع تأجيل التوسع المتقدم إلى دورة لاحقة بعد توفير credentials واختبار ownership بين مستخدمين فعليين.

تم كذلك اختبار `POST /api/projects` دون جلسة مع payload تجريبي، وأعاد `401 Unauthorized` دون إنشاء أي سجل. وبذلك تغطي اختبارات المرحلة مساري القراءة والكتابة للمشاريع، إضافة إلى GET للأهداف.

نجح `git diff --check` بعد إزالة `tsconfig.tsbuildinfo` المحلي، ولم تظهر أخطاء whitespace في التغييرات الحالية.
