# تحقق PWA وOffline

- تمت مراجعة `public/manifest.json` و`public/service-worker.js` و`components/pwa/pwa-register.tsx` وmetadata في `app/layout.tsx`.
- أُضيفت صفحة `/offline` عربية بنفس بطاقة الخطأ المشتركة، مع زر إعادة المحاولة ورابط العودة للمساحة الرئيسية.
- أُضيفت أيقونتا PWA بمقاسي `192x192` و`512x512` من أصل الهوية الحالي، مع الإبقاء على البدائل الموجودة.
- أصبح Service Worker يخزّن `/offline` و`/` و`/manifest.json` في cache التثبيت، ويستخدم صفحة offline كبديل عند فشل فتح طلب تنقّل غير مخزّن.
- الفحص البصري المحلي لمسار `http://localhost:3004/offline` نجح بعد إعادة تحميل كاملة: ظهرت الرسالة العربية والأزرار داخل بطاقة RTL متجاوبة.
- فحص console بعد التحميل النهائي لم يظهر أخطاء تشغيل؛ ظهر فقط اتصال HMR المعتاد في وضع التطوير.
- ملاحظة اختبار: أول تحديث ساخن أظهر طبقة خطأ قديمة بسبب cache التطوير، ثم اختفت بعد إعادة تحميل كاملة؛ لا يظهر الخطأ في الحالة النهائية.


## Production smoke test

بعد إعادة تشغيل خادم production المحلي من build الحالي، أعادت `/offline` الحالة `200` مع `text/html`، وأعاد `/manifest.json` الحالة `200` مع `application/json`، وأعاد `/service-worker.js` الحالة `200` مع `application/javascript`. تحققت الاختبارات كذلك من ظهور النص العربي ووجود `icon-512.png` وثابت `/offline` داخل Service Worker. نجحت الفحوصات الثلاثة.
