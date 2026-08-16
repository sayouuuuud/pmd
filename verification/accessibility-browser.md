# Accessibility browser verification

- تم فتح Dashboard محليًا على `/` وتأكد ظهور عناصر القشرة الرئيسية RTL.
- تم فتح Quick Add من زر «إضافة سريعة» وتأكد ظهور عنوان الحوار، أزرار الأنواع الأربعة، وحالة التركيز الأولية على حقل الإدخال.
- تم إغلاق Quick Add باستخدام مفتاح Escape، وعادت الصفحة للحالة العادية دون بقاء طبقة الحوار.
- تم تفعيل `aria-haspopup="dialog"` لزر Quick Add، و`aria-labelledby` للحوار، و`aria-pressed` لأزرار الأنواع، و`aria-current="page"` للرابط النشط.
- تمت إضافة حالة `focus-visible` عامة تعتمد على token `--ring` في `app/globals.css`.

## ملاحظات

- لا توجد أخطاء runtime ظاهرة أثناء الاختبار.
- ما زال هناك 6 تحذيرات ESLint قديمة وغير حاجزة، دون أخطاء جديدة من دفعة Accessibility.
