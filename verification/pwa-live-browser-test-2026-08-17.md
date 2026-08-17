# تحقق إشعار PWA الحي — 2026-08-17

## النطاق
اختبار `components/pwa/pwa-register.tsx` بعد إضافة `aria-live="polite"` و`aria-atomic="true"` إلى عنصر `aside` ذي `role="status"`.

## بيئة الاختبار
شُغّل build إنتاجي ثم خادم Next على `http://localhost:3005/`. أكدت الصفحة العنوان العربي `المساحة الشخصية | مركز القيادة`، و`window.isSecureContext === true`، ووجود `navigator.serviceWorker` وcontroller فعال.

## نتيجة المحاولة التفاعلية
أُرسل حدث `beforeinstallprompt` صناعيًا عبر `window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true }))`. لم يظهر عنصر PWA في DOM بعد المحاكاة؛ استعلام `[role="status"]` أعاد صفر عناصر. لذلك لا يُسجَّل هذا كإثبات إيجابي لظهور الإشعار، ولا يُنسب الفشل إلى live-region نفسه. الاحتمال التشخيصي هو أن Chromium لا يقبل الحدث الصناعي كـ`BeforeInstallPromptEvent` القابل للعرض أو أن حالة التثبيت الحالية تمنع prompt.

## دليل الإصلاح
الفحص الساكن للمكوّن يثبت وجود `role="status" aria-live="polite" aria-atomic="true"` على عنصر الإشعار، بينما لم يكن الاختبار التفاعلي قادرًا على إنشاء الحالة الأصلية الخاصة بالمتصفح. يلزم التعامل مع اختبار المتصفح كـstatic/production verification محدود وعدم الادعاء بأن prompt الحقيقي ظهر.

## البوابات
TypeScript وESLint وNext build PASS. تحذير middleware deprecated معلوماتي فقط.
