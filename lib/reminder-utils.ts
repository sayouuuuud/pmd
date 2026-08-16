export const reminderRepeatLabels = ['يوميًا', 'أسبوعيًا', 'شهريًا'] as const

export type ReminderRepeatLabel = (typeof reminderRepeatLabels)[number]

const repeatAliases: Record<string, ReminderRepeatLabel> = {
  'يومي': 'يوميًا',
  'يوميًا': 'يوميًا',
  'يوميا': 'يوميًا',
  'أسبوعي': 'أسبوعيًا',
  'أسبوعيًا': 'أسبوعيًا',
  'أسبوعيا': 'أسبوعيًا',
  'اسبوعي': 'أسبوعيًا',
  'اسبوعيًا': 'أسبوعيًا',
  'اسبوعيا': 'أسبوعيًا',
  'شهري': 'شهريًا',
  'شهريًا': 'شهريًا',
  'شهريا': 'شهريًا',
}

export function normalizeReminderRepeatLabel(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed ? repeatAliases[trimmed] ?? trimmed : undefined
}

export function nextReminderDueAt(repeatLabel: string | null | undefined, fallback: string): string {
  const normalized = normalizeReminderRepeatLabel(repeatLabel)
  if (normalized === 'يوميًا') return 'غدًا'
  if (normalized === 'أسبوعيًا') return 'الأسبوع القادم'
  if (normalized === 'شهريًا') return 'الشهر القادم'
  return fallback
}
