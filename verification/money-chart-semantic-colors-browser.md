# تحقق ألوان مخطط المال الدلالية — 2026-08-16

## النطاق

استُبدلت ألوان مخطط المصروفات السداسية المباشرة في `components/money/money-workspace.tsx` بتوكنات `chart-blue` و`chart-teal` و`chart-amber` و`chart-red` و`chart-violet` و`chart-pink` و`chart-emerald` و`chart-slate` المعرفة في `app/globals.css` ومربوطة بـTailwind.

## الفحص

فُتحت `http://localhost:3004/money` بصريًا. ظهر donut توزيع التصنيفات وشرح النسب والشرائط بألوان الأزرق والأخضر المزرق والذهبي، مع بقاء ملخص الميزانية والمقارنة الشهرية واتجاه RTL كما هي. راجعت console بعد التحميل؛ ظهرت رسائل React DevTools وHMR الطبيعية فقط، دون أخطاء runtime أو hydration.

## السلامة

لم يتغير حساب النسب أو البيانات أو صيغة المخطط، ولم تُضف migrations أو secrets. التغيير يزيل القيم السداسية من منطق المكوّن ويجعلها قابلة للمراجعة من طبقة التوكنز.

**الحالة: PASS.**
