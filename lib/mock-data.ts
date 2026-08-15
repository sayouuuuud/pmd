// بيانات تجريبية مؤقتة — سيتم استبدالها بالبيانات الحقيقية من قاعدة البيانات في المرحلة 5

export const todayTasks = [
  { id: 1, title: 'مراجعة تقرير الشغل الأسبوعي', done: true, priority: 'high' as const },
  { id: 2, title: 'الرد على رسائل البريد المتأخرة', done: true, priority: 'medium' as const },
  { id: 3, title: 'تحضير عرض تقديمي للمشروع', done: false, priority: 'high' as const },
  { id: 4, title: 'حجز موعد الدكتور', done: false, priority: 'low' as const },
  { id: 5, title: 'شراء مستلزمات البيت', done: false, priority: 'medium' as const },
]

export const taskStatusData = [
  { name: 'لم تبدأ', value: 12, color: '#2e6bf6' },
  { name: 'جاري العمل', value: 8, color: '#a8c4f9' },
  { name: 'متوقفة', value: 3, color: '#8b7ff0' },
  { name: 'مكتملة', value: 27, color: '#4caf6e' },
]

export const weeklyTrendData = [
  { day: 'سبت', tasks: 5, habits: 3, mood: 4 },
  { day: 'أحد', tasks: 7, habits: 4, mood: 5 },
  { day: 'إثنين', tasks: 4, habits: 2, mood: 3 },
  { day: 'ثلاثاء', tasks: 8, habits: 5, mood: 4 },
  { day: 'أربعاء', tasks: 6, habits: 4, mood: 4 },
  { day: 'خميس', tasks: 9, habits: 5, mood: 5 },
  { day: 'جمعة', tasks: 3, habits: 3, mood: 5 },
]

export const prayers = [
  { name: 'الفجر', time: '04:32', status: 'ontime' as const },
  { name: 'الظهر', time: '12:15', status: 'ontime' as const },
  { name: 'العصر', time: '15:45', status: 'ontime' as const },
  { name: 'المغرب', time: '18:50', status: 'upcoming' as const },
  { name: 'العشاء', time: '20:20', status: 'upcoming' as const },
]

export const pinnedNotes = [
  { id: 1, title: 'أفكار مشروع التطبيق الجديد', excerpt: 'لازم أراجع الفكرة بتاعة الاشتراكات وأشوف التسعير المناسب...', tag: 'شغل' },
  { id: 2, title: 'قائمة مشتريات رمضان', excerpt: 'تمر، سمبوسة، عصائر، وحاجات تانية للسحور...', tag: 'شخصي' },
]

export const dailyReminder = {
  arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
  translation: 'ومن يتق الله يجعل له من كل أمر ييسره ويسهله',
  source: 'سورة الطلاق - آية ٢',
}

export const statCards = {
  tasks: { value: 4, total: 12, trend: '+8%', trendTone: 'positive' as const, footer: 'باقي 4 مهام النهاردة' },
  prayers: { value: 3, total: 5, trend: 'الفجر ✓', trendTone: 'positive' as const, footer: 'باقي المغرب والعشاء' },
  habits: { value: 5, total: 7, trend: '+2', trendTone: 'positive' as const, footer: 'التزام هذا الأسبوع' },
  spendingWeek: [
    { v: 40 }, { v: 55 }, { v: 30 }, { v: 70 }, { v: 45 }, { v: 90 }, { v: 60 },
  ],
  spendingTotal: '٦٤٠',
  spendingTrend: '-12%',
}

export const habitsToday = [
  { label: 'قراءة القرآن', done: true },
  { label: 'رياضة', done: true },
  { label: 'شرب مياه كفاية', done: true },
  { label: 'قراءة كتاب', done: false },
  { label: 'نوم بدري', done: false },
]
