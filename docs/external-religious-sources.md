# مصادر القسم الديني

## AlAdhan Prayer Times API

- المصدر الرسمي: https://aladhan.com/prayer-times-api
- تم التحقق فعليًا في 2026-08-16 من endpoint: `https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5`
- الاستجابة أعادت HTTP/API code 200 وحقول `data.timings` التي تشمل `Fajr`, `Dhuhr`, `Asr`, `Maghrib`, و`Isha`، إضافة إلى بيانات التاريخ الهجري والميلادي.
- لا يحتاج endpoint المستخدم في الاختبار إلى API key.
- التطبيق يخزن تقدم المستخدم وإعدادات المدينة فقط، ولا يخزن نصوصًا دينية خارجية موثوقة كنص محلي.
- يجب عرض حالة فشل الشبكة بوضوح والاحتفاظ بآخر مواقيت محلية بدل جعل الصفحة بيضاء.
