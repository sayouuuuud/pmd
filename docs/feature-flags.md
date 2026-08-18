# عقد Feature Flags — Personal Command Center

## الغرض

هذا العقد هو مصدر الحقيقة لتحديد ما إذا كانت الميزة جزءًا من المنتج المستقر أو تجربة محكومة. الـFeature Flags هنا **بوابات تجربة وواجهة فقط**؛ لا تستبدل فحص الجلسة أو `user_id` أو ملكية المورد أو تفويض الخادم، ولا تمنح صلاحية إضافية لأي مستخدم.

يتم تعريف العقد في [`lib/feature-flags.ts`](../lib/feature-flags.ts)، وتُقرأ قيم الميزات التجريبية من متغيرات `NEXT_PUBLIC_*` موثقة في [`.env.example`](../.env.example). كل قيمة تجريبية متوقفة افتراضيًا، ولا تُفتح إلا صراحةً بقيمة `1` أو `true`.

## الحالة الحالية

| المجموعة | الميزات | الحالة الافتراضية | ملاحظات |
|---|---|---:|---|
| مستقرة | Workspace، Updates/Pricing، Personal Suggestions | مفعلة | لا تعتمد على flags تجريبية |
| تجريبية | 2FA، Client Portal، Client Credentials، Workspace Sharing، Resource Library، Billing، Windows Agent | متوقفة | لا تُعتبر جاهزة للإنتاج بمجرد فتح flag |
| محظورة صراحةً | Windows Sensitive Collection | متوقفة | تشمل أي جمع حساس؛ لا تُفتح ضمن هذه المرحلة |

## المتغيرات

| المتغير | الميزة | سبب الإيقاف الافتراضي |
|---|---|---|
| `NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_2FA` | 2FA التجريبي | لا يزال تدفق login challenge وrecovery واختبار الإنتاج مفتوحًا |
| `NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_CLIENT_PORTAL` | بوابة العميل | المشاركة والتعليقات والموافقات والعزل الإنتاجي غير مكتملة |
| `NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_CLIENT_CREDENTIALS` | بيانات اعتماد العميل | لا توجد خزنة إنتاجية مكتملة؛ يمنع تخزين كلمات المرور كنص عادي |
| `NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_WORKSPACE_SHARING` | مشاركة Workspace | RBAC واختبارات العزل والـrevocation غير مكتملة |
| `NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_RESOURCE_LIBRARY` | الموارد والمكتبة | التخزين الخاص والرفع والبحث والاحتفاظ غير مكتملة |
| `NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_BILLING` | الفوترة التجريبية | Quotes/Invoices/Line Items والحالات والتصدير غير مكتملة |
| `NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_WINDOWS_AGENT` | Windows Agent | agent والـqueue والمزامنة وسياسات الخصوصية غير مكتملة |
| `NEXT_PUBLIC_PMD_ENABLE_EXPERIMENTAL_WINDOWS_SENSITIVE_COLLECTION` | الجمع الحساس من Windows | محظور خارج النطاق؛ لا يُفتح ضمن الخطة الحالية |

## قواعد الفتح

لا يكفي تفعيل flag لإعلان الميزة جاهزة. قبل فتح أي flag في بيئة مشتركة يجب أن تملك الميزة عقد API موثقًا، وفحص جلسة وملكية على الخادم، واختبارًا سلبيًا لمستخدم أو Workspace غير مصرح له، ومسار fallback محليًا عند غياب قاعدة البيانات حيث ينطبق، واختبارًا بصريًا RTL/Responsive/Accessibility، وتوثيقًا في `EXECUTION_PLAN.md` وسجلات التحقق.

بالنسبة إلى 2FA، لا يُفتح flag إلا بعد إغلاق login challenge وrecovery/backup-code rotation وإبطال الجلسات واختبار إعادة المصادقة. وبالنسبة إلى Client Credentials، يمنع العقد تمامًا تخزين كلمات المرور كنص عادي. وبالنسبة إلى Windows Sensitive Collection، يبقى flag متوقفًا حتى لو كانت بقية ميزات Windows مفعلة مستقبلًا.

## الاستخدام البرمجي

يُستورد العقد من `lib/feature-flags.ts` بدل قراءة متغيرات البيئة مباشرة داخل المكونات. واجهة الحساب وعميل Better Auth وخادم Better Auth يطبقون flag 2FA نفسه؛ لذلك لا يظهر قسم 2FA ولا تُسجل إضافة العميل ولا تُركب إضافة الخادم عندما يكون flag متوقفًا.

مثال:

```ts
import { featureFlags } from '@/lib/feature-flags'

if (featureFlags.experimental.twoFactor) {
  // Render or register the experimental flow only.
}
```

يجب أن تبقى أي حماية فعلية في المسار server-side حتى عند وجود flag، لأن متغيرات `NEXT_PUBLIC_*` قابلة للرؤية للعميل ويمكن العبث بها في المتصفح.

## معيار اعتماد المرحلة الأولى

تُعتبر مرحلة اعتماد النطاق والـFeature Flags مكتملة عندما تكون الميزات المستقرة معرفة بوضوح، وكل الميزات التجريبية المذكورة في الخطة لها أسماء ثابتة ووصف وسبب إيقاف، وتكون متوقفة دون إعداد، ولا تُضاف secrets إلى الريبو، ويُختبر البناء وTypeScript وESLint وسلوك 2FA في حالتي flag المغلق والمفتوح محليًا.
