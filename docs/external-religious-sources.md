# مصادر القسم الديني

## AlAdhan Prayer Times API

- المصدر الرسمي: https://aladhan.com/prayer-times-api
- تم التحقق فعليًا في 2026-08-16 من endpoint: `https://api.aladhan.com/v1/timingsByCity?city=Cairo&country=Egypt&method=5`
- الاستجابة أعادت HTTP/API code 200 وحقول `data.timings` التي تشمل `Fajr`, `Dhuhr`, `Asr`, `Maghrib`, و`Isha`، إضافة إلى بيانات التاريخ الهجري والميلادي.
- لا يحتاج endpoint المستخدم في الاختبار إلى API key.
- التطبيق يخزن تقدم المستخدم وإعدادات المدينة فقط، ولا يخزن نصوصًا دينية خارجية موثوقة كنص محلي.
- يجب عرض حالة فشل الشبكة بوضوح والاحتفاظ بآخر مواقيت محلية بدل جعل الصفحة بيضاء.

## نص القرآن والتلاوات

- توثيق نص القرآن: https://alquran.cloud/api — التوثيق الرسمي يعرض REST API Reference، وسيُستخدم endpoint `https://api.alquran.cloud/v1/surah/{surah}/ar.alafasy` أو edition عربية موثوقة بعد اختبار الاستجابة.
- توثيق التلاوات: https://www.mp3quran.net/ar/api — يوضح API الرسمي كتالوج القراء و`moshaf` وروابط الخوادم المباشرة للسور، ومنها `https://www.mp3quran.net/api/v3/reciters?language=ar`.
- توثيق توقيت الآيات وكتالوج القراء: https://www.mp3quran.net/ar/timing-api — يتضمن واجهات القراء والمصاحف والسور والتوقيتات.
- تم التحقق من أن التطبيق يجب أن يعرض المصدر ويجلب المحتوى عند الحاجة، ويخزن تقدم المستخدم ومفضلاته فقط، لا نصوص القرآن أو ملفات الصوت محليًا كنصوص موثوقة.
